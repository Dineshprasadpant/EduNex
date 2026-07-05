// apiCall.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
export interface CourseSummary {
    offlinePrice: any;
    onlinePrice: any;
    deliveryMode: string;
    _id: string;
    title: string;
    image: string;
    studentsEnrolled: number;
    teachersCount: number;
    overallHours: number;
    moduleLeader: string;
    category: string;
    price: number;
  }
  
  export interface Pagination {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }
  
  export interface ApiResponse {
    status: string;
    data: {
      courses: CourseSummary[];
      pagination: Pagination;
    };
  }
  
export const fetchCoursesByDeliveryMode = async (
  mode: 'online' | 'offline' | 'hybrid',
  page: number = 1,
  limit: number = 10
): Promise<ApiResponse> => {
  const response = await fetch(`${BASE_URL}/courses/deliveryMode/${mode}?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }
  return response.json();
};

  export const fetchCourses = async (page: number = 1, limit: number = 10): Promise<ApiResponse> => {
    const response = await fetch(`${BASE_URL}/courses/summary?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }
    return response.json();
  };
  