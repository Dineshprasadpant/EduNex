"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { fetchAdvertisements, type ApiResponse } from '../../../apiCalls/fetchAdvertisement';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import Cookies from 'js-cookie';

interface AdvertisementDialogProps {
  autoScrollInterval?: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const AdvertisementDialog: React.FC<AdvertisementDialogProps> = ({
  autoScrollInterval = 8000,
  isOpen,
  setIsOpen
}) => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [ads, setAds] = useState<ApiResponse['currentObjects']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isTransitioning = useRef(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasMore: false,
    isFetching: false
  });
  const progressIntervalRef = useRef<NodeJS.Timeout>(null);
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Check if user has cookie and close if present
  useEffect(() => {
    if (Cookies.get('user')) {
      setIsOpen(false);
    }
  }, [setIsOpen]);

  useEffect(() => {
    if (hasMounted && Cookies.get('user')) {
      setIsOpen(false);
    }
  }, [hasMounted, setIsOpen]);

  // Fetch initial ads when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    const loadInitialAds = async () => {
      try {
        setIsLoading(true);
        const response = await fetchAdvertisements(1, 5);

        if (response.currentObjects?.length) {
          setAds(response.currentObjects);
          setPagination({
            currentPage: response.currentPage,
            totalPages: response.totalPages,
            hasMore: response.currentPage < response.totalPages,
            isFetching: false
          });
        } else {
          setIsOpen(false);
        }
      } catch (error) {
        console.error('Error loading ads:', error);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialAds();
  }, [isOpen, setIsOpen]);

  // Prefetch next page when approaching end of current ads
  useEffect(() => {
    if (!pagination.hasMore || pagination.isFetching || ads.length === 0) return;

    if (currentAdIndex >= ads.length - 2) {
      fetchNextPage();
    }
  }, [currentAdIndex, ads.length, pagination.hasMore, pagination.isFetching]);

  // Auto-scroll logic
  useEffect(() => {
    if (!isOpen || ads.length === 0) return;

    const startAutoScroll = () => {
      clearInterval(progressIntervalRef.current || 0);
      clearTimeout(autoScrollTimeoutRef.current || 0);

      if (isPaused || isHovered) return;

      setProgress(0);

      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          const increment = 100 / (autoScrollInterval / 100);
          const newProgress = prev + increment;
          return newProgress;
        });
      }, 100);

      autoScrollTimeoutRef.current = setTimeout(() => {
        goToNextAd();
      }, autoScrollInterval);
    };

    startAutoScroll();

    return () => {
      clearInterval(progressIntervalRef.current || 0);
      clearTimeout(autoScrollTimeoutRef.current || 0);
    };
  }, [isOpen, isPaused, isHovered, ads.length, autoScrollInterval, currentAdIndex]);

  const goToNextAd = () => {
    if (ads.length === 0 || isTransitioning.current) return;

    isTransitioning.current = true;
    setDirection(1);

    const nextIndex = currentAdIndex + 1;

    if (nextIndex >= ads.length && pagination.hasMore && !pagination.isFetching) {
      fetchNextPage().then(success => {
        if (success) {
          setCurrentAdIndex(nextIndex);
        } else {
          setCurrentAdIndex(0);
        }
        isTransitioning.current = false;
      });
    } else {
      setCurrentAdIndex(nextIndex < ads.length ? nextIndex : 0);
      isTransitioning.current = false;
    }

    setProgress(0);
  };

  const fetchNextPage = async () => {
    if (!pagination.hasMore || pagination.isFetching) return false;

    try {
      setPagination(prev => ({ ...prev, isFetching: true }));
      const nextPage = pagination.currentPage + 1;
      const response = await fetchAdvertisements(nextPage, 5);

      if (response.currentObjects?.length) {
        setAds(prev => [...prev, ...response.currentObjects]);
        setPagination({
          currentPage: response.currentPage,
          totalPages: response.totalPages,
          hasMore: response.currentPage < response.totalPages,
          isFetching: false
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching next page:', error);
      setPagination(prev => ({ ...prev, isFetching: false }));
      return false;
    }
  };

  const handlePrevious = () => {
    if (ads.length === 0 || isTransitioning.current) return;

    isTransitioning.current = true;
    setDirection(-1);
    const prevIndex = currentAdIndex === 0 ? ads.length - 1 : currentAdIndex - 1;
    setCurrentAdIndex(prevIndex);
    setProgress(0);

    clearInterval(progressIntervalRef.current || 0);
    clearTimeout(autoScrollTimeoutRef.current || 0);

    setTimeout(() => {
      isTransitioning.current = false;
    }, 500);
  };

  const handleNext = () => {
    if (ads.length === 0 || isTransitioning.current) return;

    goToNextAd();

    clearInterval(progressIntervalRef.current || 0);
    clearTimeout(autoScrollTimeoutRef.current || 0);
  };

  const handleDotClick = (index: number) => {
    if (isTransitioning.current) return;

    isTransitioning.current = true;
    setDirection(index > currentAdIndex ? 1 : -1);
    setCurrentAdIndex(index);
    setProgress(0);

    clearInterval(progressIntervalRef.current || 0);
    clearTimeout(autoScrollTimeoutRef.current || 0);

    setTimeout(() => {
      isTransitioning.current = false;
    }, 500);
  };

  if (!hasMounted || !isOpen || Cookies.get('user')) {
    return null;
  }

  const currentAd = ads[currentAdIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-Urbanist"
        onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
      >
        <motion.div
          className="relative w-full max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <Card className="overflow-hidden border-none shadow-xl">
            <div
              className="relative"
              onMouseEnter={() => { setIsPaused(true); setIsHovered(true); }}
              onMouseLeave={() => { setIsPaused(false); setIsHovered(false); }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 z-50">
                <Progress value={progress} className="h-full bg-gray-200 rounded-none" />
              </div>

              <div className="p-6 pb-4 relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-medium text-gray-900">Curated Opportunities</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Selected recommendations based on your interests
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="relative overflow-hidden">
                {isLoading ? (
                  <div className="aspect-[16/9] w-full">
                    <Skeleton className="h-full w-full rounded-none" />
                  </div>
                ) : currentAd ? (
                  <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                      key={currentAd._id}
                      custom={direction}
                      initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0.7 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: direction < 0 ? '100%' : '-100%', opacity: 0.7 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="relative aspect-[16/9] w-full"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <img
                        src={currentAd.imageUrl}
                        alt={currentAd.title}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/1200x630?text=Image+Not+Found"; }}
                      />

                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="max-w-2xl">
                          <motion.h3
                            className="text-2xl font-medium text-white mb-2"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            {currentAd.title}
                          </motion.h3>
                          <motion.p
                            className="text-gray-300 text-sm mb-4"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            {currentAd.description}
                          </motion.p>
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                          >
                            <Button
                              asChild
                              variant="default"
                              className="rounded-full px-6 shadow-sm bg-blue-600 hover:bg-blue-500"
                            >
                              <a
                                href={currentAd.linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Learn more
                                <ExternalLink className="h-4 w-4 ml-2" />
                              </a>
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="aspect-[16/9] w-full flex items-center justify-center bg-muted">
                    <p className="text-muted-foreground">No advertisements available</p>
                  </div>
                )}

                {pagination.isFetching && currentAdIndex === ads.length - 1 && (
                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <span className="text-xs text-white">Loading more...</span>
                  </div>
                )}

                {ads.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePrevious}
                      className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 h-10 w-10"
                      disabled={isTransitioning.current}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 h-10 w-10"
                      disabled={isTransitioning.current}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}

                {ads.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {ads.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleDotClick(index)}
                        disabled={isTransitioning.current}
                        className={`h-2 rounded-full transition-all ${currentAdIndex === index ? 'w-6 bg-foreground' : 'w-2 bg-muted-foreground/50'
                          }`}
                        aria-label={`Go to advertisement ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdvertisementDialog;