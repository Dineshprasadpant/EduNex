"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NewsService } from '../../../apiCalls/fetchNews';
import { subscribeEmail } from '../../../apiCalls/addSubscirber'; // Import the subscription function
import { toast, Toaster } from 'react-hot-toast'; // Import toast for notifications
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from '@/components/ui/pagination';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { formatDate } from '@/lib/utils';

interface NewsItem {
  _id: string;
  title: string;
  image?: string;
  publishedDate: string;
  publisher: string;
  content: string[];
  category?: string;
}

interface PaginationState {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}


export default function NewsPage() {
  const router = useRouter();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Fetch news data
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const data = await NewsService.getNewsList(pagination.page, pagination.limit);

        setNewsItems(data.data);
        setPagination(data.pagination);
        setError(null);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to load news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [pagination.page, pagination.limit]);



  // Filter news by category
  const filteredNews = newsItems;

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle read more click
  const handleReadMore = (id: string) => {
    router.push(`/news/newsById?id=${id}`);
  };



  return (
    <>
      <Navbar />
      <div className=" font-Urbanist">
        {/* Hero Section with Subtle Pattern */}
        <div className="relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-opacity-10  pattern-dots pattern-gray-200 pattern-bg-white pattern-size-2 pattern-opacity-20"></div>
          <div className="container mx-auto px-4 py-16 relative">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-3">
                <span className="">
                  Latest News & Insights
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Stay informed with our latest research, announcements, events, and educational insights curated for our learning community.
              </p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 font-Urbanist">
          {/* Loading state */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-white shadow-md transition-all duration-300 hover:shadow-xl border border-gray-100">
                  <Skeleton className="h-52 w-full" />
                  <div className="p-6">
                    <Skeleton className="h-6 w-24 mb-4" />
                    <Skeleton className="h-6 w-full mb-3" />
                    <Skeleton className="h-4 w-3/4 mb-6" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {/* Featured article (only for 'all' category) */}
              {newsItems.length > 0 && (
                <div className="mb-16 transform hover:-translate-y-1 transition-all duration-300">
                  <div className="relative bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-100">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-500"></div>
                    <div className="grid grid-cols-1 lg:grid-cols-5">
                      <div className="relative h-96 lg:h-auto lg:col-span-3">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 mix-blend-multiply z-10"></div>
                        <img
                          src={newsItems[0].image || '/placeholder-news.jpg'}
                          alt={newsItems[0].title}
                          className="object-cover object-center w-full h-64 md:h-80 lg:h-96"
                          style={{ width: '100%', objectFit: 'cover' }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent h-1/3 z-10 lg:hidden"></div>
                        <div className="absolute bottom-4 left-4 z-20 lg:hidden">
                          <Badge className="bg-white/90 text-blue-600 hover:bg-white">
                            {newsItems[0].category || 'Featured'}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-8 lg:p-10 flex flex-col justify-center lg:col-span-2">
                        <div className="hidden lg:flex items-center gap-2 mb-6">
                          <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-sm">
                            {newsItems[0].category || 'Featured'}
                          </Badge>
                          <span className="text-sm text-gray-500 flex items-center">
                            <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {formatDate(newsItems[0].publishedDate)}
                          </span>
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 leading-tight">
                          {newsItems[0].title}
                        </h2>
                        <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                          {newsItems[0].content[0]}
                        </p>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-sm text-gray-500 flex items-center">
                            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs mr-2">
                              {newsItems[0].publisher.charAt(0).toUpperCase()}
                            </span>
                            {newsItems[0].publisher}
                          </span>
                          <Button
                            onClick={() => handleReadMore(newsItems[0]._id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
                          >
                            Read full story
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section divider */}
              <div className="flex items-center justify-center my-16">
                <div className="w-16 h-px bg-gray-200"></div>
                <div className="mx-4 text-gray-500 font-medium">More Articles</div>
                <div className="w-16 h-px bg-gray-200"></div>
              </div>

              {/* News grid */}
              {filteredNews.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    {filteredNews
                      .slice(newsItems.length > 1 ? 1 : 0)
                      .map((item) => (
                        <div
                          key={item._id}
                          className="group relative rounded-xl overflow-hidden bg-white border border-gray-100 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        >
                          <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-indigo-500 transition-colors duration-300"></div>
                          <div className="relative h-56">
                            <img
                              src={item.image || '/placeholder-news.jpg'}
                              alt={item.title}
                              className="object-cover object-center w-full h-full"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-gray-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute top-4 left-4">
                              <Badge className="bg-white/90 text-blue-600 hover:bg-white">
                                {item.category || 'General'}
                              </Badge>
                            </div>
                          </div>
                          <div className="p-6">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs text-gray-500 flex items-center">
                                <svg className="w-3 h-3 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {formatDate(item.publishedDate)}
                              </span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                              {item.title}
                            </h3>
                            <p className="text-gray-600 mb-5 line-clamp-3 text-sm leading-relaxed">
                              {item.content[0]}
                            </p>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                              <span className="text-xs text-gray-500 flex items-center">
                                <span className="w-5 h-5 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs mr-2">
                                  {item.publisher.charAt(0).toUpperCase()}
                                </span>
                                {item.publisher}
                              </span>
                              <Button
                                onClick={() => handleReadMore(item._id)}
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full px-4 py-1 text-sm transition-colors"
                              >
                                Read more
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Pagination - Enhanced */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center mt-12">
                      <Pagination>
                        <PaginationContent className="shadow-md rounded-full bg-white border border-gray-100 p-1">
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => handlePageChange(pagination.page - 1)}
                              className={!pagination.hasPreviousPage
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-50 transition-colors'}
                            />
                          </PaginationItem>

                          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                isActive={page === pagination.page}
                                onClick={() => handlePageChange(page)}
                                className={page === pagination.page
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'hover:bg-gray-50 transition-colors'}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() => handlePageChange(pagination.page + 1)}
                              className={!pagination.hasNextPage
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-gray-50 transition-colors'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No news articles found
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Try selecting a different category or check back later for updates.
                  </p>
                </div>
              )}


            </>
          )}
        </div>
      </div>
      <Footer />
      <Toaster position="top-center" />
    </>
  );
}