import { toast } from 'react-hot-toast';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ApiResponse {
  message: string;
}

export const subscribeEmail = async (email: string): Promise<void> => {
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    toast.error('Please enter a valid email address');
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data: ApiResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Subscription failed');
    }

    toast.success(data.message || 'Subscribed successfully!');
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('An unknown error occurred');
    }
  }
};