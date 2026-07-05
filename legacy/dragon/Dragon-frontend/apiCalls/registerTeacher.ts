import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
}

export const apiService = {
  async request(endpoint: string, method: string, data?: any): Promise<ApiResponse> {
    const token = Cookies.get('token');
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error instanceof Error ? error : new Error('Network request failed');
    }
  },

  async registerTeacher(teacherData: any): Promise<ApiResponse> {
    return this.request('/users/registerTeachers', 'POST', teacherData);
  },
};