import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface Event {
    location: any;
    priority: string;
    _id: string;
    title: string;
    description: string;
    event_type: string;
    month: string;
    year: string;
    organizer: {
        name: string;
        email: string;
        phone: string;
        website: string;
    };
    start_date: string;
    end_date: string;
    venue: {
        name: string;
        address: string;
    };
    resourceMaterials: {
        materialName: string;
        fileType: string;
        fileSize: number;
        url: string;
    }[];
    extraInformation: {
        title: string;
        description: string;
    }[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
    id: string;
}

const token = Cookies.get("token");

/**
 * Fetches events by month and year
 * @param month Month name (e.g., "January")
 * @param year Year (e.g., "2025")
 * @returns Promise with events array
 */
export const getEventsByMonthAndYear = async (month: string, year: string): Promise<Event[]> => {
    try {
        const response = await fetch(`${BASE_URL}/events/get/byMonthAndYear?month=${month}&year=${year}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch events");
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error("Fetch events error:", error);
        throw error;
    }
};

/**
 * Fetches a single event by ID
 * @param eventId Event ID
 * @returns Promise with event details
 */
export const getEventById = async (eventId: string): Promise<Event> => {
    try {
        const response = await fetch(`${BASE_URL}/events/${eventId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch event");
        }

        return await response.json();
    } catch (error) {
        console.error("Fetch event error:", error);
        throw error;
    }
};

/**
 * Updates an event
 * @param eventId Event ID
 * @param updatedFields Object with fields to update
 * @returns Promise with updated event
 */
export const updateEvent = async (eventId: string, updatedFields: Partial<Event>): Promise<Event> => {
    try {
        const response = await fetch(`${BASE_URL}/events/${eventId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updatedFields),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to update event");
        }
        return await response.json();
    } catch (error) {
        console.error("Update event error:", error);
        throw error;
    }
};

/**
 * Deletes an event
 * @param eventId Event ID
 * @returns Promise with deleted event
 */
export const deleteEvent = async (eventId: string): Promise<Event> => {
    try {
        const response = await fetch(`${BASE_URL}/events/${eventId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete event");
        }

        return await response.json();
    } catch (error) {
        console.error("Delete event error:", error);
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