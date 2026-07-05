export interface Advertisement {
    _id: string;
    title: string;
    description: string;
    imageUrl: string;
    linkUrl: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface ApiResponse {
    totalObjects: number;
    totalPages: number;
    currentPage: number;
    currentObjects: Advertisement[];
  }
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  export const fetchAdvertisements = async (page: number = 1, limit: number = 2): Promise<ApiResponse> => {
    const response = await fetch(`${BASE_URL}/advertisements?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch advertisements');
    }
    return response.json();
  };