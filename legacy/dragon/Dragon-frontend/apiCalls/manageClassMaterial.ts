import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Batch {
  _id: string;
  batch_name: string;
}

interface ClassMaterial {
  _id: string;
  material_id: string;
  title: string;
  description: string;
  file_url: string;
  batches: Batch[];
  created_at: string;
  updated_at: string;
}

interface ClassMaterialResponse {
  materials: ClassMaterial[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
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

// Fetch paginated class materials
export const getClassMaterials = async (page = 1, limit = 10): Promise<ClassMaterialResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/classMaterial?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch materials");
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch materials error:", error);
    throw error;
  }
};

// Fetch batches
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

// Update class material
export const updateClassMaterial = async (id: string, materialData: any): Promise<ClassMaterial> => {
  try {
    const response = await fetch(`${BASE_URL}/classMaterial/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(materialData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update material");
    }
    return await response.json();
  } catch (error) {
    console.error("Update material error:", error);
    throw error;
  }
};

// Delete class material
export const deleteClassMaterial = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${BASE_URL}/classMaterial/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete material");
    }
    return await response.json();
  } catch (error) {
    console.error("Delete material error:", error);
    throw error;
  }
};

// Error handler
export const handleApiError = (error: unknown, defaultMessage: string) => {
  const message = error instanceof Error ? error.message : defaultMessage;
  toast.error(message);
};