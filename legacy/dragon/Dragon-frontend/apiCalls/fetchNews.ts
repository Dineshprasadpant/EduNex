// services/news.service.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface NewsItem {
  _id: string;
  title: string;
  image?: string;
  publishedDate: string;
  publisher: string;
  content: string[];
  category?: string;
}

interface PaginatedResponse {
  data: NewsItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface ResourceMaterial {
    materialName: string;
    fileType: string;
    fileSize: number;
    url: string;
  }
  
  export interface NewsItemDetail {
    _id: string;
    title: string;
    image?: string;
    publishedDate: string;
    publisher: string;
    content: string[];
    resourceMaterials: ResourceMaterial[];
    subInformation: any[]; 
    createdAt: string;
    updatedAt: string;
    __v: number;
    id: string;
  }
  

export const NewsService = {
  async getNewsList(page: number = 1, limit: number = 10): Promise<PaginatedResponse> {
    try {
      const url = new URL(`${BASE_URL}/news`);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', limit.toString());

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching news list:', error);
      throw error;
    }
  },

  async getNewsById(id: string): Promise<NewsItemDetail> {
    try {
      const response = await fetch(`${BASE_URL}/news/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching news by ID:', error);
      throw error;
    }
  }
};

