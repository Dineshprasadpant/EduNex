import { toast } from "react-hot-toast";

// Define types for our API responses
export interface EventOrganizer {
  name: string;
  email: string;
  phone: string;
}

export interface EventVenue {
  name: string;
  address: string;
}
interface ExtraInformation {
  title?: string;
  description?: string;
}

interface ResourceMaterial {
  materialName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  event_type: string;
  month: string;
  year: string;
  organizer: EventOrganizer;
  start_date: string;
  end_date: string;
  venue: EventVenue;
  location?: string; // For backward compatibility
 resourceMaterials?: ResourceMaterial[];
  
  extraInformation: ExtraInformation[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  priority?: string; // Added for UI coloring
  __v: number;
  id: string;
}

export interface EventsResponse {
  data: Event[];
  total: number;
  page: number;
  limit: number;
}

// Base URL for API calls
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Function to fetch all events
export const fetchEvents = async (month: string, year:string): Promise<Event[]> => {
  try {
    const response = await fetch(`${BASE_URL}/events/get/byMonthAndYear?month=${month}&year=${year}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status}`);
    }
    
    const data: EventsResponse = await response.json();
    
    // Transform the data to include priority
    return data.data.map(event => ({
      ...event,
      location: event.venue?.name || 'No location provided',
      priority: getPriorityFromType(event.event_type)
    }));
  } catch (error) {
    toast.error("Failed to fetch events. Please try again later.");
    console.error("Error fetching events:", error);
    return [];
  }
};

// Function to fetch a single event by ID
export const fetchEventById = async (eventId: string): Promise<Event | null> => {
  try {
    const response = await fetch(`${BASE_URL}/events/${eventId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch event: ${response.status}`);
    }
    
    const event: Event = await response.json();
    
    return {
      ...event,
      location: event.venue?.name || 'No location provided',
      priority: getPriorityFromType(event.event_type)
    };
  } catch (error) {
    toast.error("Failed to fetch event details. Please try again later.");
    console.error("Error fetching event:", error);
    return null;
  }
};

// Helper function to determine priority from event type
const getPriorityFromType = (type: string): string => {
  const eventType = typeof type === 'string' ? type.toLowerCase() : 'default';
  
  switch (eventType) {
    case 'important':
    case 'urgent':
    case 'conference':
      return 'high';
    case 'workshop':
    case 'meeting':
      return 'medium';
    case 'social':
    case 'networking':
      return 'low';
    default:
      return 'default';
  }
};