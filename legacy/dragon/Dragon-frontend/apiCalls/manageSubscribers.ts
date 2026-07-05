// services/subscriberService.ts
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const getAuthHeaders = () => {
  const token = Cookies.get("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

interface Subscriber {
  _id: string;
  email: string;
  createdAt?: string;
}

interface PaginatedResponse {
  data: Subscriber[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export const fetchSubscribers = async (page: number = 1, limit: number = 10): Promise<PaginatedResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/subscribers?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  });
    if (!response.ok) {
      throw new Error('Failed to fetch subscribers');
    }
    return await response.json();
  } catch (error) {
    toast.error('Failed to fetch subscribers');
    throw error;
  }
};

export const searchSubscriber = async (email: string): Promise<Subscriber> => {
  try {
    const response = await fetch(`${BASE_URL}/subscribers/getUser/${email}`, {
    headers: getAuthHeaders(),
  });
    if (!response.ok) {
      throw new Error('Subscriber not found');
    }
    return await response.json();
  } catch (error) {
    toast.error('Subscriber not found');
    throw error;
  }
};

export const deleteSubscriber = async (email: string): Promise<void> => {
  try {
    const response = await fetch(`${BASE_URL}/subscribers/${email}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete subscriber');
    }
    toast.success(data.message || 'Subscriber deleted successfully');
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('Failed to delete subscriber');
    }
    throw error;
  }
};