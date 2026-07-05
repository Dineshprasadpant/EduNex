// services/questionSheetService.ts
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = Cookies.get("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Types
export interface Question {
  question: string;
  correctAnswer: string;
  answers: string[];
  difficulty?: "easy" | "medium" | "hard";
  marks?: number;
}

export interface QuestionSheet {
  _id: string;
  sheetName: string;
  questions: Question[];
  createdAt?: string;
  updatedAt?: string;
}


export const fetchQuestionSheet = async (page: number = 1) => {
  const response = await fetch(`${API_URL}/questionsheets?page=${page}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch question sheets");
  }

  return response.json();
};

export const updateQuestionSheet = async (sheetId: string, sheetData: Partial<QuestionSheet>) => {
  const response = await fetch(`${API_URL}/questionsheets/${sheetId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(sheetData),
  });

  if (!response.ok) {
    throw new Error("Failed to update question sheet");
  }

  return await response.json();
};

export const deleteQuestionSheet = async (sheetId: string) => {
  const response = await fetch(`${API_URL}/questionsheets/${sheetId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete question sheet");
  }

  return await response.json();
};