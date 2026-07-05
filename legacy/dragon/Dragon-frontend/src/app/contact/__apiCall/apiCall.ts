// src/services/apiCallService.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const apiCallService = {
  async sendContactEmail(formData: any, captchaToken: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/mail/sendmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          captchaToken
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending contact email:', error);
      throw error;
    }
  }
};