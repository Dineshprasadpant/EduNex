import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const getAuthHeaders = () => {
  const token = Cookies.get("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
};

interface PaginationParams {
  page?: number;
  limit?: number;
}

// Batch related APIs
export const fetchBatches = async ({ page = 1, limit = 10 }: PaginationParams = {}) => {
  const response = await fetch(`${BASE_URL}/batches?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch batches');
  return response.json();
};

// Performance related APIs
export const fetchBatchPerformanceSummary = async (batchId: string, academicYear: string) => {
  const response = await fetch(`${BASE_URL}/performance/year/${academicYear}/${batchId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch performance summary');
  return response.json();
};

export const fetchBatchAllPerformance = async (batchId: string) => {
  const response = await fetch(`${BASE_URL}/performance/getByBatchId/${batchId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch all performance data');
  return response.json();
};

export const fetchPerformanceDetails = async (performanceId: string) => {
  const response = await fetch(`${BASE_URL}/performance/${performanceId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch performance details');
  return response.json();
};

// Data export related APIs
export const checkPreviousRecords = async (academicYear: string) => {
  const response = await fetch(`${BASE_URL}/performance/check-previous/${academicYear}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to check previous records');
  return response.json();
};

export const fetchPreviousYearRecords = async (academicYear: string, page: number = 1, limit: number = 10) => {
  const response = await fetch(
    `${BASE_URL}/performance/getPreviousYearRecords/${academicYear}?page=${page}&limit=${limit}`, {
      headers: getAuthHeaders(),
    }
  );
  if (!response.ok) throw new Error('Failed to fetch previous year records');
  return response.json();
};

export const cleanupPreviousRecords = async (academicYear: string) => {
  const response = await fetch(`${BASE_URL}/performance/cleanup/${academicYear}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to cleanup records');
  return response.json();
};

export const fetchYearlyBatchPerformance = async (academicYear: string, batchId: string) => {
  const response = await fetch(`${BASE_URL}/performance/year/${academicYear}/${batchId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch yearly performance');
  return response.json();
};