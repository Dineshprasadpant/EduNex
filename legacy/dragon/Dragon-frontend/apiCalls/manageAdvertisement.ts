import Cookies from "js-cookie";
import { uploadFile } from "../apiCalls/fileUpload";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const token = Cookies.get("token");

export interface Advertisement {
    _id: string;
    title: string;
    description: string;
    imageUrl: string;
    linkUrl: string;
}

interface ApiResponse {
    currentObjects: Advertisement[];
    totalPages: number;

}

export const fetchAdvertisements = async (page: number, limit: number): Promise<ApiResponse> => {
    const response = await fetch(
        `${API_URL}/advertisements?page=${page}&limit=${limit}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to fetch advertisements.");
    }

    return response.json();
};

export const updateAdvertisement = async (id: string, adData: Partial<Advertisement>): Promise<void> => {
    const response = await fetch(
        `${API_URL}/advertisements/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(adData),
        }
    );

    if (!response.ok) {
        throw new Error("Failed to update advertisement.");
    }
};

export const deleteAdvertisement = async (id: string): Promise<void> => {
    const response = await fetch(
        `${API_URL}/advertisements/${id}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        throw new Error("Failed to delete advertisement.");
    }
};

export const handleFileUpload = async (file: File): Promise<{ url: string }> => {
    const result = await uploadFile(file);
    if (!result.success) {
        throw new Error(result.message || "Failed to upload image");
    }
    return { url: result.data.url };
};