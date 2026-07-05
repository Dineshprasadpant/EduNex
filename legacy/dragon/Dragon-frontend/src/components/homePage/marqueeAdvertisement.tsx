"use client";
import React, { useState, useRef, useEffect } from 'react';
import { fetchAdvertisements, Advertisement } from '../../../apiCalls/fetchAdvertisement';

interface MarqueeAdvertisementProps {
  speed?: number; 
  gap?: number;
  autoplayDirection?: 'left' | 'right';
}

const MarqueeAdvertisement: React.FC<MarqueeAdvertisementProps> = ({
  speed = 30,
  gap = 8,
  autoplayDirection = 'left'
}) => {
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [fetchedPages, setFetchedPages] = useState<number[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    loading: false,
    hasMore: true
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [displayedAds, setDisplayedAds] = useState<Advertisement[]>([]);
  const animationRef = useRef<number | null>(null);
  const positionRef = useRef<number>(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Fetch advertisements
  const fetchAds = async (page: number) => {
    if (fetchedPages.includes(page) || pagination.loading || !pagination.hasMore) return;

    try {
      setPagination(prev => ({ ...prev, loading: true }));
      const response = await fetchAdvertisements(page, 10);

      setAdvertisements(prev => [...prev, ...response.currentObjects]);
      setFetchedPages(prev => [...prev, page]);
      setPagination({
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        loading: false,
        hasMore: response.currentPage < response.totalPages
      });
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      setPagination(prev => ({ ...prev, loading: false }));
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAds(1);
  }, []);

  // Update displayed ads based on current state
  useEffect(() => {
    if (advertisements.length === 0) return;

    // For infinite scroll effect, duplicate the ads
    setDisplayedAds([...advertisements, ...advertisements]);
    // Update item refs array when displayed ads change
    itemRefs.current = itemRefs.current.slice(0, displayedAds.length);
  }, [advertisements]);

  // Setup intersection observer to detect when 8th item is visible
  useEffect(() => {
    if (advertisements.length === 0 || !containerRef.current) return;

    const options: IntersectionObserverInit = {
      root: containerRef.current,
      rootMargin: '0px',
      threshold: 0.5 // 50% of the item should be visible
    };

    const handleIntersection: IntersectionObserverCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index'));
          if (isNaN(index)) return;

          // Check if this is the 8th item of the current page
          const itemsPerPage = 10;
          const currentPageStartIndex = (pagination.currentPage - 1) * itemsPerPage;
          const eighthItemIndex = currentPageStartIndex + 7; // 0-based index

          if (index === eighthItemIndex && pagination.hasMore && !pagination.loading && !fetchedPages.includes(pagination.currentPage + 1)) {
            fetchAds(pagination.currentPage + 1);
          }
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersection, options);

    // Observe all ad items
    itemRefs.current.forEach((ref, index) => {
      if (ref) {
        ref.setAttribute('data-index', index.toString());
        observerRef.current?.observe(ref);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [advertisements, pagination, fetchedPages]);

  // Setup and manage animation
  useEffect(() => {
    if (!innerRef.current || !containerRef.current || advertisements.length === 0) return;

    const pixelsPerMs = speed / 1000;
    let lastTimestamp = 0;

    const animate = (timestamp: number) => {
      if (!innerRef.current) return;

      if (!lastTimestamp) {
        lastTimestamp = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      if (!isPaused) {
        const deltaTime = timestamp - lastTimestamp;
        positionRef.current += pixelsPerMs * deltaTime;

        // Reset position when we've scrolled one full loop
        const singleLoopWidth = innerRef.current.scrollWidth / 2;
        if (positionRef.current > singleLoopWidth) {
          positionRef.current = 0;
        }

        const translateValue = autoplayDirection === 'left' ? -positionRef.current : positionRef.current;
        innerRef.current.style.transform = `translateX(${translateValue}px)`;
      }

      lastTimestamp = timestamp;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, isPaused, autoplayDirection, displayedAds.length, advertisements.length]);

  return (
    <div className="w-full mx-auto py-8">
      <div
        ref={containerRef}
        className="w-full overflow-hidden relative pb-12"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          ref={innerRef}
          className="flex items-center"
          style={{ gap: `${gap}px` }}
        >
          {displayedAds.map((ad, index) => (
            <div
              key={`${ad._id}-${index}`}
              ref={el => {
                if (el) {
                  itemRefs.current[index] = el;
                }
              }}
              className="flex-shrink-0 relative w-80 h-64 rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105"
              style={{ marginRight: `${gap}px` }}
            >
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/40"></div>
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <h3 className="font-bold text-xl mb-2 font-Urbanist">{ad.title}</h3>
                <p className="text-sm text-gray-200 mb-4 line-clamp-2 font-Urbanist">{ad.description}</p>
                <a
                  href={ad.linkUrl}
                  className="inline-block rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-blue-500/20 font-Urbanist"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn More
                </a>
              </div>
            </div>
          ))}
        </div>

        {pagination.loading && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarqueeAdvertisement;