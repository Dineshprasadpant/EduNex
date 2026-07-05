'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import {
    AlertCircle, Edit, Trash, Search, Info, Plus, X,
    Filter, ChevronDown, ChevronRight, Save, MoreHorizontal,
    Clock, DollarSign, UserPlus, Book, CheckCircle2, Users, Layout,
    Upload, Loader, Image as ImageIcon, Calendar
} from 'lucide-react';
import { fetchCourseSummaries, fetchCourseById, updateCourse, deleteCourse, CourseSummary, CourseDetails } from '../../../../apiCalls/updateCourse';
import { deleteUploadedFile, uploadFile } from "../../../../apiCalls/fileUpload";
import { useRouter } from 'next/navigation';

interface LearningFormat {
    name: string;
    description: string;
}

interface CurriculumItem {
    title: string;
    duration: number;
    description: string;
}

interface ScheduleItem {
    day: string;
    startTime: string;
    endTime: string;
    medium: string;
}

interface CourseSummaryWithImage extends CourseSummary {
    imageUrl?: string;
}

interface CourseDetailsWithImage extends CourseDetails {
    imageUrl?: string;
}

interface PaginationState {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

interface FormData {
    title: string;
    description: string[];
    teachersCount: number;
    courseHighlights: string[];
    overallHours: number;
    moduleLeader: string;
    category: string;
    learningFormat: LearningFormat[];
    price: number;
    onlinePrice?: number;
    offlinePrice?: number;
    curriculum: CurriculumItem[];
    imageUrl?: string;
    priority: 'high' | 'medium' | 'low';
    deliveryMode: 'online' | 'offline' | 'hybrid';
    schedule?: ScheduleItem[];
}

interface FileUploadInputProps {
    id: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isUploading: boolean;
    accept?: string;
    label?: string;
}

export default function ManageCourses() {
    const [courses, setCourses] = useState<CourseSummaryWithImage[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<CourseSummaryWithImage[]>([]);
    const [paginations, setPaginations] = useState<PaginationState>({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [currentCourse, setCurrentCourse] = useState<CourseDetailsWithImage | null>(null);
    const [activeTab, setActiveTab] = useState('basic');
    const [saveLoading, setSaveLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
    const router = useRouter();

    const [formData, setFormData] = useState<FormData>({
        title: '',
        description: [''],
        teachersCount: 1,
        courseHighlights: [''],
        overallHours: 0,
        moduleLeader: '',
        category: '',
        learningFormat: [{ name: '', description: '' }],
        price: 0,
        onlinePrice: 0,
        offlinePrice: 0,
        curriculum: [{ title: '', duration: 0, description: '' }],
        imageUrl: '',
        priority: 'medium',
        deliveryMode: 'online'
    });

    useEffect(() => {
        const loadCourses = async () => {
            try {
                setLoading(true);
                const { courses, pagination } = await fetchCourseSummaries(
                    paginations.currentPage,
                    paginations.itemsPerPage
                );

                setCourses(courses);
                setFilteredCourses(courses);
                setPaginations(pagination);
            } catch (error: any) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        loadCourses();
    }, [paginations.currentPage, paginations.itemsPerPage]);

    const FileUploadInput: React.FC<FileUploadInputProps> = ({
        id,
        onChange,
        isUploading,
        accept = 'image/png, image/jpeg',
        label = 'Upload Image'
    }) => (
        <div className="w-full">
            {isUploading ? (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 flex items-center justify-center h-28">
                    <div className="flex flex-col items-center gap-2 text-blue-700">
                        <Loader className="h-5 w-5 animate-spin" />
                        <span className="text-sm font-medium">Uploading image...</span>
                    </div>
                </div>
            ) : (
                <Label htmlFor={id} className="cursor-pointer block w-full">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors flex flex-col items-center justify-center h-28">
                        <div className="flex flex-col items-center gap-2 text-gray-700">
                            <div className="bg-gray-100 h-10 w-10 rounded-full flex items-center justify-center">
                                <Upload className="h-5 w-5 text-gray-600" />
                            </div>
                            <span className="text-sm font-medium text-center">{label}</span>
                            <p className="text-xs text-gray-500 text-center">
                                Accepted formats: PNG, JPG (max 5MB)
                            </p>
                        </div>
                    </div>
                </Label>
            )}
            <Input
                id={id}
                type="file"
                accept={accept}
                onChange={onChange}
                className="hidden"
                disabled={isUploading}
            />
        </div>
    );

    // Update the handleFileUpload function
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error("File size exceeds 5MB limit");
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error("Only image files are allowed");
            return;
        }

        try {
            setUploadingImage(true);
            // Create a preview URL for the local file
            const previewUrl = URL.createObjectURL(file);
            setPreviewImage(previewUrl);

            // Upload the file to S3
            const result = await uploadFile(file);

            if (result.success) {
                setFormData({
                    ...formData,
                    imageUrl: result.data.url
                });
                toast.success("Image uploaded successfully!");
            } else {
                // If upload fails, clear the preview
                setPreviewImage("");
                toast.error(result.message || "Failed to upload image");
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            setPreviewImage("");
            toast.error("Failed to upload image. Please try again.");
        } finally {
            setUploadingImage(false);
            e.target.value = '';
        }
    };

    const handleRemoveImage = async () => {
        if (!formData.imageUrl) {
            setPreviewImage("");
            return;
        }

        try {
            // Only try to delete if the URL is from S3 (not a local preview)
            if (formData.imageUrl.startsWith('http') && !formData.imageUrl.startsWith('blob:')) {
                await deleteUploadedFile(formData.imageUrl);
            }

            setPreviewImage("");
            setFormData({
                ...formData,
                imageUrl: ""
            });
            toast.success("Image removed successfully");
        } catch (error) {
            console.error("Error removing image:", error);
            toast.error("Failed to remove image. Please try again.");
        }
    };

    const handlePageChange = (newPage: number) => {
        setPaginations(prev => ({ ...prev, currentPage: newPage }));
    };

    const openEditDialog = async (courseId: string) => {
        try {
            setLoading(true);
            const courseDetails = await fetchCourseById(courseId);

            setCurrentCourse(courseDetails);
            const imageUrl = courseDetails.imageUrl || courseDetails.image || courseDetails.featuredImage || '';

            setFormData({
                title: courseDetails.title,
                description: courseDetails.description?.length ? courseDetails.description : [''],
                teachersCount: courseDetails.teachersCount || 1,
                courseHighlights: courseDetails.courseHighlights?.length ? courseDetails.courseHighlights : [''],
                overallHours: courseDetails.overallHours || 0,
                moduleLeader: courseDetails.moduleLeader || '',
                category: courseDetails.category || '',
                learningFormat: courseDetails.learningFormat?.length ? courseDetails.learningFormat : [{ name: '', description: '' }],
                price: courseDetails.price || 0,
                onlinePrice: courseDetails.onlinePrice || 0,
                offlinePrice: courseDetails.offlinePrice || 0,
                curriculum: courseDetails.curriculum?.length ? courseDetails.curriculum : [{ title: '', duration: 0, description: '' }],
                imageUrl,
                priority: courseDetails.priority || 'medium',
                deliveryMode: courseDetails.deliveryMode || 'online'
            });

            setScheduleItems(courseDetails.schedule || []);
            setPreviewImage(imageUrl);
            setActiveTab('basic');
            setIsEditDialogOpen(true);
        } catch (error: any) {
            toast.error("Failed to load course details");
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const openDeleteDialog = (course: CourseSummaryWithImage) => {
        setCurrentCourse({
            ...course,
            description: [],
            courseHighlights: [],
            learningFormat: [],
            curriculum: [],
            schedule: []
        });
        setIsDeleteDialogOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'teachersCount' || name === 'overallHours' || name === 'price' ||
                name === 'onlinePrice' || name === 'offlinePrice'
                ? Number(value)
                : value
        });
    };

    const handleArrayChange = (field: keyof FormData, index: number, value: string) => {
        const newArray = [...formData[field] as string[]];
        newArray[index] = value;
        setFormData({ ...formData, [field]: newArray });
    };

    const handleLearningFormatChange = (index: number, field: keyof LearningFormat, value: string) => {
        const newFormats = [...formData.learningFormat];
        newFormats[index] = { ...newFormats[index], [field]: value };
        setFormData({ ...formData, learningFormat: newFormats });
    };

    const handleCurriculumChange = (index: number, field: keyof CurriculumItem, value: string | number) => {
        const newCurriculum = [...formData.curriculum];
        newCurriculum[index] = {
            ...newCurriculum[index],
            [field]: field === 'duration' ? Number(value) : value
        };
        setFormData({ ...formData, curriculum: newCurriculum });
    };

    const handleScheduleChange = (index: number, field: keyof ScheduleItem, value: string) => {
        const newSchedule = [...scheduleItems];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        console.log(newSchedule);
        setScheduleItems(newSchedule);
    };

    const addArrayItem = (field: keyof FormData) => {
        setFormData({
            ...formData,
            [field]: [...formData[field] as string[], '']
        });
    };

    const removeArrayItem = (field: keyof FormData, index: number) => {
        const newArray = [...formData[field] as string[]];
        newArray.splice(index, 1);
        setFormData({ ...formData, [field]: newArray });
    };

    const addLearningFormat = () => {
        setFormData({
            ...formData,
            learningFormat: [...formData.learningFormat, { name: '', description: '' }]
        });
    };

    const removeLearningFormat = (index: number) => {
        const newFormats = [...formData.learningFormat];
        newFormats.splice(index, 1);
        setFormData({ ...formData, learningFormat: newFormats });
    };

    const addCurriculumItem = () => {
        setFormData({
            ...formData,
            curriculum: [...formData.curriculum, { title: '', duration: 0, description: '' }]
        });
    };

    const removeCurriculumItem = (index: number) => {
        const newCurriculum = [...formData.curriculum];
        newCurriculum.splice(index, 1);
        setFormData({ ...formData, curriculum: newCurriculum });
    };

    const addScheduleItem = () => {
        setScheduleItems([...scheduleItems, { day: 'Monday', medium: 'both', startTime: '09:00', endTime: '17:00' }]);
    };

    const removeScheduleItem = (index: number) => {
        const newSchedule = [...scheduleItems];
        newSchedule.splice(index, 1);
        setScheduleItems(newSchedule);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCourse?._id) return;

        try {
            setSaveLoading(true);
            const cleanedFormData = {
                ...formData,
                image: formData.imageUrl,
                description: formData.description.filter(d => d.trim() !== ''),
                courseHighlights: formData.courseHighlights.filter(h => h.trim() !== ''),
                learningFormat: formData.learningFormat.filter(f => f.name.trim() !== ''),
                curriculum: formData.curriculum.filter(c => c.title.trim() !== ''),
                schedule: formData.deliveryMode !== 'online' ? scheduleItems : undefined
            };

            // Remove imageUrl property 
            delete cleanedFormData.imageUrl;

            await updateCourse(currentCourse._id, cleanedFormData);
            toast.success("Course updated successfully");
            setIsEditDialogOpen(false);

            const { courses, pagination } = await fetchCourseSummaries(
                paginations.currentPage,
                paginations.itemsPerPage
            );
            setCourses(courses);
            setFilteredCourses(courses);
            setPaginations(pagination);
        } catch (error) {
            toast.error("Failed to update course");
            console.error('Error updating course:', error);
        } finally {
            setSaveLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!currentCourse?._id) return;

        try {
            setDeleteLoading(true);
            await deleteCourse(currentCourse._id);
            toast.success("Course deleted successfully");
            setIsDeleteDialogOpen(false);

            const { courses, pagination } = await fetchCourseSummaries(
                paginations.currentPage,
                paginations.itemsPerPage
            );
            setCourses(courses);
            setFilteredCourses(courses);
            setPaginations(pagination);
        } catch (error) {
            toast.error("Failed to delete course");
            console.error('Error deleting course:', error);
        } finally {
            setDeleteLoading(false);
        }
    };

    const categories = [...new Set(courses.map(course => course.category))].filter(Boolean);

    const formTabs = [
        { id: 'basic', label: 'Basic Info', icon: <Book size={18} /> },
        { id: 'content', label: 'Content', icon: <Layout size={18} /> },
        { id: 'formats', label: 'Learning Formats', icon: <Users size={18} /> },
        { id: 'curriculum', label: 'Curriculum', icon: <Clock size={18} /> },
        { id: 'schedule', label: 'Schedule', icon: <Calendar size={18} /> },
    ];

    useEffect(() => {
        return () => {
            // Clean up any object URLs when component unmounts
            if (previewImage && previewImage.startsWith('blob:')) {
                URL.revokeObjectURL(previewImage);
            }
        };
    }, [previewImage]);

    return (
        <div className="container mx-auto py-8 px-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-Urbanist font-bold text-black mb-2">Course Management</h1>
                    <p className="text-gray-700 font-Urbanist">View, edit and manage your learning platform courses</p>
                </div>
                <Button
                    className="bg-black hover:bg-gray-800 text-white"
                    onClick={() => router.push("/dashboard/addCourses")}
                >
                    <Plus size={16} className="mr-2" /> Add Course
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 p-4 rounded-lg flex items-center mb-6 border border-red-200">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                    <p className="text-red-700 font-Urbanist">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="rounded-full bg-gray-200 h-12 w-12 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <p className="text-gray-500 font-Urbanist mt-4">Loading courses...</p>
                </div>
            ) : (
                <>
                    <Card className="mb-6 border-0 shadow-lg rounded-xl overflow-hidden">
                        <CardHeader className="bg-white border-b pb-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-2xl font-Urbanist text-black">Course Library</CardTitle>
                                    <p className="text-gray-600 font-Urbanist mt-1">
                                        {paginations.totalItems} {paginations.totalItems === 1 ? 'course' : 'courses'} available
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table className="w-full">
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="font-Urbanist text-black">Title</TableHead>
                                            <TableHead className="font-Urbanist text-black">Category</TableHead>
                                            <TableHead className="font-Urbanist text-black">Instructor</TableHead>
                                            <TableHead className="font-Urbanist text-black">Price</TableHead>
                                            <TableHead className="font-Urbanist text-black">Hours</TableHead>
                                            <TableHead className="font-Urbanist text-black">Students</TableHead>
                                            <TableHead className="font-Urbanist text-black">Priority</TableHead>
                                            <TableHead className="font-Urbanist text-black">Mode</TableHead>
                                            <TableHead className="text-right font-Urbanist text-black">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCourses.length > 0 ? (
                                            filteredCourses.map((course) => (
                                                <TableRow key={course._id} className="hover:bg-gray-50">
                                                    <TableCell className="font-medium text-black">
                                                        <div className="flex items-center">
                                                            {course.imageUrl ? (
                                                                <div className="w-10 h-10 rounded-md overflow-hidden mr-3 flex-shrink-0">
                                                                    <img
                                                                        src={course.imageUrl}
                                                                        alt={course.title}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center mr-3 text-black font-medium flex-shrink-0">
                                                                    {course.title.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            {course.title}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="bg-gray-50 text-black border-gray-200 font-Urbanist">
                                                            {course.category}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-Urbanist text-black">{course.moduleLeader}</TableCell>
                                                    <TableCell className="font-Urbanist text-black">${course.price.toFixed(2)}</TableCell>
                                                    <TableCell className="font-Urbanist text-black">
                                                        <div className="flex items-center">
                                                            <Clock size={14} className="mr-1 text-gray-500" />
                                                            {course.overallHours}h
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-Urbanist text-black">
                                                        <div className="flex items-center">
                                                            <UserPlus size={14} className="mr-1 text-gray-500" />
                                                            {course.studentsEnrolled || 0}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={
                                                            course.priority === 'high' ? 'bg-red-50 text-red-600 border-red-200' :
                                                                course.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                                    'bg-gray-50 text-gray-600 border-gray-200'
                                                        }>
                                                            {course.priority}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={
                                                            course.deliveryMode === 'online' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                                course.deliveryMode === 'offline' ? 'bg-green-50 text-green-600 border-green-200' :
                                                                    'bg-purple-50 text-purple-600 border-purple-200'
                                                        }>
                                                            {course.deliveryMode}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openEditDialog(course._id)}
                                                                title="Edit course"
                                                                className="text-black hover:text-black hover:bg-gray-100"
                                                            >
                                                                <Edit className="h-4 w-4 mr-1" /> Edit
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => openDeleteDialog(course)}
                                                                title="Delete course"
                                                            >
                                                                <Trash className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center py-12">
                                                    <div className="flex flex-col items-center">
                                                        <Search className="h-10 w-10 text-gray-300 mb-3" />
                                                        <p className="text-gray-500 font-Urbanist text-lg mb-1">No courses found</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-center py-6 border-t bg-white">
                            {paginations.totalPages > 1 && (
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handlePageChange(paginations.currentPage - 1)}
                                                disabled={!paginations.hasPreviousPage}
                                                className={!paginations.hasPreviousPage ? "opacity-50 cursor-not-allowed text-gray-400" : "text-black"}
                                            >
                                                <ChevronRight className="h-4 w-4 mr-1 rotate-180" /> Previous
                                            </Button>
                                        </PaginationItem>

                                        {Array.from({ length: paginations.totalPages }, (_, i) => i + 1).map((page) => (
                                            <PaginationItem key={page}>
                                                <Button
                                                    variant={paginations.currentPage === page ? "default" : "ghost"}
                                                    onClick={() => handlePageChange(page)}
                                                    className={paginations.currentPage === page ? "bg-black text-white" : "text-black"}
                                                >
                                                    {page}
                                                </Button>
                                            </PaginationItem>
                                        ))}

                                        <PaginationItem>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handlePageChange(paginations.currentPage + 1)}
                                                disabled={!paginations.hasNextPage}
                                                className={!paginations.hasNextPage ? "opacity-50 cursor-not-allowed text-gray-400" : "text-black"}
                                            >
                                                Next <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            )}
                        </CardFooter>
                    </Card>
                </>
            )}

            {/* Edit Course Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-4xl lg:min-w-4xl max-h-[90vh] overflow-y-auto p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-white z-10">
                        <DialogTitle className="text-2xl font-Urbanist text-black">Edit Course</DialogTitle>
                        <DialogDescription className="font-Urbanist text-gray-600">
                            Update the details for {currentCourse?.title}
                        </DialogDescription>

                        {/* Navigation Tabs */}
                        <div className="flex flex-wrap gap-1 mt-4 overflow-x-auto no-scrollbar">
                            {formTabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 px-4 py-3 text-sm font-Urbanist transition-all rounded-t-lg
                                        ${activeTab === tab.id
                                            ? 'text-black font-medium border-b-2 border-black bg-gray-50'
                                            : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
                                >
                                    <div className="mr-2">{tab.icon}</div>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="px-6 py-4">
                        {/* Basic Information Tab */}
                        {activeTab === 'basic' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="title" className="text-black font-Urbanist font-medium flex items-center">
                                            Course Title <span className="text-red-500 ml-1">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            className="border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 font-Urbanist">A clear, compelling title helps attract students</p>
                                    </div>

                                    {/* Course Image Upload Section */}
                                    <div className="space-y-3 col-span-2">
                                        <Label className="text-black font-Urbanist font-medium flex items-center">
                                            <ImageIcon className="h-4 w-4 mr-1" />
                                            Course Image {!formData.imageUrl && <span className="text-amber-500 ml-1 text-sm">(Recommended)</span>}
                                        </Label>

                                        {formData.imageUrl || previewImage ? (
                                            <div className="mt-3 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                                <div className="relative">
                                                    <div className="bg-white p-2 h-48 flex items-center justify-center overflow-hidden">
                                                        <img
                                                            src={previewImage || formData.imageUrl}
                                                            alt="Course Preview"
                                                            className="w-full h-64 md:h-80 lg:h-96 object-cover rounded-lg"
                                                            onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/1200x630?text=Image+Not+Found"; }}
                                                        />
                                                    </div>
                                                    <div className="absolute top-2 right-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleRemoveImage}
                                                            className="bg-white/90 text-red-500 hover:text-red-700 hover:bg-white rounded-full h-8 w-8 p-0 flex items-center justify-center shadow-sm"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="p-3 bg-white border-t border-gray-100">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <ImageIcon className="h-4 w-4 text-gray-500" />
                                                            <p className="text-sm font-Urbanist text-gray-700 truncate">
                                                                {previewImage ? "New Image Preview" : "Current Course Image"}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleRemoveImage}
                                                            className="h-8 text-xs bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                                        >
                                                            Replace
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <FileUploadInput
                                                    id="courseImageUpload"
                                                    onChange={handleFileUpload}
                                                    isUploading={uploadingImage}
                                                    label="Upload Course Image"
                                                />
                                                {/* Message when no image is present */}
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                                                    <div className="flex items-start">
                                                        <Info className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                                                        <p className="text-sm text-amber-700 font-Urbanist">
                                                            Adding a course image helps attract students. Recommended size: 1200×630px.
                                                        </p>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* Optional direct image URL input */}
                                        {!formData.imageUrl && !previewImage && (
                                            <div className="space-y-2 mt-3">
                                                <Label htmlFor="imageUrl" className="text-sm font-medium text-gray-700">
                                                    Or enter image URL directly:
                                                </Label>
                                                <Input
                                                    type="url"
                                                    id="imageUrl"
                                                    name="imageUrl"
                                                    value={formData.imageUrl || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="https://example.com/image.jpg"
                                                    className="py-2 text-base border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="moduleLeader" className="text-black font-Urbanist font-medium">
                                            Module Leader <span className="text-red-500 ml-1">*</span>
                                        </Label>
                                        <Input
                                            id="moduleLeader"
                                            name="moduleLeader"
                                            value={formData.moduleLeader}
                                            onChange={handleInputChange}
                                            className="border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category" className="text-black font-Urbanist font-medium">
                                            Category <span className="text-red-500 ml-1">*</span>
                                        </Label>
                                        <Input
                                            id="category"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="priority" className="text-black font-Urbanist font-medium">
                                            Priority
                                        </Label>
                                        <select
                                            id="priority"
                                            name="priority"
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                            className="w-full border border-gray-300 focus:border-black focus:ring-black rounded-lg text-black p-2"
                                        >
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="deliveryMode" className="text-black font-Urbanist font-medium">
                                            Delivery Mode
                                        </Label>
                                        <select
                                            id="deliveryMode"
                                            name="deliveryMode"
                                            value={formData.deliveryMode}
                                            onChange={(e) => setFormData({ ...formData, deliveryMode: e.target.value as any })}
                                            className="w-full border border-gray-300 focus:border-black focus:ring-black rounded-lg text-black p-2"
                                        >
                                            <option value="online">Online</option>
                                            <option value="offline">Offline</option>
                                            <option value="hybrid">Hybrid</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="teachersCount" className="text-black font-Urbanist font-medium">
                                            Number of Teachers
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="teachersCount"
                                                name="teachersCount"
                                                type="number"
                                                min="1"
                                                value={formData.teachersCount}
                                                onChange={handleInputChange}
                                                className="pl-10 border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                                required
                                            />
                                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                <Users size={18} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="overallHours" className="text-black font-Urbanist font-medium">
                                            Total Hours
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="overallHours"
                                                name="overallHours"
                                                type="number"
                                                min="0"
                                                value={formData.overallHours}
                                                onChange={handleInputChange}
                                                className="pl-10 border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                                required
                                            />
                                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                <Clock size={18} />
                                            </div>
                                        </div>
                                    </div>

                                    {formData.deliveryMode !== 'offline' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="onlinePrice" className="text-black font-Urbanist font-medium">
                                                Online Price ($)
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="onlinePrice"
                                                    name="onlinePrice"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={formData.onlinePrice || 0}
                                                    onChange={handleInputChange}
                                                    className="pl-10 border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                                />
                                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                    <DollarSign size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {formData.deliveryMode !== 'online' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="offlinePrice" className="text-black font-Urbanist font-medium">
                                                Offline Price ($)
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="offlinePrice"
                                                    name="offlinePrice"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={formData.offlinePrice || 0}
                                                    onChange={handleInputChange}
                                                    className="pl-10 border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                                />
                                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                    <DollarSign size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    )}


                                </div>
                            </div>
                        )}

                        {/* Content Tab (Description & Highlights) */}
                        {activeTab === 'content' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="space-y-4">
                                    <div className="border-b pb-2 mb-6">
                                        <h2 className="text-xl font-Urbanist text-black mb-1">Description</h2>
                                        <p className="text-sm font-Urbanist text-gray-600">What students will learn from this course</p>
                                    </div>

                                    <div className="space-y-4">
                                        {formData.description.map((item, index) => (
                                            <div key={index} className="flex gap-2 group relative">
                                                <div className="flex-grow">
                                                    <Textarea
                                                        value={item}
                                                        onChange={(e) => handleArrayChange('description', index, e.target.value)}
                                                        placeholder={`Description point ${index + 1} - What will students learn?`}
                                                        className="border-gray-300 focus:border-black focus:ring-black rounded-lg min-h-[120px] text-black font-Urbanist"
                                                    />
                                                </div>
                                                {index > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeArrayItem('description', index)}
                                                        className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500 bg-white rounded-full shadow-md h-8 w-8"
                                                    >
                                                        <X size={16} />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => addArrayItem('description')}
                                            className="mt-2 font-Urbanist border-dashed border-gray-300 text-black hover:bg-gray-50 transition-all group"
                                        >
                                            <Plus size={16} className="mr-2 group-hover:scale-125 transition-transform" /> Add Description Point
                                        </Button>
                                    </div>

                                    <div className="border-b pb-2 mt-8 mb-6">
                                        <h2 className="text-xl font-Urbanist text-black mb-1">Course Highlights</h2>
                                        <p className="text-sm font-Urbanist text-gray-600">Key selling points that make your course special</p>
                                    </div>

                                    <div className="space-y-4">
                                        {formData.courseHighlights.map((item, index) => (
                                            <div key={index} className="flex gap-2 group items-center relative">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-black font-medium">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-grow">
                                                    <Input
                                                        value={item}
                                                        onChange={(e) => handleArrayChange('courseHighlights', index, e.target.value)}
                                                        placeholder={`Highlight ${index + 1} - e.g., "24/7 Support" or "Industry Recognition"`}
                                                        className="border-gray-300 focus:border-black focus:ring-black rounded-lg text-black font-Urbanist"
                                                    />
                                                </div>
                                                {index > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeArrayItem('courseHighlights', index)}
                                                        className="absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
                                                    >
                                                        <X size={16} />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => addArrayItem('courseHighlights')}
                                            className="font-Urbanist mt-4 border-dashed border-gray-300 text-black hover:bg-gray-50 transition-all group"
                                        >
                                            <Plus size={16} className="mr-2 group-hover:scale-125 transition-transform" /> Add Highlight
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Learning Formats Tab */}
                        {activeTab === 'formats' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="border-b pb-2 mb-6">
                                    <h2 className="text-xl font-Urbanist text-black mb-1">Learning Formats</h2>
                                    <p className="text-sm font-Urbanist text-gray-600">How students will engage with your content</p>
                                </div>

                                <div className="space-y-6">
                                    {formData.learningFormat.map((format, index) => (
                                        <div
                                            key={index}
                                            className="p-6 border border-gray-200 rounded-xl bg-white hover:shadow-md transition-all duration-300 group relative"
                                        >
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-Urbanist text-lg text-black">Format {index + 1}</h3>
                                                {index > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeLearningFormat(index)}
                                                        className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-red-500 hover:bg-red-50 rounded-full shadow-md h-8 w-8 p-0"
                                                    >
                                                        <X size={16} />
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-black font-Urbanist">Format Name</Label>
                                                    <Input
                                                        value={format.name}
                                                        onChange={(e) => handleLearningFormatChange(index, 'name', e.target.value)}
                                                        placeholder="e.g., Video Lectures, Live Workshops"
                                                        className="border-gray-300 focus:border-black focus:ring-black rounded-lg text-black font-Urbanist"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-black font-Urbanist">Format Description</Label>
                                                    <Input
                                                        value={format.description}
                                                        onChange={(e) => handleLearningFormatChange(index, 'description', e.target.value)}
                                                        placeholder="Brief description of this learning format"
                                                        className="border-gray-300 focus:border-black focus:ring-black rounded-lg text-black font-Urbanist"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addLearningFormat}
                                        className="mt-2 font-Urbanist border-dashed border-gray-300 text-black hover:bg-gray-50 transition-all w-full py-6 group"
                                    >
                                        <Plus size={18} className="mr-2 group-hover:scale-125 transition-transform" /> Add Learning Format
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Curriculum Tab */}
                        {activeTab === 'curriculum' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="border-b pb-2 mb-6">
                                    <h2 className="text-xl font-Urbanist text-black mb-1">Course Curriculum</h2>
                                    <p className="text-sm font-Urbanist text-gray-600">Structure your course content</p>
                                </div>

                                <div className="space-y-6">
                                    {formData.curriculum.map((item, index) => (
                                        <div
                                            key={index}
                                            className="p-6 border border-gray-200 rounded-xl bg-white hover:shadow-md transition-all duration-300 group relative"
                                        >
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0 text-white font-medium">
                                                        {index + 1}
                                                    </div>
                                                    <h3 className="font-Urbanist text-lg text-black ml-3">Module {index + 1}</h3>
                                                </div>
                                                {index > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeCurriculumItem(index)}
                                                        className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-red-500 hover:bg-red-50 rounded-full shadow-md h-8 w-8 p-0"
                                                    >
                                                        <X size={16} />
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-black font-Urbanist">Module Title</Label>
                                                    <Input
                                                        value={item.title}
                                                        onChange={(e) => handleCurriculumChange(index, 'title', e.target.value)}
                                                        placeholder="e.g., Introduction to JavaScript Fundamentals"
                                                        className="border-gray-300 focus:border-black focus:ring-black rounded-lg text-black font-Urbanist"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-black font-Urbanist">Duration (hours)</Label>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={item.duration}
                                                            onChange={(e) => handleCurriculumChange(index, 'duration', e.target.value)}
                                                            placeholder="Duration in hours"
                                                            className="pl-10 border-gray-300 focus:border-black focus:ring-black rounded-lg text-black font-Urbanist"
                                                        />
                                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                            <Clock size={18} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <Label className="text-black font-Urbanist">Module Description</Label>
                                                    <Textarea
                                                        value={item.description}
                                                        onChange={(e) => handleCurriculumChange(index, 'description', e.target.value as string)}
                                                        placeholder="Describe what students will learn in this module"
                                                        className="border-gray-300 focus:border-black focus:ring-black rounded-lg min-h-[80px] text-black font-Urbanist"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addCurriculumItem}
                                        className="mt-2 font-Urbanist border-dashed border-gray-300 text-black hover:bg-gray-50 transition-all w-full py-6 group"
                                    >
                                        <Plus size={18} className="mr-2 group-hover:scale-125 transition-transform" /> Add Curriculum Module
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'schedule' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="border-b pb-2 mb-6">
                                    <h2 className="text-xl font-Urbanist text-black mb-1">Course Schedule</h2>
                                    <p className="text-sm font-Urbanist text-gray-600">
                                        "Set the schedule for courses"
                                    </p>
                                </div>


                                <div className="space-y-4">
                                    {scheduleItems.map((item, index) => (
                                        <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white group relative">
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-black font-Urbanist">Platform</Label>
                                                    <select
                                                        value={item.medium}
                                                        onChange={(e) => handleScheduleChange(index, 'medium', e.target.value)}
                                                        className="w-full p-1.5 border border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                                    >
                                                        {formData.deliveryMode === 'online' && <option key='online' value='online'>Online</option>}
                                                        {formData.deliveryMode === 'offline' && <option key='offline' value='offline'>Offline</option>}
                                                        {formData.deliveryMode === 'hybrid' && <> <option key='online' value='online'>Online</option>
                                                            <option key='offline' value='offline'>Offline</option>
                                                            <option key='both' value='both'>Online and Offline Both</option></>}

                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-black font-Urbanist">Day</Label>
                                                    <select
                                                        value={item.day}
                                                        onChange={(e) => handleScheduleChange(index, 'day', e.target.value)}
                                                        className="w-full p-1.5 border border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                                    >
                                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                                            <option key={day} value={day}>{day}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-black font-Urbanist">Start Time</Label>
                                                    <Input
                                                        type="time"
                                                        value={item.startTime}
                                                        onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                                                        className="border-gray-300 focus:border-black focus:ring-black rounded-lg"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-black font-Urbanist">End Time</Label>
                                                    <Input
                                                        type="time"
                                                        value={item.endTime}
                                                        onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                                                        className="border-gray-300 focus:border-black focus:ring-black rounded-lg"
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeScheduleItem(index)}
                                                className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500 bg-white rounded-full shadow-md h-8 w-8 p-0"
                                            >
                                                <X size={16} />
                                            </Button>
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addScheduleItem}
                                        className="font-Urbanist border-dashed border-gray-300 text-black hover:bg-gray-50 transition-all group"
                                    >
                                        <Plus size={16} className="mr-2 group-hover:scale-125 transition-transform" /> Add Schedule
                                    </Button>
                                </div>

                            </div>
                        )}

                        <DialogFooter className="pt-6 border-t mt-6 sticky bottom-0 bg-white pb-2">
                            <div className="flex gap-3 w-full justify-between md:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditDialogOpen(false)}
                                    className="border-gray-300 text-black hover:bg-gray-50 font-Urbanist"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={saveLoading}
                                    className="bg-black hover:bg-gray-800 text-white flex items-center font-Urbanist"
                                >
                                    {saveLoading ? (
                                        <>Saving<span className="loading-dots ml-2"></span></>
                                    ) : (
                                        <>
                                            <Save size={16} className="mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-Urbanist text-black">Delete Course</DialogTitle>
                        <DialogDescription className="font-Urbanist text-gray-600 mt-2">
                            Are you sure you want to delete this course? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 my-4">
                        <div className="flex items-start gap-3">
                            {currentCourse?.imageUrl ? (
                                <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                                    <img
                                        src={currentCourse.imageUrl}
                                        alt={currentCourse.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 text-black">
                                    {currentCourse?.title?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h3 className="font-Urbanist text-black font-medium mb-1">{currentCourse?.title}</h3>
                                <div className="flex flex-wrap gap-2 text-sm font-Urbanist">
                                    <Badge variant="outline" className="bg-white">{currentCourse?.category}</Badge>
                                    <div className="text-gray-500">
                                        <span className="inline-flex items-center"><Clock size={14} className="mr-1" /> {currentCourse?.overallHours}h</span>
                                    </div>
                                    <div className="text-gray-500">
                                        <span className="inline-flex items-center"><DollarSign size={14} className="mr-1" /> ${currentCourse?.price}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="border-gray-300 text-black hover:bg-gray-50 flex-1 md:flex-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteLoading}
                            className="bg-red-600 hover:bg-red-700 flex-1 md:flex-none"
                        >
                            {deleteLoading ? (
                                <>Deleting<span className="loading-dots ml-2"></span></>
                            ) : (
                                <>
                                    <Trash size={16} className="mr-2" />
                                    Delete Course
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Custom Styling */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out forwards;
                }
                
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                
                @keyframes dots {
                    0%, 20% { content: '.'; }
                    40% { content: '..'; }
                    60%, 100% { content: '...'; }
                }
                
                .loading-dots::after {
                    content: '.';
                    animation: dots 1.5s linear infinite;
                }
            `}</style>

            <Toaster />
        </div>
    );
}