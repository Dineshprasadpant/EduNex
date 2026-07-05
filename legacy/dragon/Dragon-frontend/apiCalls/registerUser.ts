const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const registerUser = async (formData: FormData): Promise<{
  success: boolean;
  message: string;
  userId: string;
}> => {
  const response = await fetch(`${BASE_URL}/users/register`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to register user');
  }

  return response.json();
};