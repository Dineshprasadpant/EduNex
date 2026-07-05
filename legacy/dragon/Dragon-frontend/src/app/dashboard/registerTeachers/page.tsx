'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { Loader2, ChevronLeft, ChevronRight, UserPlus, Mail, Phone, Lock, BookOpen, Check } from 'lucide-react';
import { apiService } from '../../../../apiCalls/registerTeacher';
import { fetchCourses } from '../../../../apiCalls/fetchCourses';

interface Course {
    _id: string;
    title: string;
}

interface TeacherData {
    fullname: string;
    email: string;
    phone: string;
    password: string;
    courseEnrolled: string;
    citizenshipImageUrl: string;
    plan: 'full' | 'half' | 'free';
}

export default function TeacherRegistrationForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [courses, setCourses] = useState<Course[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingCourses, setIsLoadingCourses] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formValues, setFormValues] = useState({
        fullname: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        courseEnrolled: '',
        citizenshipImageUrl: 'https://example.com/placeholder-image.jpg', // Default value
        plan: 'full' // Hardcoded to 'full'
    });

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormValues(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Fetch courses with pagination
    const loadCourses = async (page: number = 1) => {
        try {
            setIsLoadingCourses(true);
            const response = await fetchCourses(page, 5); // Show 5 courses per page
            setCourses(response.data.courses);
            setTotalPages(response.data.pagination.totalPages);
            setCurrentPage(response.data.pagination.currentPage);
        } catch (error) {
            toast.error('Failed to load courses');
            console.error('Error loading courses:', error);
        } finally {
            setIsLoadingCourses(false);
        }
    };

    // Load courses on component mount and when page changes
    useEffect(() => {
        loadCourses(currentPage);
    }, [currentPage]);

    const validateForm = (): Record<string, string> => {
        const newErrors: Record<string, string> = {};

        if (!formValues.fullname || formValues.fullname.length < 2) {
            newErrors.fullname = 'Full name must be at least 2 characters.';
        }

        if (!formValues.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
            newErrors.email = 'Please enter a valid email address.';
        }

        if (!formValues.phone || formValues.phone.length < 10) {
            newErrors.phone = 'Phone number must be at least 10 digits.';
        }

        if (!formValues.password || formValues.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters.';
        }

        if (!formValues.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formValues.password !== formValues.confirmPassword) {
            newErrors.confirmPassword = "Passwords don't match";
        }

        if (!formValues.courseEnrolled) {
            newErrors.courseEnrolled = 'Please select a course.';
        }

        if (!formValues.citizenshipImageUrl ||
            !/^https?:\/\/.+\..+/.test(formValues.citizenshipImageUrl)) {
            newErrors.citizenshipImageUrl = 'Please enter a valid URL for citizenship image.';
        }

        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validateForm();
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        try {
            setIsSubmitting(true);

            const teacherData: TeacherData = {
                fullname: formValues.fullname,
                email: formValues.email,
                phone: formValues.phone,
                password: formValues.password,
                courseEnrolled: formValues.courseEnrolled,
                citizenshipImageUrl: formValues.citizenshipImageUrl,
                plan: 'full' // Hardcoded to 'full' as requested
            };

            console.log("Teacher data to submit:", teacherData);

            await apiService.registerTeacher(teacherData);

            toast.success('Teacher registered successfully!');

            // Reset form
            setFormValues({
                fullname: '',
                email: '',
                phone: '',
                password: '',
                confirmPassword: '',
                courseEnrolled: '',
                citizenshipImageUrl: 'https://example.com/placeholder-image.jpg',
                plan: 'full'
            });

        } catch (error: any) {
            console.error("Submission error:", error);
            toast.error(error.message || 'Failed to register teacher');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="lg:p-15 bg-white shadow-lg overflow-hidden min-h-[100vh] ">
            <div className="md:flex">
                <div className="md:shrink-0 bg-[#182c34] p-6 text-white md:w-1/3">
                    <div className="h-full flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-6">Teacher Registration</h2>
                            <p className="text-blue-100 mb-6">Register new teachers to join our platform and start teaching their expertise.</p>
                        </div>
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center space-x-2">
                                <Check className="h-5 w-5 text-blue-200" />
                                <p>Full access to Batches</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Check className="h-5 w-5 text-blue-200" />
                                <p>Create and manage Questions</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Check className="h-5 w-5 text-blue-200" />
                                <p>Can Add class Materials</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8 md:w-2/3">
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold text-gray-800">Register New Teacher</h1>
                        <p className="text-gray-600 mt-1">Add a new teacher with full access privileges</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name Field */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserPlus className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="fullname"
                                        value={formValues.fullname}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className={`pl-10 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.fullname ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                </div>
                                {errors.fullname && (
                                    <p className="text-red-500 text-xs">{errors.fullname}</p>
                                )}
                                <p className="text-gray-500 text-xs">The teacher's full legal name</p>
                            </div>

                            {/* Email Field */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formValues.email}
                                        onChange={handleChange}
                                        placeholder="john.doe@example.com"
                                        className={`pl-10 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-red-500 text-xs">{errors.email}</p>
                                )}
                                <p className="text-gray-500 text-xs">The teacher's official email address</p>
                            </div>

                            {/* Phone Field */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formValues.phone}
                                        onChange={handleChange}
                                        placeholder="9876543210"
                                        className={`pl-10 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="text-red-500 text-xs">{errors.phone}</p>
                                )}
                                <p className="text-gray-500 text-xs">The teacher's contact number</p>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formValues.password}
                                        onChange={handleChange}
                                        placeholder="••••••"
                                        className={`pl-10 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                </div>
                                {errors.password && (
                                    <p className="text-red-500 text-xs">{errors.password}</p>
                                )}
                                <p className="text-gray-500 text-xs">At least 6 characters long</p>
                            </div>

                            {/* Confirm Password Field */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formValues.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••"
                                        className={`pl-10 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
                                )}
                                <p className="text-gray-500 text-xs">Re-enter the password to confirm</p>
                            </div>

                            {/* Course Selection */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Course
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <BookOpen className="h-5 w-5 mb-8 text-gray-400" />
                                    </div>
                                    {isLoadingCourses ? (
                                        <div className="flex justify-center py-2">
                                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                        </div>
                                    ) : (
                                        <>
                                            <select
                                                name="courseEnrolled"
                                                value={formValues.courseEnrolled}
                                                onChange={handleChange}
                                                className={`pl-10 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.courseEnrolled ? 'border-red-500' : 'border-gray-300'}`}
                                            >
                                                <option value="">Select a course</option>
                                                {courses.map((course) => (
                                                    <option key={course._id} value={course._id}>
                                                        {course.title}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="flex items-center justify-between mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                    disabled={currentPage <= 1}
                                                    className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </button>
                                                <span className="text-xs text-gray-600">
                                                    Page {currentPage} of {totalPages}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                    disabled={currentPage >= totalPages}
                                                    className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-50"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                                {errors.courseEnrolled && (
                                    <p className="text-red-500 text-xs">{errors.courseEnrolled}</p>
                                )}
                                <p className="text-gray-500 text-xs">The course this teacher will be teaching</p>
                            </div>


                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#182c34] hover:bg-[#334a53] text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center disabled:bg-blue-400"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Registering...
                                    </>
                                ) : (
                                    'Register Teacher'
                                )}
                            </button>
                        </div>
                    </form>
                    <Toaster></Toaster>
                </div>
            </div>

        </div>
    );
}