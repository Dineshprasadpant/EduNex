"use client";
import Cookies from "js-cookie";


export interface NewsData {
  title: string ;
  publisher: string;
  content: string[];
  featuredImage?: string;
  publishedDate: string;
  resourceMaterials: ResourceMaterial[];
}

export interface ResourceMaterial {
  materialName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

export const initialNewsState: NewsData = {
  title: "",
  publisher: "",
  content: [""],
  publishedDate: new Date().toISOString().split('T')[0],
  resourceMaterials: [],
};
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function createNews(newsData: NewsData): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BASE_URL}/news`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Cookies.get('token')}`,
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