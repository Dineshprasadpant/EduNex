"use client";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Get token from localStorage
const getToken = () => Cookies.get("token");

export interface MeetingData {
  title: string;
  meeting_link: string;
  date: string;
  time: string;
  expiryTime: string;
  duration_minutes: number;
}

export async function scheduleBatchMeeting(
  batchId: string,
  meetingData: MeetingData
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/batches/${batchId}/meetings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(meetingData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || "Failed to schedule meeting";
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Meeting scheduling error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}