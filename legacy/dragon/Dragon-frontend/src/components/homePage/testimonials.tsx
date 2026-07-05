"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote, MessageSquarePlus, X, Send, Upload, Camera, Trash2 } from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { fetchTestimonials, submitFeedback } from "../../../apiCalls/fetchFeedBacks";

interface CarouselTestimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  image: string;
}

const TestimonialCarousel: React.FC = () => {
  const sliderRef = useRef<Slider>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [testimonials, setTestimonials] = useState<CarouselTestimonial[]>([]);
  const [extendedTestimonials, setExtendedTestimonials] = useState<CarouselTestimonial[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTestimonial, setExpandedTestimonial] = useState<CarouselTestimonial | null>(null);
  const [showToast, setShowToast] = useState<boolean>(false);

  // Fetch testimonials on component mount
  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        setIsLoading(true);
        const data = await fetchTestimonials();
        const fetchedTestimonials: CarouselTestimonial[] = data.data.map(item => ({
          name: item.name,
          role: "User",
          content: item.feedback,
          rating: item.rating,
          image: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random`,
        }));

        setTestimonials(fetchedTestimonials);
        setExtendedTestimonials([...fetchedTestimonials, ...fetchedTestimonials, ...fetchedTestimonials]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadTestimonials();
  }, []);

  const settings = {
    dots: false,
    infinite: true,
    speed: 1000,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    beforeChange: (_: number, next: number) => setCurrentSlide(next),
    responsive: [
      {
        breakpoint: 1536,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  const handlePrev = () => {
    sliderRef.current?.slickPrev();
  };

  const handleNext = () => {
    sliderRef.current?.slickNext();
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const feedbackData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      rating: rating,
      feedback: formData.get('feedback') as string,
    };

    try {
      await submitFeedback(feedbackData);
      setIsFeedbackOpen(false);
      setRating(0);
      setShowToast(true); // Show the success toast
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);

      // Refresh testimonials after submission
      const data = await fetchTestimonials();
      const fetchedTestimonials: CarouselTestimonial[] = data.data.map(item => ({
        name: item.name,
        role: "Student",
        content: item.feedback,
        rating: item.rating,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random`,
      }));

      setTestimonials(fetchedTestimonials);
      setExtendedTestimonials([...fetchedTestimonials, ...fetchedTestimonials, ...fetchedTestimonials]);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  if (isLoading) {
    return (
      <section className="relative w-full px-4 py-20 overflow-hidden bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-full mx-auto relative z-10 text-center">
          <p>Loading testimonials...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative w-full px-4 py-20 overflow-hidden bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-full mx-auto relative z-10 text-center">
          <p className="text-red-500">Error loading testimonials: {error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full px-4 sm:px-6 md:px-8 lg:px-8 xl:px-8 2xl:px-16 py-6 sm:py-8 lg:py-20 overflow-hidden bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-full xl:max-w-[100rem] 2xl:max-w-[120rem] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12 md:mb-16 lg:mb-20"
        >
          <h3 className="text-[#010794] font-medium text-base sm:text-lg font-Urbanist mb-2">
            Student Testimonials
          </h3>

          <h2 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-5xl 2xl:text-6xl font-bold text-gray-900 mb-5 font-Urbanist leading-tight">
            What Our Students Say
          </h2>

          <p className="text-sm font-Urbanist sm:text-base md:text-base lg:text-lg xl:text-lg 2xl:text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Join thousands of successful students who have transformed their
            careers through our platform
          </p>

          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="inline-flex items-center font-Urbanist gap-2 bg-[#010794] text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors duration-300 shadow-lg hover:shadow-xl"
          >
            <MessageSquarePlus className="w-5 h-5" />
            <span>Share Your Feedback</span>
          </button>
        </motion.div>

        <div
          className="relative px-4 sm:px-6 md:px-8 lg:px-10"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence>
            {isHovered && (
              <>
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={handlePrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-2 sm:p-3 rounded-full shadow-lg hover:bg-white transition-all duration-300"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={handleNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-2 sm:p-3 rounded-full shadow-lg hover:bg-white transition-all duration-300"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                </motion.button>
              </>
            )}
          </AnimatePresence>

          <Slider ref={sliderRef} {...settings}>
            {extendedTestimonials.map((testimonial, index) => (
              <div key={index} className="px-2 sm:px-3 py-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full"
                >
                  <div 
                    className="h-full bg-white border-2 border-gray-100 backdrop-blur-sm rounded-2xl transition-all duration-500 hover:-translate-y-2"
                    onClick={() => setExpandedTestimonial(testimonial)}
                  >
                    <div className="p-4 sm:p-5 md:p-6 lg:p-7 relative">
                      <Quote className="absolute top-4 right-4 w-6 h-6 sm:w-8 sm:h-8 text-blue-200 opacity-50" />

                      <div className="flex items-center mb-4 sm:mb-6">
                        <div className="relative">
                          <img
                            src={testimonial.image}
                            alt={testimonial.name}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover ring-4 ring-blue-100"
                          />
                          <div className="absolute -bottom-2 -right-2 bg-[#010794] text-white p-1 rounded-full">
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg sm:text-xl font-semibold font-Urbanist text-gray-900">
                            {testimonial.name}
                          </h3>
                          <p className="text-[#010794] text-sm sm:text-base font-Urbanist font-medium">
                            {testimonial.role}
                          </p>
                        </div>
                      </div>

                      <div className="h-32 overflow-hidden mb-4 sm:mb-6">
                        <p className="text-sm sm:text-base text-gray-700 leading-relaxed font-Urbanist">
                          "{truncateText(testimonial.content)}"
                          {testimonial.content.length > 250 && (
                            <span className="text-[#010794] cursor-pointer"> Read more</span>
                          )}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </Slider>
        </div>
      </div>

      {/* Expanded Testimonial Modal */}
      <AnimatePresence>
        {expandedTestimonial && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setExpandedTestimonial(null)}
            />
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-lg max-h-[90vh] overflow-y-auto z-50"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-xl shadow-xl overflow-hidden font-Urbanist">
                <div className="relative bg-[#010794] px-6 py-4">
                  <button
                    onClick={() => setExpandedTestimonial(null)}
                    className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <h3 className="text-xl font-semibold text-white">Full Testimonial</h3>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-6">
                    <div className="relative">
                      <img
                        src={expandedTestimonial.image}
                        alt={expandedTestimonial.name}
                        className="w-16 h-16 rounded-full object-cover ring-4 ring-blue-100"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-[#010794] text-white p-1 rounded-full">
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-semibold font-Urbanist text-gray-900">
                        {expandedTestimonial.name}
                      </h3>
                      <p className="text-[#010794] text-base font-Urbanist font-medium">
                        {expandedTestimonial.role}
                      </p>
                    </div>
                  </div>

                  <div className="relative mb-6">
                    <Quote className="absolute top-0 left-0 w-8 h-8 text-blue-200 opacity-50 -translate-x-2 -translate-y-2" />
                    <p className="text-base text-gray-700 leading-relaxed font-Urbanist pl-4">
                      "{expandedTestimonial.content}"
                    </p>
                  </div>

                  <div className="flex gap-1">
                    {[...Array(expandedTestimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Improved Feedback Form Modal */}
      <AnimatePresence>
        {isFeedbackOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setIsFeedbackOpen(false)}
            />
            <motion.div
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-lg max-h-[90vh] overflow-y-auto z-50"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-xl shadow-xl overflow-hidden font-Urbanist">
                <div className="relative bg-[#010794] px-6 py-4">
                  <button
                    onClick={() => setIsFeedbackOpen(false)}
                    className="absolute right-4 top-4 text-white/80 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <h3 className="text-xl font-semibold text-white">Share Your Feedback</h3>
                  <p className="text-blue-100 mt-1">Help us improve your learning experience</p>
                </div>

                <form onSubmit={handleSubmit} className="p-5">
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How would you rate your experience?
                    </label>
                    <div className="flex justify-center sm:justify-start gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="transition-transform hover:scale-110"
                          onMouseEnter={() => setHoveredStar(star)}
                          onMouseLeave={() => setHoveredStar(0)}
                          onClick={() => setRating(star)}
                        >
                          <Star
                            className={`w-7 h-7 sm:w-8 sm:h-8 ${star <= (hoveredStar || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                              }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="mb-5">
                    <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Feedback
                    </label>
                    <textarea
                      id="feedback"
                      name="feedback"
                      rows={4}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow resize-none"
                      placeholder="Share your thoughts and suggestions..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#010794] text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 group"
                  >
                    <Send className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    Submit Feedback
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Success Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-100"
          >
            <div className="bg-yellow-100 p-1 rounded-full">
              <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium text-gray-800">Feedback Submitted Successfully</span>
            <button 
              onClick={() => setShowToast(false)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .slick-track {
          display: flex !important;
          align-items: stretch;
          gap: 0.5rem;
          margin-left: -0.5rem;
          padding: 1rem 0;
        }
        .slick-slide {
          height: inherit;
          > div {
            height: 100%;
          }
        }
        @media (min-width: 640px) {
          .slick-track {
            gap: 1rem;
            margin-left: -0.5rem;
          }
        }
      `}</style>
    </section>
  );
};

export default TestimonialCarousel;