"use client"
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Clock, Users, BookOpen, Star, Monitor, Home, Zap } from 'lucide-react';
import { fetchCourses, CourseSummary } from '../../../apiCalls/fetchCourses';

export const PopularCourses: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [visibleCourses, setVisibleCourses] = useState<number>(3);
  const [totalSlides, setTotalSlides] = useState<number>(0);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef<boolean>(false);
  const lastPageRef = useRef<number>(1);

  // Fetch courses data
  const loadCourses = async (page: number) => {
    try {
      if (isFetchingRef.current) return;

      setLoading(true);
      isFetchingRef.current = true;
      const data = await fetchCourses(page, 10);

      if (data) {
        console.log(data)
      }

      // Only append new courses if we're loading a new page
      if (page > lastPageRef.current) {
        setCourses(prev => [...prev, ...data.data.courses]);
      } else {
        setCourses(data.data.courses);
      }

      lastPageRef.current = page;
      setPagination(data.data.pagination);
      setLoading(false);
      isFetchingRef.current = false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    loadCourses(1);
  }, []);

  // Determine visible courses based on screen size
  const getVisibleCourses = (): number => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  };

  // Handle window resize and check for device size
  useEffect(() => {
    const checkDeviceSize = () => {
      setIsMobile(window.innerWidth < 768);
      setVisibleCourses(getVisibleCourses());
    };

    checkDeviceSize();
    setTotalSlides(Math.ceil(courses.length / getVisibleCourses()));

    window.addEventListener('resize', checkDeviceSize);
    return () => window.removeEventListener('resize', checkDeviceSize);
  }, [courses.length]);

  // Check if we need to fetch more courses when reaching the end
  useEffect(() => {
    if (courses.length === 0 || visibleCourses === 0) return;

    const currentSlides = Math.ceil(courses.length / visibleCourses);
    const isAtLastSlide = currentIndex >= currentSlides - 1;
    const hasMorePages = pagination.hasNextPage;

    if (isAtLastSlide && hasMorePages && !isFetchingRef.current) {
      loadCourses(pagination.currentPage + 1);
    }
  }, [currentIndex, courses.length, visibleCourses, pagination]);

  // Auto scroll functionality
  useEffect(() => {
    if (totalSlides === 0 || courses.length === 0) return;

    const startAutoScroll = () => {
      autoScrollRef.current = setInterval(() => {
        if (!isHovering) {
          setCurrentIndex(prevIndex => {
            const nextIndex = (prevIndex + 1) % totalSlides;
            return nextIndex;
          });
        }
      }, 5000);
    };

    startAutoScroll();

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [isHovering, totalSlides, courses.length]);

  const nextSlide = (): void => {
    setCurrentIndex(prevIndex => {
      const nextIndex = (prevIndex + 1) % totalSlides;
      return nextIndex;
    });
  };

  const prevSlide = (): void => {
    setCurrentIndex(prevIndex => (prevIndex === 0 ? totalSlides - 1 : prevIndex - 1));
  };

  const goToSlide = (index: number): void => {
    setCurrentIndex(index);
  };

  // Get display courses with proper offset
  const displayCourses = (): CourseSummary[] => {
    const startIndex = currentIndex * visibleCourses;
    const endIndex = Math.min(startIndex + visibleCourses, courses.length);
    return courses.slice(startIndex, endIndex);
  };

  // For mobile swipe functionality
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent): void => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent): void => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (): void => {
    if (touchStartX.current - touchEndX.current > 50) {
      nextSlide();
    } else if (touchEndX.current - touchStartX.current > 50) {
      prevSlide();
    }
  };

  // Render delivery mode icon and text
  const renderDeliveryMode = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'online':
        return (
          <div className="flex items-center text-[#010794]">
            <Monitor className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">Online</span>
          </div>
        );
      case 'offline':
        return (
          <div className="flex items-center text-[#010794]">
            <Home className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">Offline</span>
          </div>
        );
      case 'hybrid':
        return (
          <div className="flex items-center text-[#010794]">
            <Zap className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">Online & Offline</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Render price based on delivery mode
  const renderPrice = (course: CourseSummary) => {
    if (course.deliveryMode.toLowerCase() === 'hybrid') {
      return (
        <div className="flex ">
          <span className="text-[#010794] text-sm">NRP {course.onlinePrice.toFixed(2)}/ {course.offlinePrice.toFixed(2)}</span>
        </div>
      );
    } else if (course.deliveryMode.toLowerCase() === 'online') {
      return <span className="text-[#010794]">NRP {course.onlinePrice.toFixed(2)}</span>;
    } else {
      return <span className="text-[#010794]">NRP {course.offlinePrice.toFixed(2)}</span>;
    }
  };

  if (loading && courses.length === 0) {
    return (
      <div className="relative w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 py-12 sm:py-16 lg:py-24 overflow-hidden bg-[#fbfdff]">
        <div className="max-w-full xl:max-w-[100rem] 2xl:max-w-[120rem] mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16 md:mb-20 lg:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-5xl 2xl:text-6xl font-bold text-gray-900 mt-2 font-Urbanist leading-tight">
              Loading Courses...
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 py-12 sm:py-16 lg:py-24 overflow-hidden bg-[#fbfdff]">
        <div className="max-w-full xl:max-w-[100rem] 2xl:max-w-[120rem] mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16 md:mb-20 lg:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-5xl 2xl:text-6xl font-bold text-gray-900 mt-2 font-Urbanist leading-tight">
              Error: {error}
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 overflow-hidden bg-[#fbfdff]">
      <div className="max-w-full xl:max-w-[100rem] 2xl:max-w-[120rem] mx-auto relative z-10">
        <div className="text-center mb-12 sm:mb-16 md:mb-20 lg:mb-24">

          <h2 className="text-2xl sm:text-3xl md:text-3xl lg:text-5xl xl:text-5xl 2xl:text-6xl font-bold text-gray-900 font-Urbanist leading-tight tracking-tight">
            Our Most Popular Courses
          </h2>
        </div>

        {/* Carousel Container */}
        <div
          className="relative px-2 sm:px-4 md:px-6 lg:px-8"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          ref={carouselRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation Buttons */}
          <div className="hidden md:block absolute -left-2 sm:-left-8 top-1/2 transform -translate-y-1/2 z-10">
            <button
              onClick={prevSlide}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-[#010794] hover:text-white transition-all duration-300"
              aria-label="Previous courses"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Courses Grid/Slider */}
          <div className="overflow-hidden">
            <div className="transition-all duration-500 ease-in-out">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                {displayCourses().map((course) => (
                  <div
                    key={course._id}
                    className="overflow-hidden"
                  >
                    {/* Course Image */}
                    <div className="relative">
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-48 sm:h-56 md:h-64 object-cover"
                      />
                      <div className="absolute top-4 left-4 bg-white text-[#010794] px-4 py-1.5 rounded-full font-medium shadow-md text-sm font-Urbanist">
                        {renderPrice(course)}
                      </div>
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-[#010794] px-3 py-1 rounded-full font-medium shadow-md text-xs flex items-center font-Urbanist">
                        {renderDeliveryMode(course.deliveryMode)}
                      </div>
                    </div>

                    {/* Course Content */}
                    <div className="pt-5">
                      {/* Title */}
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 md:mb-5 h-14 md:h-16 line-clamp-2 text-gray-800 transition-colors font-Urbanist">
                        {course.title}
                      </h3>

                      {/* Instructor */}
                      <div className="flex items-center justify-between ">

                        <span className="text-[#010794] font-medium rounded-full text-sm font-Urbanist whitespace-nowrap overflow-hidden text-ellipsis max-w-[520px] sm:max-w-[550px] bg-[#010794] text-white px-3 py-1">
                          {course.category}
                        </span>
                      </div>

                      {/* Meta Information */}
                      <div className="flex flex-wrap items-center justify-between text-gray-700 mb-4 sm:mb-5 md:mb-6 text-sm font-Urbanist border-t pt-4 sm:pt-5 my-8 w-full">
                        <div className="flex items-center justify-center flex-1 mb-2">
                          <div className="flex items-center space-x-1.5">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#010794]" />
                            <span className="font-medium">{course.studentsEnrolled} Students</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center flex-1 mb-2">
                          <div className="flex items-center space-x-1.5">
                            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#010794]" />
                            <span className="font-medium">{course.teachersCount} Teachers</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center flex-1 mb-2">
                          <div className="flex items-center space-x-1.5">
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#010794]" />
                            <span className="font-medium">{course.overallHours} Hours</span>
                          </div>
                        </div>
                      </div>


                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Navigation Button */}
          <div className="hidden md:block absolute -right-2 sm:-right-8 top-1/2 transform -translate-y-1/2 z-10">
            <button
              onClick={nextSlide}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-[#010794] hover:text-white transition-all duration-300"
              aria-label="Next courses"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center mt-8 sm:mt-10 md:mt-12">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 sm:w-4 sm:h-4 mx-1.5 rounded-full transition-all duration-300 ${index === currentIndex ? "bg-[#010794] w-8 sm:w-10" : "bg-gray-300"}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopularCourses;