'use client';
import { useState, useEffect, Suspense } from 'react';
import { NewsService } from '../../../../apiCalls/fetchNews';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowLeft, View } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

// Date formatting utilities
const formatDate = (dateString: string | Date, options: Intl.DateTimeFormatOptions = {}): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  const mergedOptions = { ...defaultOptions, ...options };
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    console.error('Invalid date:', dateString);
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat('en-US', mergedOptions).format(date);
};

// Add presets
formatDate.short = (dateString: string | Date) =>
  formatDate(dateString, { month: 'short', day: 'numeric' });

formatDate.long = (dateString: string | Date) =>
  formatDate(dateString, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

// This component will safely use useSearchParams inside Suspense
function NewsDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [newsItem, setNewsItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNewsItem() {
      if (!id) {
        window.location.href = '/news';
        return;
      }

      setIsLoading(true);
      try {
        const item = await NewsService.getNewsById(id);
        setNewsItem(item);
      } catch (err) {
        console.error('Failed to fetch news:', err);
        setError('Failed to load the news article');
      } finally {
        setIsLoading(false);
      }
    }

    fetchNewsItem();
  }, [id]);

  if (!id) {
    return null; // This will be handled in useEffect with redirect
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-12 w-12 rounded-full border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !newsItem) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold">Error loading news article</h2>
        <p className="mt-4">{error || "Article not found"}</p>
        <Link href="/news">
          <Button className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to News
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-Urbanist">
      {/* Back button */}
      <div className="mb-8">
        <Link href="/news">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to News
          </Button>
        </Link>
      </div>

      {/* Article header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Badge variant="secondary" className="text-sm">
            {formatDate.short(newsItem.publishedDate)}
          </Badge>
          <span className="text-sm text-gray-500">
            Published by {newsItem.publisher}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-6">
          {newsItem.title}
        </h1>
      </div>

      {/* Featured image */}
      {newsItem.image && (
        <div className="relative rounded-xl overflow-hidden mb-10 h-96">
          <img
            src={newsItem.image}
            alt={newsItem.title}
            className="object-cover w-full h-full"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Article content */}
      <div className="prose prose-lg max-w-none">
        {newsItem.content.map((paragraph: string, index: number) => (
          <p key={index} className="mb-6 text-gray-700">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Resource materials */}
      {newsItem.resourceMaterials?.length > 0 && (
        <div className="mt-12 border-t pt-8">
          <h2 className="text-2xl font-semibold mb-6">Resources</h2>
          <div className="grid gap-4">
            {newsItem.resourceMaterials.map((resource: any, index: number) => (
              <div key={index} className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="bg-blue-50 p-3 rounded-lg mr-4">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{resource.materialName}</h3>
                  <p className="text-sm text-gray-500">
                    {resource.fileType.toUpperCase()} • {(resource.fileSize / 1024).toFixed(1)} MB
                  </p>
                </div>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <View className="h-4 w-4 mr-2" />
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata footer */}
      <div className="mt-12 pt-8 border-t text-sm text-gray-500">
        <p>Article ID: {newsItem._id}</p>
        <p>Last updated: {formatDate.long(newsItem.updatedAt)}</p>
      </div>
    </div>
  );
}

// Import useSearchParams after component definition
import { useSearchParams } from 'next/navigation';

// Main component that wraps the content with suspense
export default function NewsDetailPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin h-12 w-12 rounded-full border-t-2 border-b-2 border-gray-900"></div>
        </div>
      }>
        <NewsDetailContent />
      </Suspense>
      <Footer />
    </>
  );
}