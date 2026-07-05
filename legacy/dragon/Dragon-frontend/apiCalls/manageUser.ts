const base_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const getUserInfo = async (userId: string) => {
  try {
    const response = await fetch(`${base_url}/users/userInfo/${userId}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
};