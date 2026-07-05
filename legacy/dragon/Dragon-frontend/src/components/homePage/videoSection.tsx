"use client";

import { Play, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const VideoSection = ({
  videoUrl = "/promotion/video.mp4",
  thumbnailUrl = "/promotion/thumbnail.png"
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Effect to handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (isPlaying) {
        const videoSection = document.getElementById("video-section");
        if (videoSection) {
          const rect = videoSection.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const isSectionOutOfView =
            rect.top < -300 || rect.bottom > viewportHeight + 300;
          const isSignificantlyVisible =
            (rect.top >= -100 && rect.top <= viewportHeight) ||
            (rect.bottom >= 0 && rect.bottom <= viewportHeight + 100) ||
            (rect.top <= 0 && rect.bottom >= viewportHeight);
          setIsSticky(isSectionOutOfView && !isSignificantlyVisible);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isPlaying]);

  // Handle play/pause when isPlaying changes
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        // Disable PiP by removing the attribute
        videoRef.current.disablePictureInPicture = true;
        
        videoRef.current.play().catch(error => {
          console.error("Video play failed:", error);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <section id="video-section" className="py-24 relative">
      <div className="container mx-auto px-4 flex justify-center">
        <div className="relative w-full max-w-5xl">
          <div
            className={`absolute -top-8 -left-8 -bottom-8 -right-8 border-2 border-dashed border-blue-300 rounded-[40px] transition-all duration-700 ${
              isHovering ? "border-blue-500 scale-[1.02]" : ""
            }`}
          ></div>

          <div
            className="relative rounded-3xl overflow-hidden bg-gray-100 shadow-lg transition-transform duration-500 ease-in-out aspect-video"
            style={{
              transform: isHovering ? "translateY(-8px)" : "translateY(0)",
            }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {!isPlaying && (
              <>
                <div className="w-full h-full relative">
                  <img
                    src={thumbnailUrl}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover transition-all duration-700"
                    style={{
                      filter: isHovering ? "brightness(0.85)" : "brightness(1)",
                      transform: isHovering ? "scale(1.03)" : "scale(1)",
                    }}
                  />
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
                    aria-label="Play video"
                  >
                    <div className="relative">
                      <div
                        className={`absolute inset-0 rounded-full ${
                          isHovering ? "animate-pulse" : ""
                        } bg-white opacity-40`}
                        style={{
                          width: "6rem",
                          height: "6rem",
                          marginLeft: "-0.75rem",
                          marginTop: "-0.75rem",
                          filter: "blur(8px)"
                        }}
                      ></div>
                      <div
                        className={`w-20 h-20 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-500 ${
                          isHovering ? "scale-110" : ""
                        }`}
                        style={{
                          background: "rgba(255,255,255,0.15)",
                          border: "1px solid rgba(255,255,255,0.3)",
                          boxShadow: isHovering
                            ? "0 10px 25px rgba(0,0,0,0.2)"
                            : "0 5px 15px rgba(0,0,0,0.1)"
                        }}
                      >
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                            isHovering ? "scale-110" : ""
                          }`}
                          style={{
                            background: "#010794",
                            boxShadow: "0 0 15px rgba(0,0,0,0.5)"
                          }}
                        >
                          <Play
                            className={`w-8 h-8 ml-1 transition-all duration-500 ${
                              isHovering ? "text-white scale-110" : "text-gray-200"
                            }`}
                            strokeWidth={2.5}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Video Player */}
      {isPlaying && (
        <div
          className={`${
            isSticky
              ? "fixed bottom-6 right-6 z-50 w-80 h-45 shadow-2xl rounded-lg overflow-hidden transition-all duration-500"
              : "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[95%] h-[85%] max-w-6xl bg-[#010794] rounded-xl shadow-2xl overflow-hidden transition-all duration-500 z-50"
          }`}
        >
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              className="w-full h-full object-contain bg-black"
              controls
              autoPlay
              playsInline
              controlsList="nodownload noplaybackrate"
              disablePictureInPicture
              onEnded={() => setIsPlaying(false)}
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <button
              className={`absolute top-4 right-4 bg-white/20 rounded-full p-2 hover:bg-white/30 transition-all duration-300 hover:scale-110 ${
                isSticky ? "scale-75" : ""
              }`}
              onClick={() => setIsPlaying(false)}
              aria-label="Close video"
            >
              <X className="text-white" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default VideoSection;