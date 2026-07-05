"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Megaphone, Calendar, User, ArrowRight, Bell, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { fetchAnnouncements, Announcement } from '../../../apiCalls/fetchAnnouncement';

const ResponsiveAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [primaryAnnouncement, setPrimaryAnnouncement] = useState<Announcement | null>(null);
  const [secondaryAnnouncement, setSecondaryAnnouncement] = useState<Announcement | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    hasMore: true
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef<boolean>(false);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Truncate content to a specific length
  const truncateContent = (content: string, maxLength: number = 255): string => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    
    // Find the last space before maxLength to avoid cutting words
    const lastSpace = content.substring(0, maxLength).lastIndexOf(' ');
    return content.substring(0, lastSpace > 0 ? lastSpace : maxLength) + '...';
  };

  // Fetch announcements
  const loadAnnouncements = async (page: number) => {
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      const response = await fetchAnnouncements(page, pagination.limit);
      
      setAnnouncements(prev => [...prev, ...response.data.announcements]);
      setPagination({
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        hasMore: response.data.announcements.length === response.data.limit
      });

      // Set primary and secondary announcements if not set
      if (!primaryAnnouncement && response.data.announcements.length > 0) {
        setPrimaryAnnouncement(response.data.announcements[0]);
      }
      if (!secondaryAnnouncement && response.data.announcements.length > 1) {
        setSecondaryAnnouncement(response.data.announcements[1]);
      } else {
        setSecondaryAnnouncement(response.data.announcements[0]);
      }

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load announcements');
      setLoading(false);
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Initial load
  useEffect(() => {
    loadAnnouncements(1);
  }, []);

  // Track scroll position to update progress indicator and load more
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(progress);

      // Load more if scrolled near bottom
      if (
        scrollTop + clientHeight >= scrollHeight - 100 && 
        pagination.hasMore && 
        !isFetchingRef.current
      ) {
        loadAnnouncements(pagination.page + 1);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [pagination]);


  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin-slow {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .animate-spin-slow {
        animation: spin-slow 4s linear infinite;
      }
      
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      
      .scroll-progress {
        transition: all 0.3s ease;
      }
      
      .hover-scale {
        transition: transform 0.3s ease;
      }
      
      .hover-scale:hover {
        transform: scale(1.02);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Filter out announcements that are already featured
  const sidebarAnnouncements = announcements.filter(
    announcement => 
      announcement._id !== primaryAnnouncement?._id && 
      announcement._id !== secondaryAnnouncement?._id
  );

  if (loading && announcements.length === 0) {
    return (
      <div className="relative w-full mt-10 bg-white px-4 sm:px-6 md:px-8 lg:px-8 xl:px-8 2xl:px-16 py-6 sm:py-8 lg:py-12 overflow-hidden font-Urbanist">
        <div className="max-w-full xl:max-w-[100rem] 2xl:max-w-[120rem] mx-auto">
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-gray-900">Loading Announcements...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative font-Urbanist w-full mt-10 bg-white px-4 sm:px-6 md:px-8 lg:px-8 xl:px-8 2xl:px-16 py-6 sm:py-8 lg:py-12 overflow-hidden">
        <div className="max-w-full xl:max-w-[100rem] 2xl:max-w-[120rem] mx-auto">
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-gray-900">Error: {error}</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!primaryAnnouncement || !secondaryAnnouncement) {
    return null;
  }

  return (
    <div className="relative w-full mt-10 bg-white px-4 sm:px-6 md:px-8 lg:px-8 xl:px-8 2xl:px-16 py-6 sm:py-8 lg:py-12 overflow-hidden font-Urbanist">
      <div className="max-w-full xl:max-w-[100rem] 2xl:max-w-[120rem] mx-auto">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-8 sm:mb-12 lg:mb-16">
          <div className="flex items-center">
            <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-2 sm:mr-3" />
            <p className="text-blue-600 font-medium text-base sm:text-lg">Latest</p>
            <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-4xl font-bold text-gray-900 ml-2">Announcements</h2>
          </div>
        
        </div>

        {/* Mobile View */}
        <div className="lg:hidden space-y-6 sm:space-y-8">
          {/* Primary Featured Announcement */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start">
              <div className="w-full sm:w-[220px] h-[160px] sm:h-[180px] mb-4 sm:mb-0 sm:mr-6 overflow-hidden rounded-lg relative">
                <img
                  src={primaryAnnouncement.image}
                  alt={primaryAnnouncement.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">{formatDate(primaryAnnouncement.announcedDate)}</span>
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 leading-tight">
                  {primaryAnnouncement.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                  {truncateContent(primaryAnnouncement.content[0])}
                </p>
                <Link href={`/announcement/${primaryAnnouncement._id}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">
                  Read more
                  <ArrowRight className="ml-1 w-3 h-3 sm:w-4 sm:h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Secondary Featured Announcement */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start">
              <div className="w-full sm:w-[220px] h-[160px] sm:h-[180px] mb-4 sm:mb-0 sm:mr-6 overflow-hidden rounded-lg relative">
                <img
                  src={secondaryAnnouncement.image}
                  alt={secondaryAnnouncement.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">{formatDate(secondaryAnnouncement.announcedDate)}</span>
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 leading-tight">
                  {secondaryAnnouncement.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                  {truncateContent(secondaryAnnouncement.content[0])}
                </p>
                <Link href={`/announcement/${secondaryAnnouncement._id}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">
                  Read more
                  <ArrowRight className="ml-1 w-3 h-3 sm:w-4 sm:h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* More Announcements for Mobile */}
          <div className="pt-2 sm:pt-4 border-t border-gray-100">
            <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-700 flex items-center">
              <Bell className="mr-2 w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              More Announcements
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {sidebarAnnouncements.map((announcement) => (
                <Link 
                  key={announcement._id}
                  href={`/announcement?id=${announcement._id}`}
                  className="block w-full text-left hover:bg-gray-50 rounded-md transition-all duration-300 p-2 sm:p-3"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-[80px] sm:w-[100px] h-[60px] sm:h-[70px] overflow-hidden rounded-md mr-3 sm:mr-4 relative">
                      <img
                        src={announcement.image}
                        alt={announcement.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-1 sm:mb-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(announcement.announcedDate)}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors line-clamp-2">
                        {announcement.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden lg:grid lg:grid-cols-[65%_35%] gap-6 lg:gap-8 xl:gap-8">
          {/* Left Column - Two Featured Announcements */}
          <div className="flex flex-col">
            {/* Primary Featured Announcement */}
            <div className="mb-8">
              <div className="flex items-start">
                <div className="w-[220px] h-[180px] mr-6 overflow-hidden rounded-lg relative">
                  <img
                    src={primaryAnnouncement.image}
                    alt={primaryAnnouncement.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">{formatDate(primaryAnnouncement.announcedDate)}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 leading-tight">
                    {primaryAnnouncement.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    {truncateContent(primaryAnnouncement.content[0])}
                  </p>
                  <Link href={`/announcement?id=${primaryAnnouncement._id}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    Read more
                    <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="my-6 border-b border-gray-100"></div>
            </div>

            {/* Secondary Featured Announcement */}
            <div className="mb-8">
              <div className="flex items-start">
                <div className="w-[220px] h-[180px] mr-6 overflow-hidden rounded-lg relative">
                  <img
                    src={secondaryAnnouncement.image}
                    alt={secondaryAnnouncement.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">{formatDate(secondaryAnnouncement.announcedDate)}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-800 leading-tight">
                    {secondaryAnnouncement.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    {truncateContent(secondaryAnnouncement.content[0])}
                  </p>
                  <Link href={`/announcement?id=${secondaryAnnouncement._id}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    Read more
                    <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Enhanced Scrollable List */}
          <div className="relative">
            {/* Section header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-50 text-blue-600 p-1.5 rounded-lg mr-2">
                  <Bell className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">Latest Updates</h3>
              </div>

              {/* Scroll indicator */}
              <div className="flex items-center text-xs text-gray-500">
                <span className="mr-2">Scroll</span>
                <div className="relative w-7 h-7 flex items-center justify-center">
                  <div className="absolute inset-0 bg-gray-50 rounded-full"></div>
                  <div className="absolute top-1 left-1 right-1 bottom-1 border-2 border-t-blue-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin-slow"></div>
                  <ChevronDown className="w-3 h-3 text-blue-500 relative" />
                </div>
              </div>
            </div>

            {/* Enhanced scrollable container */}
            <div className="relative">
              {/* Scroll progress indicator */}
              <div className="hidden lg:block absolute right-1 top-4 bottom-4 w-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="bg-blue-400 w-full rounded-full scroll-progress"
                  style={{
                    height: '24px',
                    top: `${Math.min(scrollProgress, 90)}%`,
                    position: 'absolute'
                  }}
                ></div>
              </div>

              {/* Scrollable list */}
              <div
                ref={scrollContainerRef}
                className="overflow-y-auto hide-scrollbar relative pr-4"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  height: '340px'
                }}
              >
                {/* Announcement items */}
                <div className="space-y-2 pt-2 pb-4">
                  {sidebarAnnouncements.map((announcement) => (
                    <Link
                      key={announcement._id}
                      href={`/announcement?id=${announcement._id}`}
                      className="block w-full text-left py-3 px-3 rounded-lg hover:bg-blue-50/50 transition-all duration-300 group border-l-2 border-transparent hover:border-blue-400"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-[80px] h-[60px] overflow-hidden rounded-md mr-4 relative">
                          <img
                            src={announcement.image}
                            alt={announcement.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {formatDate(announcement.announcedDate)}
                            </span>
                          </div>
                          <h3 className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-300 mt-1 pr-4 line-clamp-2">
                            {announcement.title}
                          </h3>

                          {/* Reveal on hover */}
                          <div className="h-0 overflow-hidden transition-all duration-300 group-hover:h-6 mt-0 group-hover:mt-1 opacity-0 group-hover:opacity-100">
                            <span className="text-xs text-blue-600 flex items-center">
                              View details
                              <ArrowRight size={12} className="ml-1 transform group-hover:translate-x-1 transition-transform" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}

                  {/* Loading indicator */}
                  {loading && (
                    <div className="py-4 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  )}

                  {/* Empty state */}
                  {!loading && sidebarAnnouncements.length === 0 && (
                    <div className="py-8 text-center text-gray-500">
                      <div className="inline-block rounded-full p-3 bg-gray-50 mb-2">
                        <Bell size={24} className="text-gray-400" />
                      </div>
                      <p>No more announcements to display</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveAnnouncements;