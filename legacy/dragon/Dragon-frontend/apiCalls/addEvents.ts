import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Type definitions
export interface Organizer {
  name: string;
  email: string;
  phone: string;
}

export interface Venue {
  name: string;
  address: string;
}

export interface ResourceMaterial {
  materialName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

export interface ExtraInformation {
  title: string;
  description: string;
}

// Updated EventData interface to match new API format
export interface EventData {
  title: string;
  description: string;
  event_type: string;
  organizer: Organizer;
  start_date: string;
  end_date: string;
  venue: Venue;
  resourceMaterials?: ResourceMaterial[];
  extraInformation?: ExtraInformation[];
}

const token = Cookies.get("token");

/**
 * Creates a new event
 * @param eventData Complete event data
 * @returns Promise with created event or error
 */
export const createEvent = async (eventData: EventData): Promise<EventData> => {
  try {
    const response = await fetch(`${BASE_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create event");
    }

    return await response.json();
  } catch (error) {
    console.error("Event creation error:", error);
    throw error;
  }
};

/**
 * Handles API errors and shows toast notifications
 * @param error Error object
 * @param defaultMessage Default error message
 */
export const handleApiError = (error: unknown, defaultMessage: string) => {
  const message = error instanceof Error ? error.message : defaultMessage;
  toast.error(message);
};