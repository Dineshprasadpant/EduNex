import Cookies from 'js-cookie';

const base_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const getClassMaterialsByBatchId = async (
  batchId: string,
  page: number,
  limit: number
) => {
  try {
    // 1. Get JWT token from cookies
    const token = Cookies.get('token'); // Replace 'authToken' with your cookie name

    if (!token) {
      throw new Error('No authentication token found');
    }

    // 2. Pass token in the Authorization header
    const response = await fetch(
      `${base_url}/classMaterial/batch/${batchId}?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching class materials:', error);
    throw error;
  }
};