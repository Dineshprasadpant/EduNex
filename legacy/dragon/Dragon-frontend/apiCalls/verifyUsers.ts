import { StringGradients } from 'antd/es/progress/progress';
import Cookies from 'js-cookie';

interface ExamResult {
  examName: string;
  totalQuestions: number;
  correctAnswers: number;
}

export interface User {
  platformPreference: string;
  planUpgradedFrom: any;
  paymentImage: any;
  _id: string;
  fullname: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  courseEnrolled: {
    _id: string;
    title: string;
  };
  citizenshipImageUrl: string;
  plan: string;
  examsAttended: ExamResult[];
  createdAt: string;
  __v: number;
  batch?: {
    _id: string;
    batch_name: string;
  };
}

export interface UserBody {
  _id: string;
  fullname: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  courseEnrolled: {
    _id: string;
    title: string;
  };
  citizenshipImageUrl: string;
  plan: string;
  examsAttended: ExamResult[];
  createdAt: string;
  __v: number;
  batch?: string;
}

export interface Batch {
  _id: string;
  batch_name: string;
  course: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface UsersResponse {
  success: boolean;
  count: number;
  users: User[];
}

interface SearchResponse {
  success: boolean;
  data: {
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  };
}

interface BatchesResponse {
  data: Batch[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    totalPages: number;
  };
}

export class UserApiService {
  private static API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  private static getAuthHeaders() {
    const token = Cookies.get('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  static async getBatches(page = 1, limit = 10): Promise<BatchesResponse> {
    try {
      const response = await fetch(`${this.API_URL}/batches?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Error fetching batches: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch batches:', error);
      throw error;
    }
  }

  static async getUnverifiedUsers(page = 1, limit = 10): Promise<UsersResponse> {
    try {
      const response = await fetch(`${this.API_URL}/users/unverified?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Error fetching unverified users: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch unverified users:', error);
      throw error;
    }
  }

  static async getVerifiedUsers(page = 1, limit = 10): Promise<UsersResponse> {
    try {
      const response = await fetch(`${this.API_URL}/users/verified?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Error fetching verified users: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch verified users:', error);
      throw error;
    }
  }

  static async verifyUser(userId: string, batchId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.API_URL}/users/verify/${userId}/batch/${batchId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error verifying user: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to verify user ${userId}:`, error);
      throw error;
    }
  }


  static async searchUsers(query: string, page = 1, limit = 10): Promise<SearchResponse> {
    try {
      const response = await fetch(
        `${this.API_URL}/users/search?name=${query}&page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error(`Error searching users: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to search users:', error);
      throw error;
    }
  }

  static async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error deleting user: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to delete user ${userId}:`, error);
      throw error;
    }
  }

  static async updateUser(
    userId: string,
    userData: Partial<UserBody>
  ): Promise<{ success: boolean; message: string; user: User }> {
    try {
      const response = await fetch(`${this.API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error(`Error updating user: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to update user ${userId}:`, error);
      throw error;
    }
  }

  static async resetPassword(
    userId: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.API_URL}/users/${userId}/reset-password`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        throw new Error(`Error resetting password: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to reset password for user ${userId}:`, error);
      throw error;
    }
  }
}