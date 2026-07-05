// types.ts
export type CourseCategory =
  | "All Courses"
  | "Engineering Entrance Preparation"
  | "Management Entrance Preparation";

export type Course = {
  _id: string;
  title: string;
  description: string[];
  category: string; // Changed from CourseCategory to string based on API response
  studentsEnrolled: number;
  teachersCount: number;
  overallHours: number;
  price: number;
  onlinePrice: number;
  offlinePrice: number;
  moduleLeader: string;
  courseHighlights: string[];
  curriculum: Array<{
    title: string;
    duration: number;
    description: string;
  }>;
  learningFormat: Array<{
    name: string;
    description: string;
  }>;
  image?: string;
  deliveryMode: "online" | "offline" | "hybrid";
  schedule: Array<{
    day: string;
    startTime: string;
    endTime: string;
    medium: string;
  }>;
  priority: "low" | "medium" | "high";
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

export type ApiResponse = {
  status: string;
  data: {
    courses: Course[];
    pagination: {
      currentPage: number;
      itemsPerPage: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const fetchCourses = async (
  page: number = 1,
  limit: number = 9
): Promise<ApiResponse> => {
  const url = `${BASE_URL}/courses?page=${page}&limit=${limit}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch courses: ${response.status}`);
  }

  const data: ApiResponse = await response.json();

  if (data.status !== "success" || !data.data) {
    throw new Error("Received unexpected data format from the server");
  }

  return data;
};