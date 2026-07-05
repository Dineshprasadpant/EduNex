"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  X,
  Users,
  Clock,
  Award,
  Monitor,
  CheckCircle,
  Filter,
  ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetchCourses } from "../../../apiCalls/fetchCources";

// Define course types
type Course = {
  _id: string;
  title: string;
  description: string[];
  category: string;
  studentsEnrolled: number;
  teachersCount: number;
  overallHours: number;
  price: number;
  onlinePrice: number;
  offlinePrice: number;
  moduleLeader: string;
  courseHighlights: string[];
  curriculum: Array<{
    title: string;
    duration: number;
    description: string;
  }>;
  learningFormat: Array<{
    name: string;
    description: string;
  }>;
  image?: string;
  deliveryMode: "online" | "offline" | "hybrid";
  schedule: Array<{
    medium: string;
    day: string;
    startTime: string;
    endTime: string;
  }>;
  priority: "low" | "medium" | "high";
};

type ApiResponse = {
  status: string;
  data: {
    courses: Course[];
    pagination: {
      currentPage: number;
      itemsPerPage: number;
      totalItems: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
};

// NoSSR wrapper component
function NoSSR({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full mt-10 bg-white px-4 sm:px-6 md:px-8 lg:px-8 xl:px-8 2xl:px-16 py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 w-96 bg-gray-200 rounded mb-8"></div>

          <div className="flex items-center mb-4">
            <div className="h-4 w-4 bg-gray-200 rounded-full mr-2"></div>
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
          </div>

          <div className="flex gap-4 mb-10">
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
            <div className="h-10 w-64 bg-gray-200 rounded"></div>
            <div className="h-10 w-48 bg-gray-200 rounded"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="bg-gray-100 rounded-xl shadow overflow-hidden"
              >
                <div className="h-48 bg-gray-200"></div>
                <div className="p-5">
                  <div className="h-6 w-3/4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 w-full bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between mb-5">
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-10 w-full bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Dialog component
interface CourseDialogProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
}

const CourseDialog: React.FC<CourseDialogProps> = ({
  course,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !course) return null;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col md:flex-row">
        {/* Image section */}
        <div className="relative w-full md:w-[40%] h-72 md:h-auto flex-shrink-0">
          <img
            src={
              course.image ||
              "https://images.unsplash.com/photo-1552664730-d307ca884978"
            }
            alt={course.title}
            className="object-contain rounded-t-xl md:rounded-l-xl md:rounded-tr-none h-full" 
          />
          <div className="absolute top-4 left-4">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium font-Urbanist">
              {course.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content section - Scrollable */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <h2 className="font-Urbanist text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold mb-4">
            {course.title}
          </h2>

          <div className="flex flex-wrap gap-4 sm:gap-6 mb-6">
            <div className="flex items-center">
              <Users className="text-blue-600 mr-2" size={20} />
              <span className="font-Urbanist text-gray-700">
                {course.studentsEnrolled} Students
              </span>
            </div>
            <div className="flex items-center">
              <Clock className="text-blue-600 mr-2" size={20} />
              <span className="font-Urbanist text-gray-700">
                {course.overallHours} Hours
              </span>
            </div>
            <div className="flex items-center bg-blue-50 px-3 py-1 rounded-md">
              <span className="font-Urbanist text-gray-700 font-semibold">
                NRP {course.price}
              </span>
            </div>
            <div className="flex items-center">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.deliveryMode === 'online' ? 'bg-green-100 text-green-800' :
                course.deliveryMode === 'offline' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                {course.deliveryMode.charAt(0).toUpperCase() + course.deliveryMode.slice(1)}
              </span>
            </div>
          </div>

          <div className="font-Urbanist text-sm sm:text-base md:text-base lg:text-lg text-gray-600 mb-8 leading-relaxed">
            {course.description.map((desc, index) => (
              <p key={index} className="mb-2">
                {desc}
              </p>
            ))}
          </div>

          <div className="space-y-6 sm:space-y-8">
            {/* Schedule section */}
            {course.schedule && course.schedule.length > 0 && (
              <div className="mt-8 font-Urbanist">
                <h3 className="font-Urbanist text-2xl font-bold mb-6 text-gray-800">
                  Class Schedule
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {course.schedule.map((sched, index) => (
                    <div
                      key={index}
                      className={`
            p-4 rounded-xl border shadow-sm transition-all hover:shadow-md
            ${sched.medium === 'online' ? 'bg-blue-50 border-blue-100' :
                          sched.medium === 'offline' ? 'bg-green-50 border-green-100' :
                            'bg-purple-50 border-purple-100'}
          `}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-Urbanist font-bold text-lg text-gray-800">
                          {sched.day}
                        </h4>
                        {sched.medium === 'both' ? (
                          <span className="flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                            <span>Hybrid</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                            </svg>
                          </span>
                        ) : sched.medium === 'online' ? (
                          <span className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            <span>Online</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            <span>Offline</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-gray-700 mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm">
                          {formatTime(sched.startTime)} - {formatTime(sched.endTime)}
                        </span>
                      </div>

                      {sched.medium === 'both' && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 font-medium mb-1">Available as:</p>
                          <div className="flex gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Online
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              In-Person
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3 className="font-Urbanist text-xl font-bold mb-4">
                Course Curriculum
              </h3>
              <div className="space-y-3">
                {course.curriculum.map((item, index) => (
                  <div key={index} className="bg-blue-50 p-3 rounded-lg font-Urbanist">
                    <h4 className="font-bold mb-1">
                      {item.title}{" "}
                      <span className="font-normal text-sm">
                        ({item.duration} hours)
                      </span>
                    </h4>
                    <p className="text-sm text-gray-700">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-Urbanist text-xl font-bold mb-4 flex items-center">
                <Award className="text-blue-600 mr-2" size={20} />
                Course Highlights
              </h3>
              <ul className="space-y-3 font-Urbanist pl-8">
                {course.courseHighlights.map((highlight, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle
                      className="text-blue-600 mr-3 flex-shrink-0 mt-1"
                      size={16}
                    />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-Urbanist text-xl font-bold mb-4 flex items-center">
                <Monitor className="text-blue-600 mr-2" size={20} />
                Learning Format
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-Urbanist">
                {course.learningFormat.map((format, index) => (
                  <div key={index} className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-bold mb-2">{format.name}</h4>
                    <p className="text-sm text-gray-700">
                      {format.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <Link href="/register" className="block w-full">
                <button className="group relative text-white px-6 sm:px-8 py-3 sm:py-4 bg-[#010794] border-2 border-[#010794] rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-lg hover:border-[#010794] hover:text-[#010794] hover:bg-transparent w-full">
                  <span className="relative z-20 font-Urbanist text-sm sm:text-base">
                    Enroll Now
                  </span>
                  <div className="absolute inset-0 w-full h-full bg-white -z-10 transform translate-x-full transition-transform duration-500 group-hover:translate-x-0" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Course card component
const CourseCard: React.FC<{
  course: Course;
  onLearnMore: () => void;
}> = ({ course, onLearnMore }) => {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      <div className="relative h-52">
        <img
          src={
            course.image ||
            "https://images.unsplash.com/photo-1552664730-d307ca884978"
          }
          alt={course.title}
          className="object-cover h-full"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-[#08049c] text-white px-3 py-1 rounded-md text-xs font-medium font-Urbanist">
            {course.category}
          </span>
        </div>

      </div>

      <div className="p-5 sm:p-6 flex flex-col flex-grow">
        <h3 className="font-Urbanist font-bold text-xl mb-3">
          {course.title}
        </h3>
        <p className="font-Urbanist text-gray-600 text-sm sm:text-base mb-4 line-clamp-2">
          {course.description && course.description[0]}
        </p>

        <div className="flex justify-between text-sm text-gray-500 mb-5">
          <div className="flex items-center">
            <Users size={16} className="mr-1 text-blue-600" />
            <span className="font-Urbanist">
              {course.studentsEnrolled} Students
            </span>
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-1 text-blue-600" />
            <span className="font-Urbanist">{course.overallHours} Hours</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.deliveryMode === 'online' ? 'bg-green-100 text-green-800' :
              course.deliveryMode === 'offline' ? 'bg-blue-100 text-blue-800' :
                'bg-purple-100 text-purple-800'
              }`}>
              {course.deliveryMode.charAt(0).toUpperCase() + course.deliveryMode.slice(1)}
            </span>
          </div>
          <div className="font-Urbanist text-gray-700 font-semibold flex">
            {course.deliveryMode == "online" || course.deliveryMode == "hybrid" ? <div>Online NRP {course.onlinePrice}</div> : ""}
            {course.deliveryMode == "offline" || course.deliveryMode == "hybrid" ? <div> / Offline NRP{course.offlinePrice}</div> : ""}
          </div>

        </div>

        <button
          onClick={onLearnMore}
          className="group relative px-6 py-3 border-2 border-[#010794] text-[#010794] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md mt-auto w-full flex items-center justify-center"
        >
          <span className="relative z-20 font-Urbanist text-sm sm:text-base flex items-center">
            <BookOpen size={16} className="mr-2" />
            Learn More
            <ChevronRight
              size={16}
              className="ml-1 group-hover:translate-x-1 transition-transform"
            />
          </span>
          <div className="absolute inset-0 w-full h-full bg-[#010794] -z-10 transform translate-x-full transition-transform duration-500 group-hover:translate-x-0" />
        </button>
      </div>
    </div>
  );
};

// Pagination component
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex justify-center items-center mt-8 space-x-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-lg ${currentPage === 1
          ? "text-gray-400 cursor-not-allowed"
          : "text-blue-600 hover:bg-blue-50"
          }`}
      >
        <ChevronLeft size={20} />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-lg ${currentPage === page
            ? "bg-blue-600 text-white"
            : "text-gray-700 hover:bg-blue-50"
            }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-lg ${currentPage === totalPages
          ? "text-gray-400 cursor-not-allowed"
          : "text-blue-600 hover:bg-blue-50"
          }`}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

// Main component content that will only render on client-side
function EngineeringCoursesContent() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 9;
  const router = useRouter();

  // Fetch courses when component mounts or dependencies change
  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true);
      setError(null);

      try {
        const response: ApiResponse = await fetchCourses(currentPage, limit);
        setCourses(response.data.courses);
        setTotalPages(response.data.pagination.totalPages);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load courses. Please try again later."
        );
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const openCourseDialog = (course: Course) => {
    setSelectedCourse(course);
    setIsDialogOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeCourseDialog = () => {
    setIsDialogOpen(false);
    document.body.style.overflow = "auto";
  };

  return (
    <div className="w-full">
      <p className="text-[#08049c] font-medium text-base sm:text-lg font-Urbanist">
        Our Programs
      </p>

      <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-5xl 2xl:text-6xl font-bold text-gray-900 mt-2 font-Urbanist leading-tight mb-8 sm:mb-10">
        Programs We Offer
      </h1>

      {loading ? (
        // Loading state
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        // Error state
        <div className="bg-red-50 text-red-600 rounded-xl p-8 text-center shadow-md">
          <h3 className="font-Urbanist text-xl font-bold mb-2">Error</h3>
          <p className="font-Urbanist">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      ) : courses.length > 0 ? (
        // Courses grid
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 xl:gap-8">
            {courses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                onLearnMore={() => openCourseDialog(course)}
              />
            ))}
          </div>
          {/* Show pagination only when there are courses and more than one page */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      ) : (
        // No courses found
        <div className="bg-white rounded-xl p-8 text-center shadow-md">
          <h3 className="font-Urbanist text-xl font-bold mb-2">
            No courses found
          </h3>
          <p className="font-Urbanist text-gray-600">
            No courses available at the moment. Please check back later.
          </p>
        </div>
      )}

      <CourseDialog
        course={selectedCourse}
        isOpen={isDialogOpen}
        onClose={closeCourseDialog}
      />
    </div>
  );
}

// Main component
export default function EngineeringCourses() {
  return (
    <div className="relative w-full mt-10 bg-white px-4 sm:px-6 md:px-8 lg:px-8 xl:px-8 2xl:px-16 py-6 sm:py-8 md:py-10 lg:py-12 overflow-hidden">
      <div className="max-w-full xl:max-w-[100rem] 2xl:max-w-[120rem] mx-auto">
        <NoSSR>
          <EngineeringCoursesContent />
        </NoSSR>
      </div>
    </div>
  );
}