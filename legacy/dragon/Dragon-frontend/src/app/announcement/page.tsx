"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { ArrowLeft, ChevronUp, ChevronRight, Download, ExternalLink } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchAnnouncementById, AnnouncementApiResponse } from "../../../apiCalls/fetchAnnouncement";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export interface ProcessedAnnouncement {
  id: string;
  title: string;
  description: string;
  date: string;
  imageUrl: string;
  content: string;
  cta?: {
    title: string;
    description: string;
    buttons: {
      text: string;
      url: string;
    }[];
  };
  resources?: {
    name: string;
    type: string;
    size: string;
    url: string;
  }[];
  sections?: {
    title: string;
    bullets: string[];
    description: string;
  }[];
}

// Format file size utility
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
};

// Loading component
const LoadingAnnouncement = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-500 font-Urbanist">Loading announcement...</p>
    </div>
  </div>
);

// Error component
const ErrorDisplay = ({ error, router }: any) => (
  <div className="min-h-screen flex items-center justify-center font-Urbanist">
    <div className="max-w-md text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Announcement</h2>
      <p className="text-gray-600 mb-6">{error}</p>
      <button
        onClick={() => router.push("/")}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
);

// Main content component that uses searchParams
function AnnouncementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const announcementId = searchParams.get('id');

  const [announcement, setAnnouncement] = useState<ProcessedAnnouncement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Format date from API response
  const formatAnnouncementDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Process API data to match our UI requirements
  const processApiData = (data: AnnouncementApiResponse): ProcessedAnnouncement => {
    // Convert content array to HTML string
    const contentHtml = data.content.map(paragraph =>
      `<p class="mb-4 font-Urbanist">${paragraph}</p>`
    ).join('');

    // Process subInformation into sections
    const sections = data.subInformation?.map(info => ({
      title: info.title || '',
      bullets: info.bulletPoints || [],
      description: info.description || ''
    })) || [];

    // Process resources
    const resources = data.resourceMaterials?.map(resource => ({
      name: resource.materialName || '',
      type: resource.fileType || '',
      size: formatFileSize(resource.fileSize || 0),
      url: resource.url || ''
    })) || [];

    // Process CTA
    const cta = data.cta ? {
      title: data.cta.title,
      description: data.cta.description,
      buttons: data.cta.buttons.map(button => ({
        text: button.buttonName,
        url: button.href
      }))
    } : undefined;

    return {
      id: data._id,
      title: data.title,
      description: data.content[0], // Use first paragraph as description
      date: formatAnnouncementDate(data.announcedDate),
      imageUrl: data.image,
      content: contentHtml,
      cta,
      resources,
      sections
    };
  };

  // Fetch announcement data
  useEffect(() => {
    const loadAnnouncement = async () => {
      if (!announcementId) {
        setError("No announcement ID provided.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchAnnouncementById(announcementId);
        const processedData = processApiData(data);
        setAnnouncement(processedData);
      } catch (err) {
        console.error("Failed to fetch announcement:", err);
        setError("Failed to load announcement. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncement();
  }, [announcementId]);

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const element = contentRef.current;
        const totalHeight = element.scrollHeight - element.clientHeight;
        const windowScrollTop = window.scrollY - element.offsetTop + window.innerHeight / 2;

        if (windowScrollTop >= 0) {
          const scrolled = Math.min(100, Math.max(0, (windowScrollTop / totalHeight) * 100));
          setReadingProgress(scrolled);
        }
      }

      setShowBackToTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [announcement]);

  if (loading) {
    return <LoadingAnnouncement />;
  }

  if (error) {
    return <ErrorDisplay error={error} router={router} />;
  }

  if (!announcement) {
    return null;
  }

  // Calculate reading time
  const getReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const readingTime = getReadingTime(
    announcement.content.replace(/<[^>]*>/g, " ") +
    announcement.description
  );

  return (
    <div className="relative w-full bg-white overflow-hidden">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
          style={{ width: `${readingProgress}%` }}
        ></div>
      </div>

      {/* Back Button */}
      <div className="fixed top-8 left-8 z-90 lg:top-12 lg:left-12 mt-20 ">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center bg-white/95 backdrop-blur-sm w-12 h-12 rounded-full shadow-lg hover:bg-white transition-all group"
          aria-label="Go back"
        >
          <ArrowLeft
            size={22}
            className="text-gray-700 group-hover:text-blue-600 transition-colors"
          />
        </button>
      </div>

      <div className="max-w-full xl:max-w-[100rem] 2xl:max-w-[120rem] mx-auto">
        {/* Hero Section */}
        <div className="relative h-[70vh] lg:h-[75vh] overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-black/80 z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white z-20"></div>
            <img
              src={announcement.imageUrl}
              alt={announcement.title}
              className="w-full h-[70vh] lg:h-[75vh] object-cover"
              onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/1200x630?text=Image+Not+Found"; }}
            />
          </div>

          {/* Content Container */}
          <div className="absolute inset-0 z-30 flex items-end">
            <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-8 pb-12 lg:pb-16">
              <div className="max-w-4xl mx-auto">
                {/* Title */}
                <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-5xl 2xl:text-6xl font-bold text-white mt-6 mb-8 font-Urbanist leading-tight transition-all duration-700 transform">
                  {announcement.title}
                </h1>

                {/* Description */}
                <p className="text-lg sm:text-xl text-white mb-6 font-Urbanist">
                  {announcement.description}
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center text-gray-600 gap-4 sm:gap-5 mt-4 font-Urbanist">
                  <div className="flex items-center px-6 py-2 bg-white/90 border-1 border-blue-500 text-blue-600 backdrop-blur-sm rounded-full shadow-sm">
                    <span><a className="mr-2 text-[#8ab7ff]">● </a> {announcement.date}</span>
                  </div>
                  <div className="flex items-center px-6 py-2 bg-white/90 border-1 border-blue-500 text-blue-600 backdrop-blur-sm rounded-full shadow-sm">
                    <span><a className="mr-2 text-[#8ab7ff]">● </a>  {readingTime} min read</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div ref={contentRef} className="px-4 sm:px-6 md:px-8 lg:px-8 py-12 lg:py-16 font-Urbanist">
          <div className="max-w-4xl mx-auto">
            {/* Announcement Content */}
            <div
              className="prose prose-lg max-w-none font-Urbanist"
              dangerouslySetInnerHTML={{ __html: announcement.content }}
            />

            {/* Additional Sections */}
            {announcement.sections && announcement.sections.length > 0 && (
              <div className="mt-16 grid gap-8 md:grid-cols-2">
                {announcement.sections.map((section, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-6 transition-shadow">
                    <h3 className="text-xl font-bold mb-4 font-Urbanist">{section.title}</h3>
                    <ul className="space-y-2 mb-4">
                      {section.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-gray-600 text-sm">{section.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Resources */}
            {announcement.resources && announcement.resources.length > 0 && (
              <div className="mt-16">
                <h2 className="text-2xl font-bold mb-6 font-Urbanist">Resource Materials</h2>
                <div className="grid gap-4">
                  {announcement.resources.map((resource, index) => (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-50 rounded-lg mr-4">
                          <Download className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <h3 className="font-medium">{resource.name}</h3>
                          <p className="text-sm text-gray-500">
                            {resource.type.toUpperCase()} • {resource.size}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-400" size={20} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Call to Action */}
            {announcement.cta && (
              <div className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-10">
                <h2 className="text-2xl font-bold mb-3 font-Urbanist">{announcement.cta.title}</h2>
                <p className="text-gray-700 mb-6">{announcement.cta.description}</p>
                <div className="flex flex-wrap gap-4">
                  {announcement.cta.buttons.map((button, index) => (
                    <a
                      key={index}
                      href={button.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-6 py-3 rounded-lg font-medium flex items-center transition-all ${index === 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                        : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      {button.text}
                      {index === 0 && <ExternalLink className="ml-2" size={16} />}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 z-30 flex items-center justify-center bg-white/95 backdrop-blur-sm w-12 h-12 rounded-full shadow-lg hover:bg-white transition-all group"
          aria-label="Back to top"
        >
          <ChevronUp
            size={22}
            className="text-gray-700 group-hover:text-blue-600 transition-colors"
          />
        </button>
      )}
    </div>
  );
}

// Main component that wraps the content in Suspense
const AnnouncementDetail = () => {
  return (
    <>
      <Navbar />
      <Suspense fallback={<LoadingAnnouncement />}>
        <AnnouncementContent />
      </Suspense>
      <Footer />
    </>
  );
};

export default AnnouncementDetail;