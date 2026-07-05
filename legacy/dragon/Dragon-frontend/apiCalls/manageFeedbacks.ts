// src/services/apiCall.ts
interface ApiResponse<T> {
    status: 'success' | 'error';
    data?: T;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    message?: string;
  }

  import Cookies from "js-cookie";

  interface DeleteResponse{
    success: boolean;
    message: string
  }
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const getAuthHeaders = () => {
  const token = Cookies.get("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};
  
  export const fetchFeedbacks = async (page: number, limit: number = 10): Promise<ApiResponse<any[]>> => {
    try {
      const response = await fetch(`${BASE_URL}/feedbacks?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      throw error;
    }
  };
  
  export const deleteFeedback = async (feedbackId: string): Promise<DeleteResponse> => {
    try {
      const response = await fetch(`${BASE_URL}/feedbacks/${feedbackId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  };