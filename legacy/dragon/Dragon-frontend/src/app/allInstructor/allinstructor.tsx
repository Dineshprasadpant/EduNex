"use client"
import React, { useState } from 'react';
import { motion, AnimatePresence,Variants } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Instructor {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
}

const InstructorsPage: React.FC = () => {
  const [hoveredInstructor, setHoveredInstructor] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const departmentFilters = [
    { id: "all", name: "All Departments" },
    { id: "physics", name: "Physics" },
    { id: "chemistry", name: "Chemistry" },
    { id: "mathematics", name: "Mathematics" },
    { id: "english", name: "English" }
  ];

  const instructors: Instructor[] = [
    // Physics Department
    {
      id: "1",
      name: "Dr. Baburam Tiwari",
      title: "Assistant Professor of Physics. IOE, Pulchowk Campus",
      imageUrl: "/images/teachers/1.jpg",
    },
    {
      id: "2",
      name: "Dhruba Poudel",
      title: "Assistant Professor of Physics. IOE, Pulchowk Campus",
      imageUrl: "/images/teachers/2.jpg",
    },
    {
      id: "3",
      name: "Umakant Joshi",
      title: "Assistant Professor of Physics. IOE, Pulchowk Campus",
      imageUrl: "/images/teachers/3.jpg",
    },
    {
      id: "4",
      name: "Rajesh Shrestha",
      title: "Assistant Professor of Physics. IOE, Pulchowk Campus",
      imageUrl: "/images/teachers/4.jpg",
    },

    // Chemistry Department
    {
      id: "5",
      name: "Salina Panta",
      title: "Assistant Professor of Chemistry. IOE, Pulchowk Campus",
      imageUrl: "/images/teachers/12.jpg",
    },
    {
      id: "6",
      name: "Dr. Tanka Mukhiya",
      title: "Assistant Professor of Chemistry. IOE, Pulchowk Campus",
      imageUrl: "/images/teachers/13.jpg",
    },
    {
      id: "7",
      name: "Birendra Thapa",
      title: "Assistant Professor of Chemistry. IOE, Pulchowk Campus",
      imageUrl: "/images/teachers/14.jpg",
    },
    {
      id: "8",
      name: "Prof. Dr. Kunjilal Yadav",
      title: "Faculty of Chemistry, Patan Multiple Campus",
      imageUrl: "/images/teachers/15.jpg",
    },
    {
      id: "9",
      name: "Dr. Deval Prasad Bhattarai",
      title: "Faculty of Chemistry, Amrit Science Campus",
      imageUrl: "/images/teachers/16.jpg",
    },
    {
      id: "10",
      name: "Dr. Homnath Luitel",
      title: "Faculty of Chemistry, Jubilant College",
      imageUrl: "/images/teachers/17.jpg",
    },
    {
      id: "11",
      name: "Aaryash Khatiwada",
      title: "IOE, Pulchowk Campus",
      imageUrl: "/images/teachers/18.jpg",
    },
    {
      id: "12",
      name: "Abhishwer Pandit",
      title: "Faculty of Chemistry, IOE, Pulchowk Campus",
      imageUrl: "/images/teachers/19.jpg",
    },

    // Mathematics Department
    {
      id: "13",
      name: "Hari Gyawali",
      title: "Assistant Professor of Mathematics. IOE, Pulchowk Campus",
      imageUrl: "/images/teachers/5.jpg"
    },
    {
      id: "14",
      name: "Gyanendra Gurung",
      title: "Assistant Professor of Mathematics. IOE, Pulchowk Campus",
      imageUrl: "/images/teachers/6.jpg",
    },
    {
      id: "15",
      name: "Shantiram Adhikari",
      title: "Graduate Teaching Assistant, University of Cincinnati",
      imageUrl: "/images/teachers/7.jpg"
    },
    {
      id: "16",
      name: "Ram Dinesh Shah",
      title: "Faculty of Mathematics",
      imageUrl: "/images/teachers/8.jpg"
    },
    {
      id: "17",
      name: "Uddhab Raj Neupane",
      title: "Professor of Mathematics, Asian College for Advance Studies",
      imageUrl: "/images/teachers/9.jpg"
    },
    {
      id: "18",
      name: "Prabin Adhikari",
      title: "IOE, Pulchowk Campus",
      imageUrl: "/images/teachers/10.jpg"
    },
    {
      id: "19",
      name: "Bibek Panta",
      title: "IOE, Pulchowk Campus",
      imageUrl: "/images/teachers/11.jpg"
    },

    // English Department
    {
      id: "20",
      name: "Dr. Madhav Prasad Dahal",
      title: "Assistant Professor of English. IOE, Pulchowk Campus",
      imageUrl: "/images/teachers/20.jpg"
    },
    {
      id: "21",
      name: "Rejina KC",
      title: "Assistant Professor of English. IOE, Pulchowk Campus",
      imageUrl: "/images/teachers/21.jpg"
    },
    {
      id: "22",
      name: "Santosh Jha",
      title: "Assistant Professor of English. IOE, Pulchowk Campus",
      imageUrl: "/images/teachers/22.jpg"
    },
    {
      id: "23",
      name: "Mahesh Bhatta",
      title: "Assistant Professor of English. IOE, Pulchowk Campus",
      imageUrl: "/images/teachers/23.jpg"
    },
    {
      id: "24",
      name: "Vishwa Karki",
      title: "Lecturer of English",
      imageUrl: "/images/teachers/24.jpg"
    },
    {
      id: "25",
      name: "Dr. Leknath Yadav",
      title: "English Faculty, Baneshwor Multiple Campus",
      imageUrl: "/images/teachers/25.jpg"
    }
  ];

  const getInstructorDepartment = (id: string): string => {
    const idNumber = parseInt(id);
    if (idNumber >= 1 && idNumber <= 4) return "physics";
    if (idNumber >= 5 && idNumber <= 12) return "chemistry";
    if (idNumber >= 13 && idNumber <= 19) return "mathematics";
    return "english";
  };

  const filteredInstructors = instructors.filter(instructor => {

    const matchesDepartment =
      !selectedDepartment ||
      selectedDepartment === "all" ||
      getInstructorDepartment(instructor.id) === selectedDepartment;

    return instructor && matchesDepartment;
  });

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
          <p className="text-[#040498] font-medium text-sm sm:text-base font-Urbanist mb-3 uppercase tracking-wider">
            Meet Our Team
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-Urbanist font-bold mb-4">
            Expert Dragon Academy Instructors
          </h2>
          <div className="w-12 h-0.5 bg-gray-900 mx-auto"></div>
        </div>

        {/* Department Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {departmentFilters.map((department) => (
            <button
              key={department.id}
              onClick={() => setSelectedDepartment(department.id)}
              className={`px-4 py-2 rounded-sm font-Urbanist text-sm font-medium transition-colors duration-200 ${selectedDepartment === department.id || (department.id === 'all' && !selectedDepartment)
                ? 'bg-[#040498] text-white'
                : 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
            >
              {department.name}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="mb-6 text-center">
          <p className="text-gray-600 font-medium font-Urbanist">
            Showing {filteredInstructors.length} of {instructors.length} instructors
            {selectedDepartment && selectedDepartment !== "all" && ` in ${departmentFilters.find(d => d.id === selectedDepartment)?.name}`}
          </p>
        </div>

        {/* Instructors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-16">
          {filteredInstructors.map((instructor) => (
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
                    className="w-full h-full object-cover"
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

                {/* Department indicator */}
                <div className="pt-2">
                  <div className={`inline-block text-xs font-medium px-3 py-1 rounded-sm font-Urbanist ${getInstructorDepartment(instructor.id) === 'physics' ? 'bg-indigo-100 text-indigo-800' :
                    getInstructorDepartment(instructor.id) === 'chemistry' ? 'bg-emerald-100 text-emerald-800' :
                      getInstructorDepartment(instructor.id) === 'mathematics' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                    }`}>
                    {getInstructorDepartment(instructor.id).charAt(0).toUpperCase() + getInstructorDepartment(instructor.id).slice(1)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* No Results Message */}
        {filteredInstructors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No instructors found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
            <Button
              onClick={() => setSelectedDepartment(null)}
              className="px-4 py-2 bg-[#040498] text-white rounded-sm hover:bg-blue-700 transition-colors duration-200"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorsPage;