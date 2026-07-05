"use client"
import React, { useState } from "react";
import {
  Calendar,
  User,
  Share2,
  Bookmark,
  MessageCircle,
  ThumbsUp,
  Eye,
  ArrowRight,
  Bell,
  Clock,
  ChevronUp,
  Tag,
  DownloadCloud,
} from "lucide-react";
import Link from "next/link";
export interface Announcement {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  author: string;
  authorRole?: string;
  authorAvatar?: string;
  imageUrl: string;
  priority: "high" | "medium" | "low";
  content?: string;
  tags?: string[];
  readTime?: number;
}

interface AnnouncementContentProps {
  announcement: Announcement;
  relatedAnnouncements: Announcement[];
  animateContent: boolean;
  currentSection: string;
  tableOfContents: { title: string; id: string }[];
  showBackToTop: boolean;
}

const AnnouncementContent: React.FC<AnnouncementContentProps> = ({
  announcement,
  relatedAnnouncements,
  animateContent,
  currentSection,
  tableOfContents,
  showBackToTop,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likes, setLikes] = useState(128);
  const [hasLiked, setHasLiked] = useState(false);
  const [views, setViews] = useState(356);
  const [activeTab, setActiveTab] = useState("content");
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

  // Handle actions
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleLike = () => {
    if (hasLiked) {
      setLikes(likes - 1);
    } else {
      setLikes(likes + 1);
    }
    setHasLiked(!hasLiked);
  };

  const handleShare = () => {
    setIsShareMenuOpen(!isShareMenuOpen);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100,
        behavior: "smooth",
      });
    }
  };

  // Get category colors
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Admissions":
        return "blue";
      case "Events":
        return "purple";
      case "Infrastructure":
        return "green";
      case "Career":
        return "amber";
      case "Academic":
        return "indigo";
      case "Campus Life":
        return "teal";
      default:
        return "gray";
    }
  };

  return (
    <div className="relative pt-24 lg:pt-32 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Tags Section */}
        {announcement.tags && announcement.tags.length > 0 && (
          <div
            className={`mb-8 flex flex-wrap gap-2 transform ${animateContent
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
              } transition-all duration-700 ease-out`}
          >
            {announcement.tags.map((tag, index) => (
              <span
                key={index}
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer stagger-item`}
              >
                <Tag size={14} className="mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Enhanced Engagement Bar */}
        <div
          className={`flex items-center justify-between mb-8 p-4 bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 transform ${animateContent
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0"
            } transition-all duration-700 ease-out sticky top-4 z-20`}
        >
          <div className="flex items-center space-x-4 sm:space-x-6">
            <button
              onClick={handleLike}
              className={`flex flex-col items-center ${hasLiked ? "text-blue-600" : "text-gray-600"
                } hover:text-blue-600 transition-colors group`}
              aria-label={hasLiked ? "Unlike" : "Like"}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${hasLiked ? "bg-blue-50" : "bg-gray-50"
                  } group-hover:bg-blue-50 transition-colors`}
              >
                <ThumbsUp
                  size={18}
                  className={`transform ${hasLiked ? "scale-110" : "scale-100"
                    } transition-transform`}
                />
              </div>
              <span className="text-xs mt-1 font-medium">{likes}</span>
            </button>

            <div className="flex flex-col items-center text-gray-600">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50">
                <Eye size={18} />
              </div>
              <span className="text-xs mt-1 font-medium">{views}</span>
            </div>

            <button
              className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors group"
              aria-label="Comments"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 group-hover:bg-blue-50 transition-colors">
                <MessageCircle size={18} />
              </div>
              <span className="text-xs mt-1 font-medium">24</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleBookmark}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isBookmarked
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 bg-gray-50 hover:bg-gray-100"
                }`}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark"}
            >
              <Bookmark
                size={18}
                className={`transform ${isBookmarked ? "scale-110 fill-current" : "scale-100"
                  } transition-transform`}
              />
            </button>

            <div className="relative">
              <button
                onClick={handleShare}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
                aria-label="Share"
              >
                <Share2 size={18} />
              </button>

              {/* Share Menu Dropdown */}
              {isShareMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                    </svg>
                    Facebook
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                    Twitter
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    LinkedIn
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy Link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Two-column layout for desktop */}
        <div className="lg:flex lg:gap-8 xl:gap-12">
          {/* Table of Contents (Desktop) */}
          <div className="hidden lg:block lg:w-64 sticky top-24 self-start max-h-[calc(100vh-150px)] overflow-y-auto">
            {tableOfContents.length > 0 && (
              <div
                className={`bg-gray-50 rounded-2xl sm:rounded-3xl p-4 mb-6 ${animateContent
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
                  } transition-all duration-700 delay-100`}
              >
                <h3 className="font-medium text-gray-900 mb-4 font-Urbanist">
                  In this article
                </h3>
                <ul className="space-y-2">
                  {tableOfContents.map((heading) => (
                    <li key={heading.id}>
                      <button
                        onClick={() => scrollToSection(heading.id)}
                        className={`text-left w-full px-3 py-2 rounded-lg text-sm transition-all ${currentSection === heading.id
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                          }`}
                      >
                        {heading.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Download Section */}
            <div
              className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl p-5 ${animateContent
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
                } transition-all duration-700 delay-200`}
            >
              <h3 className="font-medium text-gray-900 mb-3 font-Urbanist">
                Resources
              </h3>
              <p className="text-sm text-gray-600 mb-4 font-Urbanist">
                Download the complete registration guide with all details
                and requirements.
              </p>
              <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center transition-colors">
                <DownloadCloud size={16} className="mr-2" />
                Download PDF
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:flex-1">
            {/* Content Tabs (Desktop) */}
            <div className="hidden md:flex mb-8 border-b border-gray-200">
              <button
                className={`pb-4 px-6 font-medium text-sm ${activeTab === "content"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
                  } transition-colors font-Urbanist`}
                onClick={() => setActiveTab("content")}
              >
                Content
              </button>
              <button
                className={`pb-4 px-6 font-medium text-sm ${activeTab === "comments"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
                  } transition-colors font-Urbanist`}
                onClick={() => setActiveTab("comments")}
              >
                Comments (24)
              </button>
              <button
                className={`pb-4 px-6 font-medium text-sm ${activeTab === "resources"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
                  } transition-colors font-Urbanist`}
                onClick={() => setActiveTab("resources")}
              >
                Resources
              </button>
            </div>

            {/* Main Content */}
            <div
              className={`prose prose-lg max-w-none mb-16 ${animateContent
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
                } transition-all duration-1000 delay-200`}
            >
              {activeTab === "content" && (
                <div className="announcement-content prose-headings:font-Urbanist prose-headings:text-gray-800 prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600 prose-li:leading-relaxed prose-p:font-Urbanist prose-li:font-Urbanist">
                  <p className="text-xl text-gray-700 leading-relaxed font-Urbanist mb-8">
                    {announcement.description}
                  </p>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: announcement.content || "",
                    }}
                  />

                  {/* Call to Action Section */}
                  <div className="mt-12 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl border border-blue-100 not-prose">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 font-Urbanist">
                      Ready to Register?
                    </h3>
                    <p className="text-gray-700 mb-4 font-Urbanist">
                      Secure your spot for the upcoming academic year and
                      enjoy our early bird benefits.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors font-Urbanist">
                        Register Now
                      </button>
                      <button className="px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors font-Urbanist">
                        Contact Admissions
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "comments" && (
                <div className="bg-gray-50 p-8 rounded-2xl sm:rounded-3xl">
                  <div className="flex items-center justify-center flex-col">
                    <MessageCircle
                      size={48}
                      className="text-gray-300 mb-3"
                    />
                    <p className="text-center text-gray-500 mb-4 font-Urbanist">
                      Join the conversation
                    </p>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors font-Urbanist">
                      Add Comment
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "resources" && (
                <div className="bg-white border border-gray-100 p-8 rounded-2xl sm:rounded-3xl shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 font-Urbanist">
                    Resource Materials
                  </h3>

                  <div className="grid gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 font-Urbanist">
                            Registration Guide
                          </h4>
                          <p className="text-xs text-gray-500 font-Urbanist">
                            PDF • 2.4 MB
                          </p>
                        </div>
                      </div>
                      <button className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DownloadCloud size={18} />
                      </button>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 font-Urbanist">
                            Fee Structure
                          </h4>
                          <p className="text-xs text-gray-500 font-Urbanist">
                            Excel • 1.1 MB
                          </p>
                        </div>
                      </div>
                      <button className="text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DownloadCloud size={18} />
                      </button>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                          <svg
                            className="w-5 h-5 text-amber-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 font-Urbanist">
                            Campus Tour Video
                          </h4>
                          <p className="text-xs text-gray-500 font-Urbanist">
                            MP4 • 24.8 MB
                          </p>
                        </div>
                      </div>
                      <button className="text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DownloadCloud size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Author Card */}
            <div
              className={`bg-white rounded-2xl sm:rounded-3xl p-6 mb-16 shadow-sm border border-gray-100 hover:border-blue-200 transition-colors ${animateContent
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
                } transition-all duration-1000 delay-300`}
            >
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center overflow-hidden mr-4 text-white">
                  {announcement.authorAvatar ? (
                    <img
                      src={announcement.authorAvatar}
                      alt={announcement.author}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={32} />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1 font-Urbanist">
                    {announcement.author}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2 font-Urbanist">
                    {announcement.authorRole || "Publisher"}
                  </p>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors font-Urbanist">
                      Follow
                    </button>
                    <span className="text-gray-300">|</span>
                    <button className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors font-Urbanist">
                      View all posts
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Announcements Enhanced Section */}
        <div
          className={`mt-16 ${animateContent
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0"
            } transition-all duration-1000 delay-400`}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3 text-white">
                <Bell size={20} />
              </div>
              <h2 className="text-2xl font-semibold font-Urbanist">
                Related Updates
              </h2>
            </div>
            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center transition-colors font-Urbanist">
              View all
              <ArrowRight size={16} className="ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 xl:gap-8">
            {relatedAnnouncements.map((related, index) => (
              <Link
                key={related.id}
                href={`/announcements/${related.id}`}
                className={`bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer border border-gray-100 hover:border-blue-200 hover-lift stagger-item animate-float ${index === 0 ? "md:col-span-2 lg:col-span-1" : ""
                  }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={`${index === 0 ? "h-64 md:h-48 lg:h-48" : "h-48"
                    } overflow-hidden relative`}
                >
                  <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span
                      className={`text-xs font-medium text-${getCategoryColor(
                        related.category
                      )}-600 font-Urbanist`}
                    >
                      {related.category}
                    </span>
                  </div>

                  {/* Priority badge */}
                  {related.priority === "high" && (
                    <div className="absolute top-3 right-3 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium animate-pulse-blue font-Urbanist">
                      Important
                    </div>
                  )}

                  <img
                    src={related.imageUrl}
                    alt={related.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-5">
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar size={14} className="text-blue-500" />
                    <span className="text-xs font-Urbanist text-gray-500">
                      {related.date}
                    </span>

                    {related.tags && related.tags.length > 0 && (
                      <>
                        <span className="text-gray-300 font-Urbanist">•</span>
                        <span className="text-xs text-gray-500">
                          {related.tags[0]}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2  group-hover:text-blue-600 transition-colors font-Urbanist line-clamp-2">
                    {related.title}
                  </h3>
                  <p className="text-gray-600 font-Urbanist text-sm line-clamp-2 mb-4 ">
                    {related.description}
                  </p>
                  <div className="flex items-center text-blue-600 text-sm font-medium group-hover:font-semibold transition-all">
                    Read more
                    <ArrowRight
                      size={16}
                      className="ml-1 group-hover:ml-2 transition-all read-more-arrow"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Newsletter Section */}
        <div
          className={`mt-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl p-8 ${animateContent
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0"
            } transition-all duration-1000 delay-500`}
        >
          <div className="text-center max-w-xl mx-auto">
            <h3 className="text-2xl font-semibold mb-3 font-Urbanist">
              Stay Updated
            </h3>
            <p className="text-gray-600 mb-6 font-Urbanist">
              Subscribe to our newsletter to receive the latest
              announcements and updates directly to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button className="px-6 py-3 bg-blue-600 font-Urbanist hover:bg-blue-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Back to top button with animation */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 bg-blue-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors transform hover:scale-110 animate-float z-30"
          aria-label="Back to top"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </div>
  );
};

export default AnnouncementContent;