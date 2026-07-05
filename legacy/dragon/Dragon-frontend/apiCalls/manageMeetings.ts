// src/apiCalls/batchMeetings.ts
"use client";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Get token from localStorage
const getToken = () => Cookies.get('token');

export interface MeetingData {
  title: string;
  meeting_link: string;
  date: string;
  time: string;
  expiryTime: string;
  duration_minutes: number;
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BatchWithMeetings {
  _id: string;
  batch_name: string;
  course: string | null;
  scheduled_meetings: MeetingData[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Get batch with meetings
export async function getBatchWithMeetings(
  batchId: string
): Promise<{ success: boolean; data?: BatchWithMeetings; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/batches/${batchId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || "Failed to fetch batch meetings";
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching batch meetings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Update meeting
export async function updateBatchMeeting(
  batchId: string,
  meetingId: string,
  meetingData: MeetingData
): Promise<{ success: boolean; data?: BatchWithMeetings; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/batches/${batchId}/meetings/${meetingId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(meetingData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || "Failed to update meeting";
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Meeting update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Delete meeting
export async function deleteBatchMeeting(
  batchId: string,
  meetingId: string
): Promise<{ success: boolean; data?: BatchWithMeetings; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/batches/${batchId}/meetings/${meetingId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || "Failed to delete meeting";
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Meeting deletion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}