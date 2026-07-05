"use client";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Get token from cookies
const getToken = () => {
  return Cookies.get("token");
};

export interface ExamData {
  exam_id: string;
  title: string;
  description: string;
  exam_name: string;
  startDateTime: string;
  endDateTime: string;
  total_marks: number;
  pass_marks: number;
  question_sheet_id?: string;
  batches: string[];
}

export interface Batch {
  _id: string;
  batch_name: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionSheet {
  _id: string;
  sheetName: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    totalPages: number;
  };
  pagination?: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Create new exam
export async function createExam(examData: ExamData): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/exams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(examData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || "Failed to create exam";
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Exam creation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Fetch batches with pagination
export async function getBatches(page: number = 1, limit: number = 10): Promise<{ success: boolean; data?: PaginatedResponse<Batch>; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/batches?page=${page}&limit=${limit}`, {
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
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching batches:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Fetch question sheets
export async function getQuestionSheets(page: number = 1, limit: number = 10): Promise<{ success: boolean; data?: PaginatedResponse<QuestionSheet>; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/questionsheets?fields=id,sheetName&page=${page}&limit=${limit}`, {
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
    return { success: true, data: data.data }; // Adjust based on actual API response structure
  } catch (error) {
    console.error("Error fetching question sheets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}