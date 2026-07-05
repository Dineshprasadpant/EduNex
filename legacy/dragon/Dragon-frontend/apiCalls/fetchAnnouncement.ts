export interface AnnouncementApiResponse {
    _id: string;
    title: string;
    image: string;
    content: string[];
    cta: {
      title: string;
      description: string;
      buttons: {
        buttonName: string;
        href: string;
      }[];
    };
    resourceMaterials: {
      materialName: string;
      fileType: string;
      fileSize: number;
      url: string;
    }[];
    subInformation: {
      title: string;
      bulletPoints: string[];
      description: string;
    }[];
    announcedDate: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
    id: string;
  }
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
export interface Announcement {
    _id: string;
    title: string;
    image: string;
    content: string[];
    announcedDate: string;
    id: string;
  }
  
  export interface ApiResponse {
    data: {
      total: number;
      page: number;
      limit: number;
      announcements: Announcement[];
    };
  }
  
  export const fetchAnnouncements = async (page: number = 1, limit: number = 10): Promise<ApiResponse> => {
    const response = await fetch(`${BASE_URL}/announcements?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch announcements');
    }
    return response.json();
  };




export const fetchAnnouncementById = async (id: string): Promise<AnnouncementApiResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/announcements/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching announcement:', error);
    throw error;
  }
};