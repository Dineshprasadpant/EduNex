"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";
import { ArrowUp, Mail, ChevronUp, MapPin, Phone } from 'lucide-react';
import { subscribeEmail } from '../../apiCalls/addSubscirber';
import { Toaster } from 'react-hot-toast';

const Footer: React.FC = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [email, setEmail] = useState("");

  const scrollToTop = (): void => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await subscribeEmail(email);
    setEmail(""); // Clear the input after submission
  };

  return (
    <footer className="relative w-full bg-gradient-to-br from-gray-900 to-blue-900 text-white px-4 sm:px-6 md:px-8 lg:px-8 xl:px-8 2xl:px-16 py-12 sm:py-16 md:py-20 lg:py-24 font-Urbanist">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-white/10"></div>
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 rounded-full bg-white/5"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full bg-white/8"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Newsletter Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 sm:p-8 md:p-10 mb-12 md:mb-16 border border-white/10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 ">
                Stay Updated
              </h2>
              <p className="text-gray-300 text-sm sm:text-base">
                Subscribe to our newsletter for the latest updates and insights
              </p>
            </div>
            <div className="w-full lg:w-auto lg:min-w-[400px]">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#010794] rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-6">
              <h2 className="text-3xl font-bold pb-2">
                Dragon
              </h2>
            </div>
            <p className="text-gray-300 mb-8 leading-relaxed">
              Dragon is an education foundation that supports students in their learning journey with innovative programs and resources.
            </p>
            
            {/* Social Media */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Follow Us</h3>
              <div className="flex gap-3">
                {[
                  { icon: FaFacebookF, href: "https://www.facebook.com/share/1FpZ7ckGcN/?mibextid=wwXIfr", color: "hover:bg-[#010794]" },
                  { icon: FaInstagram, href: "https://www.instagram.com/dragon_education_foundation_?igsh=dzg1NW9pOHk0YXI%3D&utm_source=qr", color: "hover:bg-pink-600" },
                  { icon: FaLinkedinIn, href: "#", color: "hover:bg-blue-700" },
                  { icon: FaYoutube, href: "#", color: "hover:bg-red-600" }
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all duration-300 ${social.color} hover:scale-110 hover:shadow-lg border border-white/20`}
                  >
                    <social.icon size={16} className="text-white" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-white">Quick Links</h3>
            <ul className="space-y-3">
              {["Home", "About Us", "Courses", "Categories", "Pricing", "Contact"].map((link, index) => (
                <li key={index}>
                  <Link
                    href={link === "Home" ? "/" : `/${link.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-semibold mb-6 text-white">Get In Touch</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Address</p>
                    <p className="text-gray-300 text-sm">New Baneshwor, Kathmandu</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Phone</p>
                    <a
                      href="tel:+97714579540"
                      className="text-gray-300 text-sm hover:text-white transition-colors duration-300 block"
                    >
                      +977-01-4579540
                    </a>
                    <a
                      href="tel:+9779704541292"
                      className="text-gray-300 text-sm hover:text-white transition-colors duration-300 block"
                    >
                      +977 970 454 1292
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Email</p>
                    <a
                      href="mailto:dragonfoundation555@gmail.com"
                      className="text-gray-300 text-sm hover:text-white transition-colors duration-300"
                    >
                      dragonfoundation555@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/10">
          <div className="text-center text-gray-400 text-sm">
            <p>© 2025 Dragon Education Foundation. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-12 h-12 bg-[#010794] rounded-full flex items-center justify-center z-50 shadow-lg transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-white/20"
          aria-label="Back to top"
        >
          <ChevronUp size={20} className="text-white" />
        </button>
      )}
      
      <Toaster />
    </footer>
  );
};

export default Footer;