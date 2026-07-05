import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Batch {
  _id: string;
  batch_name: string;
  course: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ClassMaterial {
  material_id: string;
  title: string;
  description: string;
  file_url: string;
  batches: string[];
}

interface BatchResponse {
  data: Batch[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    totalPages: number;
  };
}

const token = Cookies.get("token");

/**
 * Fetches batches with pagination
 * @param page Page number
 * @param limit Items per page
 * @returns Promise with batches data
 */
export const getBatches = async (page = 1, limit = 10): Promise<BatchResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/batches?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch batches");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch batches error:", error);
    throw error;
  }
};

/**
 * Creates a new class material
 * @param materialData Class material data
 * @returns Promise with created material
 */
export const createClassMaterial = async (materialData: ClassMaterial): Promise<ClassMaterial> => {
  try {
    const response = await fetch(`${BASE_URL}/classMaterial`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(materialData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create material");
    }
    return await response.json();
  } catch (error) {
    console.error("Create material error:", error);
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