// src/api/courseApi.ts
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface LearningFormat {
  name: string;
  description: string;
}

interface CurriculumItem {
  title: string;
  duration: number;
  description: string;
}

interface ScheduleItem {
  day: string;
  startTime: string;
  endTime: string;
}

interface CourseData {
  title: string;
  description: string[];
  teachersCount: number;
  courseHighlights: string[];
  overallHours: number;
  moduleLeader: string;
  category: string;
  learningFormat: LearningFormat[];
  curriculum: CurriculumItem[];
  featuredImage: string;
  priority: 'high' | 'medium' | 'low';
  deliveryMode: 'online' | 'offline' | 'hybrid';
  onlinePrice: number;
  offlinePrice: number;
  schedule: ScheduleItem[];
}

export const createCourse = async (courseData: CourseData) => {
  try {
    const token = Cookies.get('token');
    if (!token) throw new Error('Authentication token not found');

    const response = await fetch(`${API_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(courseData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create course');
    }

    return data.data;
  } catch (error: any) {
    toast.error(error.message);
    throw error;
  }
};