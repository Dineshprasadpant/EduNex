"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence,Variants } from "framer-motion";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobileMenuOpen]);

  // Animation variants
  const menuVariants: Variants = {
  closed: { opacity: 0, x: "100%" },
  open: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      when: "beforeChildren",
      staggerChildren: 0.1,
    }
  },
  exit: {
    opacity: 0,
    x: "100%",
    transition: {
      ease: "easeInOut" as const,
      duration: 0.3,
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
    }
  }
};

 const itemVariants: Variants = {
  closed: { opacity: 0, y: 20 },
  open: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 40,
    }
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.2 }
  }
};

  const MobileMenu = () => (
    <motion.div
      className="lg:hidden fixed inset-0 z-50 flex flex-col bg-white bg-opacity-95 backdrop-blur-sm font-Urbanist"
      variants={menuVariants}
      initial="closed"
      animate="open"
      exit="exit"
    >
      {/* Close button  */}
      <motion.div
        className="absolute top-6 right-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="p-2 rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition-all duration-300"
          aria-label="Close menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </motion.div>

      {/* Logo */}
      <motion.div
        className="flex justify-center mt-12 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
      >
        <img src="/images/logo.png" alt="Logo" className="h-12 sm:h-14 md:h-16 w-auto" />
      </motion.div>

      {/* Menu items */}
      <motion.div className="flex flex-col px-6 space-y-2 mt-4">
        {[
          { href: "/", label: "Home" },
          { href: "/about", label: "About Us" },
          { href: "/courses", label: "Courses" },
          { href: "/news", label: "News" },
          { href: "/events", label: "Events" },
          { href: "/contact", label: "Contact" }
        ].map((item) => (

          <motion.div key={item.href} variants={itemVariants}>
            <Link
              href={item.href}
              className="text-2xl sm:text-3xl font-bold text-gray-900 hover:text-[#010794] relative group w-full py-3 block"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
              <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-[#010794] group-hover:w-${item.label.length * 8} transition-all duration-300 ease-in-out`}></span>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Auth buttons */}
      <motion.div
        className="mt-10 mb-12 px-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
      >
        <div className="flex flex-col space-y-4 max-w-sm mx-auto w-full">
          {[
            { href: "/login", label: "Login", style: "bg-[#010794] text-white hover:bg-[#010794]" },
            { href: "/register", label: "Register", style: "bg-transparent text-[#010794] border border-[#010794] hover:text-[#010794] hover:border-[#010794]" }
          ].map((button) => (
            <motion.div key={button.href} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={button.href}
                className={`w-full text-center px-6 py-4 text-base font-semibold rounded-full transition-all duration-300 shadow-md block ${button.style}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {button.label}
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <nav
      className={`bg-white shadow-sm z-50 transition-all duration-300 ${isScrolled ? "shadow-md" : ""}`}
      style={{ fontFamily: "GTAmerican, sans-serif" }}
    >
      <div className="max-w-full xl:max-w-[90rem] 2xl:max-w-[120rem] mx-auto">
        <div className="flex justify-between items-stretch w-full flex-wrap h-16 sm:h-18 md:h-20 lg:h-22 xl:h-24 2xl:h-24">
          <div className="flex-grow px-4 sm:px-6 md:px-8 lg:px-8 xl:px-4 2xl:px-4">
            <div className="flex items-center justify-between h-full">
              {/* Logo section */}
              <div className="flex items-center space-x-2 cursor-pointer">
                <Link href="/" passHref>
                  <img
                    src="/images/logo.png"
                    alt="Logo"
                    className="h-12 w-auto sm:h-14 md:h-16 lg:h-18 xl:h-20 2xl:h-20 transition-all duration-300 hover:opacity-80 active:scale-95"
                  />

                </Link>
              </div>

              {/* Navigation Links - Desktop only */}
              <div className="hidden lg:flex lg:items-stretch lg:h-full">
                <Link
                  href="/"
                  className="px-3 lg:px-4 h-full flex items-center text-base lg:text-lg xl:text-lg font-semibold font-Urbanist text-gray-800 transition-colors duration-300 relative group"
                >
                  Home
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-[#010794] group-hover:w-4/5 transition-all duration-300 ease-in-out"></span>
                </Link>

                <Link
                  href="/about"
                  className="px-3 lg:px-4 h-full flex items-center text-base lg:text-lg xl:text-lg font-semibold font-Urbanist text-gray-800 transition-colors duration-300 relative group"
                >
                  About Us
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-[#010794] group-hover:w-4/5 transition-all duration-300 ease-in-out"></span>
                </Link>

                <Link
                  href="/events"
                  className="px-3 lg:px-4 h-full flex items-center text-base lg:text-lg xl:text-lg font-semibold font-Urbanist text-gray-800 transition-colors duration-300 relative group"
                >
                  Events
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-[#010794] group-hover:w-4/5 transition-all duration-300 ease-in-out"></span>
                </Link>

                <Link
                  href="/news"
                  className="px-3 lg:px-4 h-full flex items-center text-base lg:text-lg xl:text-lg font-semibold font-Urbanist text-gray-800 transition-colors duration-300 relative group"
                >
                  News
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-[#010794] group-hover:w-4/5 transition-all duration-300 ease-in-out"></span>
                </Link>

                <Link
                  href="/courses"
                  className="px-3 lg:px-4 h-full flex items-center text-base lg:text-lg xl:text-lg font-semibold font-Urbanist text-gray-800 transition-colors duration-300 relative group"
                >
                  Courses
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-[#010794] group-hover:w-4/5 transition-all duration-300 ease-in-out"></span>
                </Link>

                <Link
                  href="/contact"
                  className="px-3 lg:px-4 h-full flex items-center text-base lg:text-lg xl:text-lg font-semibold font-Urbanist text-gray-800 transition-colors duration-300 relative group"
                >
                  Contact
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-[#010794] group-hover:w-4/5 transition-all duration-300 ease-in-out"></span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right side with blue background - Responsive fixes */}
          <div className=" relative flex items-center justify-end px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 z-10 min-w-[180px] sm:min-w-[200px] md:min-w-[220px] lg:min-w-[240px]">

            {/* Right side buttons */}
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-4">
              {/* Separate Login and Register buttons for desktop */}
              <div className="hidden lg:flex items-center space-x-3">
                {/* Login button with slide-up animation */}
                <Link
                  href="/login"
                  className="relative inline-flex items-center border-1 border-gray-300 px-4 sm:px-5 py-1 sm:py-2 text-sm sm:text-base font-medium font-Urbanist rounded-full overflow-hidden group transition-all duration-300"
                >
                  <span className="absolute inset-0 bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative z-10 flex items-center">
                    <span className="block group-hover:-translate-y-[2px] transition-transform duration-300">
                      Login
                    </span>
                    <span className="ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                      &rarr;
                    </span>
                  </span>
                </Link>

                {/* Register button with pulse and shadow animation */}
                <Link
                  href="/register"
                  className="relative inline-flex items-center bg-[#010794] text-white px-4 sm:px-5 py-1 sm:py-2 text-sm sm:text-base font-medium font-Urbanist rounded-full overflow-hidden group transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
                >
                  <span className="absolute inset-0 bg-[#010794] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative z-10 flex items-center">
                    <span className="block group-hover:scale-105 transition-transform duration-300">
                      Register
                    </span>
                    <span className="ml-1 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-300">
                      ✨
                    </span>
                  </span>
                </Link>
              </div>

              {/* Mobile menu button with enhanced animation */}
              <div className="lg:hidden flex items-center">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="relative inline-flex items-center justify-center p-2 sm:p-2 group"
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu"
                >
                  <span className="sr-only">Open main menu</span>
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-[#010794] opacity-90 shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:opacity-100"></span>
                  <div className="relative flex flex-col justify-center items-center w-6 h-5 z-10">
                    <span
                      className={`block w-6 h-0.5 bg-white rounded-full transition-all duration-300 ${isMobileMenuOpen
                        ? "transform rotate-45 translate-y-1.5 bg-white"
                        : "bg-white group-hover:bg-gray-100"
                        }`}
                    ></span>
                    <span
                      className={`block w-6 h-0.5 bg-white rounded-full transition-all duration-300 mt-1.5 ${isMobileMenuOpen
                        ? "opacity-0 translate-x-4"
                        : "opacity-100 group-hover:bg-gray-100"
                        }`}
                    ></span>
                    <span
                      className={`block w-6 h-0.5 bg-white rounded-full transition-all duration-300 mt-1.5 ${isMobileMenuOpen
                        ? "transform -rotate-45 -translate-y-1.5 bg-white"
                        : "bg-white group-hover:bg-gray-100"
                        }`}
                    ></span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && <MobileMenu />}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;