import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface AdvertisementData {
    title: string;
    description: string;
    imageUrl: string;
    linkUrl: string;
}

export const createAdvertisement = async (data: AdvertisementData) => {
    const token = Cookies.get("token");
    
    try {
        const response = await fetch(`${BASE_URL}/advertisements`, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to create advertisement");
        }

        return await response.json();
    } catch (error) {
        console.error("Advertisement creation error:", error);
        throw error;
    }
};

export const handleApiError = (error: unknown) => {
    const message = error instanceof Error ? error.message : "Failed to create advertisement";
    toast.error(message, {
        style: {
            background: '#FF3333',
            color: '#fff',
        },
        iconTheme: {
            primary: '#fff',
            secondary: '#FF3333',
        },
    });
};