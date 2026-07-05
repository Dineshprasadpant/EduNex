// api/auth.ts
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const handleSuccessfulLogin = (data: any, email: string, rememberMe: boolean) => {
  const token = data.token || '';
  const user = data.user || {};
  
  // Save to cookies
  Cookies.set("token", token);
  Cookies.set("user", JSON.stringify(user));
  
  // Save to localStorage
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  // Handle remember me
  if (rememberMe) {
    localStorage.setItem('rememberedEmail', email);
  } else {
    localStorage.removeItem('rememberedEmail');
  }
  
  return user;
};

export const handleApiError = (error: any) => {
  console.error('API error details:', error);
  
  if (error instanceof TypeError) {
    if (error.message.includes('fetch')) {
      toast.error('Cannot connect to the server.');
      return;
    }
  }
  
  if (error.message) {
    toast.error(error.message);
  } else {
    toast.error('An unexpected error occurred. Please try again.');
  }
};