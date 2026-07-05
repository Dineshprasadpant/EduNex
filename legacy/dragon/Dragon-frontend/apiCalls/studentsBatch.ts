import Cookies from 'js-cookie';

interface LearningFormat {
  name: string;
  description: string;
}

interface CurriculumItem {
  title: string;
  duration: number;
  description: string;
}

interface ScheduledMeeting {
  title: string;
  meeting_link: string;
  date: string;
  time: string;
  expiryTime: string;
  duration_minutes: number;
  _id: string;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  deliveryMode: string;
  schedule: any;
  _id: string;
  title: string;
  description: string[];
  studentsEnrolled: number;
  teachersCount: number;
  courseHighlights: string[];
  overallRating: number;
  overallHours: number;
  moduleLeader: string;
  category: string;
  learningFormat: LearningFormat[];
  price: number;
  curriculum: CurriculumItem[];
  reviews: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  id: string;
}

export interface BatchDetails {
  _id: string;
  batch_name: string;
  course: Course;
  scheduled_meetings: ScheduledMeeting[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export class BatchApiService {
  private static API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  private static getAuthHeaders() {
    const token = Cookies.get('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  static async getBatchDetails(batchId: string): Promise<BatchDetails> {
    try {
      const response = await fetch(`${this.API_URL}/batches/${batchId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Error fetching batch details: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch batch details:', error);
      throw error;
    }
  }
}