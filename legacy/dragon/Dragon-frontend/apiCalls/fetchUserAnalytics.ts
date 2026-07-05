import Cookies from "js-cookie";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
// const BASE_URL = "http://localhost:8000/api";

const getAuthHeaders = () => {
  const token = Cookies.get("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
};

export const fetchMonthlyAnalytics = async (month: number, year: number) => {
  try {
    const response = await fetch(`${BASE_URL}/analytics/monthly?month=${month}&year=${year}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch monthly analytics');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching monthly analytics:', error);
    throw error;
  }
};

export const fetchYearlyAnalytics = async (year: number) => {
  try {
    const response = await fetch(`${BASE_URL}/analytics/yearly?year=${year}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch yearly analytics');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching yearly analytics:', error);
    throw error;
  }
};