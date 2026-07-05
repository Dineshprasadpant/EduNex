import React, { useState } from "react";
import { motion, AnimatePresence,Variants } from "framer-motion";
import { Button } from '../ui/button';

interface Instructor {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
  department: string;
}

const InstructorsSection: React.FC = () => {

  const instructors: Instructor[] = [
    {
      id: "1",
      name: "Dr. Baburam Tiwari",
      title: "Assistant Professor of Physics",
      imageUrl: "/images/teachers/1.jpg",
      department: "physics"
    },
    {
      id: "2",
      name: "Salina Panta",
      title: "Assistant Professor of Chemistry",
      imageUrl: "/images/teachers/12.jpg",
      department: "chemistry"
    },
    {
      id: "3",
      name: "Hari Gyawali",
      title: "Assistant Professor of Mathematics",
      imageUrl: "/images/teachers/5.jpg",
      department: "mathematics"
    },
    {
      id: "4",
      name: "Dr. Madhav Prasad Dahal",
      title: "Assistant Professor of English",
      imageUrl: "/images/teachers/20.jpg",
      department: "english"
    },
  ];

  const cardVariants: Variants = {
  rest: { y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  hover: { y: -8, transition: { duration: 0.3, ease: "easeOut" as const } },
};

  const overlayVariants = {
    rest: {
      opacity: 0,
      transition: {
        duration: 0.2
      }
    },
    hover: {
      opacity: 1,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <div className="relative w-full mt-10 bg-white px-4 sm:px-6 md:px-8 lg:px-8 xl:px-8 2xl:px-16 py-12 sm:py-16 lg:py-24">
      <div className="max-w-full xl:max-w-[100rem] 2xl:max-w-[120rem] mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-[#010794] font-semibold text-sm sm:text-base font-Urbanist mb-3 uppercase tracking-wider">
            Meet Our Team
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl  font-Urbanist font-bold  mb-4">
            Expert Instructors
          </h2>
          <div className="w-12 h-0.5 bg-gray-900 mx-auto"></div>
        </div>

        {/* Instructors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-16">
          {instructors.map((instructor, index) => (
            <motion.div
              key={instructor.id}
              className="group relative cursor-pointer"
              variants={cardVariants}
              initial="rest"
              whileHover="hover"
            >
              {/* Image Container */}
              <div className="relative overflow-hidden mb-6">
                <div className="aspect-[4/5] w-full bg-gray-100 overflow-hidden">
                  <img
                    src={instructor.imageUrl}
                    alt={instructor.name}
                    className="w-full h-full object-cover "
                  />
                  
                  {/* Subtle overlay on hover */}
                  <motion.div
                    className="absolute inset-0 bg-black/10"
                    variants={overlayVariants}
                    initial="rest"
                    animate={"rest"}
                  />
                </div>
              </div>

              {/* Instructor Info */}
              <div className="text-center space-y-2">
                <h3 className="text-xl sm:text-2xl font-Urbanist font-bold text-gray-900 leading-tight">
                  {instructor.name}
                </h3>
                
                <p className="text-sm sm:text-base font-Urbanist text-gray-600 leading-relaxed">
                  {instructor.title}
                </p>

                {/* Department indicator - minimal line */}
                <div className="pt-2">
                  <div className="w-8 h-px bg-gray-300 mx-auto opacity-60"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button
            size="lg"
            asChild
            className="group relative inline-flex items-center px-8 py-4 bg-transparent border border-[#010794] text-[#010794] font-Urbanist text-sm tracking-wider uppercase hover:bg-[#010794] hover:text-white transition-all duration-300"
          >
            <a href="/allInstructor" className="flex items-center gap-3">
              <span>View All Instructors</span>
              <motion.svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </motion.svg>
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InstructorsSection;