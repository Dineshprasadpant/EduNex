// src/api/courseApi.ts
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Update the CourseSummary and CourseDetails interfaces
export interface CourseSummary {
  _id: string;
  title: string;
  studentsEnrolled: number;
  teachersCount: number;
  overallRating: number;
  overallHours: number;
  moduleLeader: string;
  category: string;
  price: number;
  priority: 'high' | 'medium' | 'low';
  deliveryMode: 'online' | 'offline' | 'hybrid';
  onlinePrice?: number;
  offlinePrice?: number;
  schedule?: ScheduleItem[];
}


interface ScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
  medium: string;
}

export interface CourseDetails extends CourseSummary {
  imageUrl?: any;
  featuredImage?: any;
  image?: any;
  description: string[];
  courseHighlights: string[];
  learningFormat: LearningFormat[];
  curriculum: CurriculumItem[];
}

interface LearningFormat {
  name: string;
  description: string;
}

interface CurriculumItem {
  title: string;
  duration: number;
  description: string;
}


interface PaginationData {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface CoursesSummaryResponse {
  courses: CourseSummary[];
  pagination: PaginationData;
}

export const fetchCourseSummaries = async (
  page: number = 1,
  limit: number = 10,
  searchTerm: string = ''
): Promise<CoursesSummaryResponse> => {
  try {
    const token = Cookies.get('token');
    if (!token) throw new Error('Authentication token not found');

    const url = `${API_URL}/courses/summary?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch courses');
    }

    return {
      courses: data.data.courses,
      pagination: data.data.pagination
    };
  } catch (error: any) {
    toast.error(error.message);
    throw error;
  }
};

export const fetchCourseById = async (courseId: string): Promise<CourseDetails> => {
  try {
    const token = Cookies.get('token');
    if (!token) throw new Error('Authentication token not found');

    const response = await fetch(`${API_URL}/courses/getById/${courseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch course');
    }

    return data.data;
  } catch (error: any) {
    toast.error(error.message);
    throw error;
  }
};

export const updateCourse = async (courseId: string, courseData: Partial<CourseDetails>): Promise<CourseDetails> => {
  try {
    const token = Cookies.get('token');
    if (!token) throw new Error('Authentication token not found');

    const response = await fetch(`${API_URL}/courses/${courseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(courseData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update course');
    }

    return data.data;
  } catch (error: any) {
    toast.error(error.message);
    throw error;
  }
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    const token = Cookies.get('token');
    if (!token) throw new Error('Authentication token not found');

    const response = await fetch(`${API_URL}/courses/${courseId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete course');
    }

  } catch (error: any) {
    toast.error(error.message);
    throw error;
  }
};