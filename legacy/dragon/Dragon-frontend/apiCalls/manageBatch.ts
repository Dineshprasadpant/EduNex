// src/api/batchApi.ts
'use client';

import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper function for headers
const getAuthHeaders = () => {
  const token = Cookies.get('token');
  if (!token) throw new Error('No authentication token found');
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const fetchCoursesSummary = async (page: number = 1, limit: number = 10) => {
  try {
    const response = await fetch(
      `${API_URL}/courses/summary?page=${page}&limit=${limit}`,
      { headers: getAuthHeaders() }
    );
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.message || 'Failed to fetch courses');
    
    return {
      courses: data.data.courses,
      pagination: data.data.pagination
    };
  } catch (error: any) {
    toast.error(error.message);
    throw error;
  }
};

// Fetch all batches with pagination
export const fetchBatches = async (page: number = 1, limit: number = 10) => {
  try {
    const response = await fetch(
      `${API_URL}/batches?page=${page}&limit=${limit}`,
      { headers: getAuthHeaders() }
    );
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.message || 'Failed to fetch batches');
    
    return {
      batches: data.data,
      pagination: data.meta
    };
  } catch (error: any) {
    toast.error(error.message);
    throw error;
  }
};

// Create new batch
export const createBatch = async (batchData: { batch_name: string; course: string }) => {
  try {
    const response = await fetch(`${API_URL}/batches`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(batchData)
    });
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.message || 'Failed to create batch');

    return data.data;
  } catch (error: any) {
    toast.error(error.message);
    throw error;
  }
};

// Update batch name
export const updateBatch = async (batchId: string, newName: string) => {
  try {
    const response = await fetch(`${API_URL}/batches/${batchId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ batch_name: newName })
    });
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.message || 'Failed to update batch');
    
    toast.success('Batch updated successfully!');
    return data.data;
  } catch (error: any) {
    toast.error(error.message);
    throw error;
  }
};

// Delete batch
export const deleteBatch = async (batchId: string) => {
  try {
    const response = await fetch(`${API_URL}/batches/${batchId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.message || 'Failed to delete batch');
    return data.data;
  } catch (error: any) {
    toast.error(error.message);
    throw error;
  }
};