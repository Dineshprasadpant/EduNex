// apiCalls/addAnnouncement.ts
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface AnnouncementData {
  title: string;
  content: string[];
  resourceMaterials?: {
    materialName: string;
    fileType: string;
    fileSize: number;
    url: string ;
  }[];
  subInformation?: {
    title: string;
    bulletPoints: string[];
    description: string;
  }[];
  cta?: {
    title?: string;
    imageUrl?: string;
    description?: string;
    buttons?: {
      buttonName: string;
      href: string;
    }[];
  };
}

export const createAnnouncement = async (data: AnnouncementData) => {
  const token = Cookies.get("token");
  
  try {
    const response = await fetch(`${BASE_URL}/announcements`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create announcement");
    }

    return await response.json();
  } catch (error) {
    console.error("Announcement creation error:", error);
    throw error;
  }
};

export const handleApiError = (error: unknown, defaultMessage: string) => {
  const message = error instanceof Error ? error.message : defaultMessage;
  toast.error(message);
};