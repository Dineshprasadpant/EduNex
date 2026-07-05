"use client";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface NewsData {
  title: string;
  publisher: string;
  content: string[];
  publishedDate: string;
  resourceMaterials: ResourceMaterial[];
  _id?: string;
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  featuredImage: string;
  image?: string
}

export interface ResourceMaterial {
  materialName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

export interface PaginatedNewsResponse {
  data: NewsListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface NewsListItem {
  _id: string;
  id: string;
  title: string;
  publisher: string;
  publishedDate: string;
}

export const initialNewsState: NewsData = {
  title: "",
  publisher: "",
  content: [""],
  publishedDate: new Date().toISOString().split('T')[0],
  resourceMaterials: [],
  featuredImage: ""
};

// Get token from localStorage
const getToken = () => Cookies.get('token');

// Create new news article
export async function createNews(newsData: NewsData): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/news`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(newsData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || "Failed to create news";
      throw new Error(errorMessage);
    }

    return { success: true };
  } catch (error) {
    console.error("News creation error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    };
  }
}

// Get paginated news list
export async function getNewsList(page: number = 1, limit: number = 10): Promise<PaginatedNewsResponse | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/news?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch news list");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching news list:", error);
    return null;
  }
}

// Get single news article by ID
export async function getNewsById(newsId: string): Promise<NewsData | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/news/${newsId}`,
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch news details");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching news details:", error);
    return null;
  }
}

// Update news article
export async function updateNews(newsId: string, newsData: NewsData): Promise<{ success: boolean; data?: NewsData; error?: string }> {
  try {
    const response = await fetch(
      `${BASE_URL}/news/${newsId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(newsData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || "Failed to update news";
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("News update error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Delete news article
export async function deleteNews(newsId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(
      `${BASE_URL}/news/${newsId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || "Failed to delete news";
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (error) {
    console.error("News deletion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}