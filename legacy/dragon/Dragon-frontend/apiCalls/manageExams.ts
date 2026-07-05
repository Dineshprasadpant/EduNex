"use client";
import Cookies from "js-cookie";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Get token from cookies
const getToken = () => {
  return Cookies.get("token")
};

export interface Exam {
  _id: string;
  exam_id: string;
  title: string;
  description: string;
  exam_name: string;
  startDateTime: string;
  endDateTime: string;
  total_marks: number;
  pass_marks: number;
  question_sheet_id: {
    _id: string;
    sheetName: string;
  };
  batches: Array<{
    _id: string;
    batch_name: string;
  }>;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface PaginatedExamsResponse {
  success: boolean;
  data: Exam[];
  pagination: {
    totalObjects: number;
    totalPages: number;
    currentPage: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// Get all exams with pagination
export async function getExams(
  page: number = 1, 
  limit: number = 10
): Promise<{ success: boolean; data?: PaginatedExamsResponse; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/exams?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || "Failed to fetch exams";
      throw new Error(errorMessage);
    }

    const data: PaginatedExamsResponse = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching exams:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Update exam
export async function updateExam(
  examId: string,
  examData: {
    exam_id: string;
    title: string;
    description: string;
    exam_name: string;
    startDateTime: string;
    endDateTime: string;
    total_marks: number;
    pass_marks: number;
    question_sheet_id: string;
    batches: string[];
  }
): Promise<{ success: boolean; data?: Exam; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/exams/${examId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(examData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || "Failed to update exam";
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Exam update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Delete exam
export async function deleteExam(
  id: string
): Promise<{ success: boolean; data?: Exam; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/exams/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || "Failed to delete exam";
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Exam deletion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Fetch batches
export async function getBatches(): Promise<{ success: boolean; data?: Array<{_id: string, batch_name: string}>; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/batches?page=1&limit=100`, { // Fetch all batches
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || "Failed to fetch batches";
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { success: true, data: data.data };
  } catch (error) {
    console.error("Error fetching batches:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Fetch question sheets
export async function getQuestionSheets(): Promise<{ success: boolean; data?: Array<{_id: string, sheetName: string}>; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/questionsheets?fields=id,sheetName&page=1&limit=100`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || "Failed to fetch question sheets";
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { success: true, data: data.data.data };
  } catch (error) {
    console.error("Error fetching question sheets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}