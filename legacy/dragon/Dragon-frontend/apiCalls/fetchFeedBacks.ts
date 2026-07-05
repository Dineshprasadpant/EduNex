interface Testimonial {
    _id: string;
    name: string;
    email: string;
    rating: number;
    feedback: string;
    createdAt: string;
    __v: number;
  }
  
  interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  
  interface ApiResponse {
    status: string;
    data: Testimonial[];
    pagination: Pagination;
  }
  
  interface FeedbackData {
    name: string;
    email: string;
    rating: number;
    feedback: string;
  }
  
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  
  export const fetchTestimonials = async (page: number = 1, limit: number = 10): Promise<ApiResponse> => {
    try {
      const response = await fetch(`${BASE_URL}/feedbacks/positive?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch testimonials');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      throw error;
    }
  };
  
  export const submitFeedback = async (feedbackData: FeedbackData): Promise<Testimonial> => {
    try {
      const response = await fetch(`${BASE_URL}/feedbacks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
      return await response.json();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  };