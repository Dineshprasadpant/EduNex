// services/announcementService.ts
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// types/announcement.ts
export interface CTAButton {
  buttonName: string;
  href: string;
}

export interface ResourceMaterial {
  materialName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

export interface SubInformation {
  title: string;
  bulletPoints: string[];
  description: string;
}

export interface CTA {
    title?: string;
    imageUrl?: string;
    description?: string;
    buttons?: CTAButton[];
  }

export interface Announcement {
  _id: string;
  id: string;
  title: string;
  content: string[];
  cta?: CTA;
  resourceMaterials?: ResourceMaterial[];
  subInformation?: SubInformation[];
  announcedDate: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface AnnouncementsResponse {
  data: {
    total: number;
    page: number;
    limit: number;
    announcements: Announcement[];
  };
}

export interface AnnouncementResponse {
  data: Announcement;
}

export interface DeleteAnnouncementResponse {
  message: string;
  announcement: Announcement;
}

const token = Cookies.get("token");

export const fetchAnnouncements = async (page: number, limit = 10): Promise<AnnouncementsResponse> => {
    const response = await fetch(`${BASE_URL}/announcements?page=${page}&limit=${limit}`);
    if (!response.ok) {
        throw new Error('Failed to fetch announcements');
    }
    return response.json();
};

export const fetchAnnouncementDetails = async (id: string): Promise<Announcement> => {
    const response = await fetch(`${BASE_URL}/announcements/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch announcement details');
    }
    return response.json();
};

export const updateAnnouncement = async (id: string, data: Partial<Announcement>): Promise<Announcement> => {
    const response = await fetch(`${BASE_URL}/announcements/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Failed to update announcement');
    }
    return response.json();
};

export const deleteAnnouncement = async (id: string): Promise<{ message: string; announcement: Announcement }> => {
    const response = await fetch(`${BASE_URL}/announcements/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!response.ok) {
        throw new Error('Failed to delete announcement');
    }
    return response.json();
};