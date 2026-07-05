'use client';

import React, { ChangeEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { deleteUploadedFile } from '../../../../apiCalls/fileUpload';
import { Textarea } from '@/components/ui/textarea';
import {
    Plus, Info, X, Book, Users, Clock,
    Layout, ListChecks,
    Check, ChevronLeft, ChevronRight, Save,
    Upload, Loader, Image as ImageIcon,
    Coins, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createCourse } from '../../../../apiCalls/addCourse';
import { Toaster } from 'react-hot-toast';
import { uploadFile } from '../../../../apiCalls/fileUpload';
import Image from 'next/image';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
    curriculum: CurriculumItem[];
    featuredImage: string;
    priority: 'high' | 'medium' | 'low';
    deliveryMode: 'online' | 'offline' | 'hybrid';
    onlinePrice?: number;
    offlinePrice?: number;
    schedule: ScheduleItem[];
}

interface NavigationTab {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface FileUploadInputProps {
    id: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    isUploading: boolean;
    accept?: string;
    label?: string;
}

export default function AddCourseForm() {
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState('basic');
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
        curriculum: [{ title: '', duration: 0, description: '' }],
        featuredImage: '',
        priority: 'medium',
        deliveryMode: 'online',
        onlinePrice: 0,
        offlinePrice: 0,
        schedule: [{ day: 'Monday', medium: 'both', startTime: '09:00', endTime: '17:00' }]
    });

    const [featuredImageUrl, setFeaturedImageUrl] = useState("");
    const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false);

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'teachersCount' || name === 'overallHours' || name === 'price' ||
                name === 'onlinePrice' || name === 'offlinePrice'
                ? Number(value)
                : value
        });
    };

    const handleRemoveFeaturedImage = async () => {
        if (!featuredImageUrl) return;

        try {
            // Delete the file from AWS S3 first
            await deleteUploadedFile(featuredImageUrl);

            // Then update the state
            setFeaturedImageUrl("");
            setFormData(prev => ({ ...prev, featuredImage: "" }));

            toast.success("Featured image removed successfully");
        } catch (error) {
            console.error("Error removing featured image:", error);
            toast.error("Failed to remove featured image. Please try again.");
        }
    };

    const handleSelectChange = (name: keyof FormData, value: string) => {
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleArrayChange = (field: keyof FormData, index: number, value: string) => {
        const newArray = [...formData[field] as string[]];
        newArray[index] = value;
        setFormData({ ...formData, [field]: newArray });
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

    const handleLearningFormatChange = (index: number, field: keyof LearningFormat, value: string) => {
        const newFormats = [...formData.learningFormat];
        newFormats[index] = { ...newFormats[index], [field]: value };
        setFormData({ ...formData, learningFormat: newFormats });
    };

    const handleCurriculumChange = (index: number, field: keyof CurriculumItem, value: string) => {
        const newCurriculum = [...formData.curriculum];
        newCurriculum[index] = {
            ...newCurriculum[index],
            [field]: field === 'duration' ? Number(value) : value
        };
        setFormData({ ...formData, curriculum: newCurriculum });
    };

    const handleScheduleChange = (index: number, field: keyof ScheduleItem, value: string) => {
        const newSchedule = [...formData.schedule];
        newSchedule[index] = {
            ...newSchedule[index],
            [field]: value
        };
        setFormData({ ...formData, schedule: newSchedule });
    };

    const addLearningFormat = () => {
        setFormData({
            ...formData,
            learningFormat: [...formData.learningFormat, { name: '', description: '' }]
        });
    };

    const addCurriculumItem = () => {
        setFormData({
            ...formData,
            curriculum: [...formData.curriculum, { title: '', duration: 0, description: '' }]
        });
    };

    const addScheduleItem = () => {
        setFormData({
            ...formData,
            schedule: [...formData.schedule, { day: 'Monday', medium: 'both', startTime: '09:00', endTime: '17:00' }]
        });
    };

    const removeLearningFormat = (index: number) => {
        const newFormats = [...formData.learningFormat];
        newFormats.splice(index, 1);
        setFormData({ ...formData, learningFormat: newFormats });
    };

    const removeCurriculumItem = (index: number) => {
        const newCurriculum = [...formData.curriculum];
        newCurriculum.splice(index, 1);
        setFormData({ ...formData, curriculum: newCurriculum });
    };

    const removeScheduleItem = (index: number) => {
        const newSchedule = [...formData.schedule];
        newSchedule.splice(index, 1);
        setFormData({ ...formData, schedule: newSchedule });
    };

    const FileUploadInput: React.FC<FileUploadInputProps> = ({
        id,
        onChange,
        isUploading,
        accept = 'image/png, image/jpeg',
        label = 'Choose File',
    }) => (
        <div className="w-full">
            {isUploading ? (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-blue-700">
                        <Loader className="h-5 w-5 animate-spin" />
                        <span className="font-Urbanist">Uploading...</span>
                    </div>
                </div>
            ) : (
                <Label htmlFor={id} className="cursor-pointer block w-full">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors flex flex-col items-center justify-center h-40">
                        <div className="flex flex-col items-center gap-2 text-gray-700 mb-2">
                            <div className="bg-gray-100 h-10 w-10 rounded-full flex items-center justify-center">
                                <Upload className="h-5 w-5 text-gray-600" />
                            </div>
                            <span className="font-Urbanist text-center">{label}</span>
                            <p className="text-xs text-gray-500 font-Urbanist text-center mt-1 max-w-xs">
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

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error(`File size exceeds 5MB limit`);
            return;
        }

        try {
            setUploadingFeaturedImage(true);

            console.log(`Uploading file:`, file.name);

            const result = await uploadFile(file);
            console.log("Upload result:", result);

            if (result.success) {
                setFeaturedImageUrl(result.data.url);
                setFormData(prev => ({
                    ...prev,
                    featuredImage: result.data.url
                }));
                toast.success('Featured image uploaded successfully!');
            } else {
                toast.error(result.message || 'Failed to upload file');
            }
        } catch (error) {
            console.error("Error in file upload:", error);
            toast.error('Failed to upload file: ' + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setUploadingFeaturedImage(false);
            e.target.value = '';
        }
    };

    const validateForm = () => {
        if (activeSection === 'basic' &&
            (!formData.title.trim() || !formData.moduleLeader.trim() || !formData.category.trim())) {
            toast.error("Please fill all required fields in Basic Information");
            return false;
        }

        if (activeSection === 'schedule' && formData.schedule.length === 0) {
            toast.error("Please add at least one schedule entry");
            return false;
        }

        return true;
    };

    const navigationTabs: NavigationTab[] = [
        { id: 'basic', label: 'Basic Info', icon: <Book size={20} /> },
        { id: 'description', label: 'Description', icon: <Layout size={20} /> },
        { id: 'highlights', label: 'Highlights', icon: <ListChecks size={20} /> },
        { id: 'formats', label: 'Learning Formats', icon: <Users size={20} /> },
        { id: 'curriculum', label: 'Curriculum', icon: <Clock size={20} /> },
        { id: 'schedule', label: 'Schedule & Pricing', icon: <Clock size={20} /> },
    ];

    const goToNextSection = (e?: React.MouseEvent) => {
        // Prevent default form submission if event is provided
        if (e) {
            e.preventDefault();
        }

        if (!validateForm()) return;

        const currentIndex = navigationTabs.findIndex(tab => tab.id === activeSection);
        if (currentIndex < navigationTabs.length - 1) {
            setActiveSection(navigationTabs[currentIndex + 1].id);
            window.scrollTo(0, 0);
        }
    };

    const goToPreviousSection = () => {
        const currentIndex = navigationTabs.findIndex(tab => tab.id === activeSection);
        if (currentIndex > 0) {
            setActiveSection(navigationTabs[currentIndex - 1].id);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            const payload = {
                ...formData,
                description: formData.description.filter(item => item.trim() !== ''),
                courseHighlights: formData.courseHighlights.filter(item => item.trim() !== ''),
                learningFormat: formData.learningFormat.filter(item => item.name.trim() !== ''),
                curriculum: formData.curriculum.filter(item => item.title.trim() !== ''),
                image: featuredImageUrl || formData.featuredImage,
                price: formData.deliveryMode === 'online' ? formData.onlinePrice :
                    formData.deliveryMode === 'offline' ? formData.offlinePrice :
                        Math.max(formData.onlinePrice || 0, formData.offlinePrice || 0),
                offlinePrice: formData.offlinePrice || 0,
                onlinePrice: formData.onlinePrice || 0
            };

            await createCourse(payload);
            toast.success("Course created successfully!");

            // Reset form
            setFormData({
                title: '',
                description: [''],
                teachersCount: 1,
                courseHighlights: [''],
                overallHours: 0,
                moduleLeader: '',
                category: '',
                learningFormat: [{ name: '', description: '' }],
                price: 0,
                curriculum: [{ title: '', duration: 0, description: '' }],
                featuredImage: '',
                priority: 'medium',
                deliveryMode: 'online',
                onlinePrice: 0,
                offlinePrice: 0,
                schedule: [{ day: 'Monday', medium: 'both', startTime: '09:00', endTime: '17:00' }]
            });
            setFeaturedImageUrl("");
            setActiveSection('basic');
        } catch (error) {
            console.error('Error creating course:', error);
            toast.error("Failed to create course. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const progress = ((navigationTabs.findIndex(tab => tab.id === activeSection) + 1) / navigationTabs.length) * 100;

    return (
        <div className="w-full  mx-auto py-8 px-10 bg-white">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-Urbanist font-bold text-black mb-2">Course Creator</h1>
                <p className="text-gray-700 font-Urbanist">Design and publish professional learning experiences for your students</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between mb-2">
                    <span className="text-sm font-Urbanist font-medium text-black">Progress</span>
                    <span className="text-sm font-Urbanist font-medium text-black">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-black h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <Card className="border shadow-lg rounded-xl overflow-hidden bg-white">
                <CardHeader className="border-b bg-white pb-4">
                    <CardTitle className="text-2xl font-Urbanist text-black">Create New Course</CardTitle>
                    <CardDescription className="text-gray-700 mb-6 font-Urbanist">
                        Fill in the details below to create a new course
                    </CardDescription>

                    {/* Navigation Tabs */}
                    <div className="flex flex-wrap gap-1 mt-2 border-b overflow-x-auto no-scrollbar pb-1">
                        {navigationTabs.map((tab, index) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id)}
                                className={`flex items-center space-x-2 px-4 py-3 text-sm font-Urbanist transition-all rounded-t-lg whitespace-nowrap
                                ${activeSection === tab.id
                                        ? 'text-black font-medium border-b-2 border-black bg-gray-50'
                                        : index < navigationTabs.findIndex(t => t.id === activeSection)
                                            ? 'text-black bg-gray-50 opacity-90'
                                            : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 mr-2">
                                    {index < navigationTabs.findIndex(t => t.id === activeSection)
                                        ? <Check size={14} className="text-green-600" />
                                        : tab.icon
                                    }
                                </div>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </CardHeader>

                <CardContent className="pt-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Basic Information Section */}
                        {activeSection === 'basic' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="border-b pb-2 mb-6">
                                    <h2 className="text-xl font-Urbanist text-black mb-1">Basic Information</h2>
                                    <p className="text-sm font-Urbanist text-gray-600">Essential details about your course</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2 col-span-2">
                                        <Label htmlFor="title" className="text-black font-Urbanist font-medium flex items-center">
                                            Course Title <span className="text-red-500 ml-1">*</span>
                                            <div className="ml-2 cursor-help group relative">
                                                <Info size={14} className="text-gray-400" />
                                                <div className="absolute left-6 top-0 w-64 p-2 bg-black text-white text-xs font-Urbanist rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                                    Make it clear and compelling for better student engagement
                                                </div>
                                            </div>
                                        </Label>
                                        <Input
                                            id="title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            className="border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                            placeholder="e.g., Advanced JavaScript Masterclass"
                                            required
                                        />
                                    </div>

                                    {/* Featured Image Upload Section */}
                                    <div className="space-y-3 col-span-2">
                                        <Label className="text-black font-Urbanist font-medium flex items-center">
                                            Featured Image <span className="text-red-500 ml-1">*</span>
                                        </Label>

                                        {featuredImageUrl ? (
                                            <div className="mt-3 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                                <div className="relative">
                                                    <div className="bg-white p-2 h-48 flex items-center justify-center overflow-hidden">
                                                        <img
                                                            src={featuredImageUrl}
                                                            alt="Featured Preview"
                                                            className="w-full h-64 md:h-80 lg:h-96 object-cover rounded-lg"
                                                            onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/1200x630?text=Image+Not+Found"; }}
                                                        />
                                                    </div>
                                                    <div className="absolute top-2 right-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={handleRemoveFeaturedImage}
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
                                                                {featuredImageUrl.split('/').pop()}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleRemoveFeaturedImage}
                                                            className="h-8 text-xs bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <FileUploadInput
                                                id="featuredImage"
                                                onChange={handleFileUpload}
                                                isUploading={uploadingFeaturedImage}
                                                accept="image/*"
                                                label="Upload Course Image"
                                            />
                                        )}

                                        <p className="text-sm font-Urbanist text-gray-500 mt-1">Upload an eye-catching image that represents your course (recommended: 1200x630px)</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="moduleLeader" className="text-black font-medium flex items-center">
                                            Module Leader <span className="text-red-500 ml-1">*</span>
                                        </Label>
                                        <Input
                                            id="moduleLeader"
                                            name="moduleLeader"
                                            value={formData.moduleLeader}
                                            onChange={handleInputChange}
                                            className="border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                            placeholder="Lead instructor's full name"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category" className="text-black font-medium flex items-center">
                                            Category <span className="text-red-500 ml-1">*</span>
                                        </Label>
                                        <Input
                                            id="category"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                            placeholder="e.g., Programming, Business, Design"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="priority" className="text-black font-medium block">
                                            Priority Level
                                        </label>
                                        <div className="relative">
                                            <select
                                                id="priority"
                                                value={formData.priority}
                                                onChange={(e) => handleSelectChange('priority', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:border-black focus:ring-black appearance-none bg-white"
                                            >
                                                <option value="">Select priority</option>
                                                <option value="high" className="text-red-600">High Priority</option>
                                                <option value="medium" className="text-yellow-600">Medium Priority</option>
                                                <option value="low" className="text-green-600">Low Priority</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="deliveryMode" className="text-black font-medium block">
                                            Delivery Mode
                                        </label>
                                        <div className="relative">
                                            <select
                                                id="deliveryMode"
                                                value={formData.deliveryMode}
                                                onChange={(e) => handleSelectChange('deliveryMode', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black focus:border-black focus:ring-black appearance-none bg-white"
                                            >
                                                <option value="">Select delivery mode</option>
                                                <option value="online">Online Only</option>
                                                <option value="offline">Offline Only</option>
                                                <option value="hybrid">Hybrid (Online + Offline)</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="teachersCount" className="text-black font-medium">
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
                                        <Label htmlFor="overallHours" className="text-black font-medium">
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
                                </div>
                            </div>
                        )}

                        {/* Description Section */}
                        {activeSection === 'description' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="border-b pb-2 mb-6">
                                    <h2 className="text-xl font-Urbanist text-black mb-1">Course Description</h2>
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
                                                    className="border-gray-300 focus:border-black focus:ring-black rounded-lg min-h-[120px] text-black"
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
                                        className="mt-2 border-dashed border-gray-300 text-black hover:bg-gray-50 transition-all group"
                                    >
                                        <Plus size={16} className="mr-2 group-hover:scale-125 transition-transform" /> Add Description Point
                                    </Button>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
                                    <h3 className="text-sm font-Urbanist font-medium text-black mb-2 flex items-center">
                                        <Info size={16} className="mr-2 text-gray-500" /> Tips for great course descriptions
                                    </h3>
                                    <ul className="text-sm font-Urbanist text-gray-600 space-y-1 list-disc pl-5">
                                        <li>Focus on outcomes and what students will be able to accomplish</li>
                                        <li>Include specific skills they will develop</li>
                                        <li>Mention target audience and prerequisites</li>
                                        <li>Keep each point clear and concise</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Course Highlights */}
                        {activeSection === 'highlights' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="border-b pb-2 mb-6">
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
                                                    className="border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
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
                                        className="mt-4 border-dashed border-gray-300 text-black hover:bg-gray-50 transition-all group"
                                    >
                                        <Plus size={16} className="mr-2 group-hover:scale-125 transition-transform" /> Add Highlight
                                    </Button>

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
                                        <h3 className="text-sm font-Urbanist font-medium text-black mb-2">Highlight Examples</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-Urbanist text-gray-600">
                                            <div className="flex items-center">
                                                <Check size={14} className="mr-2 text-green-500" /> Certificate of Completion
                                            </div>
                                            <div className="flex items-center">
                                                <Check size={14} className="mr-2 text-green-500" /> 1-on-1 Mentoring
                                            </div>
                                            <div className="flex items-center">
                                                <Check size={14} className="mr-2 text-green-500" /> Real-world Projects
                                            </div>
                                            <div className="flex items-center">
                                                <Check size={14} className="mr-2 text-green-500" /> Lifetime Access
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Learning Formats */}
                        {activeSection === 'formats' && (
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
                                                        className="border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-black font-Urbanist">Format Description</Label>
                                                    <Input
                                                        value={format.description}
                                                        onChange={(e) => handleLearningFormatChange(index, 'description', e.target.value)}
                                                        placeholder="Brief description of this learning format"
                                                        className="border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addLearningFormat}
                                        className="mt-2 border-dashed border-gray-300 text-black hover:bg-gray-50 transition-all w-full py-6 group"
                                    >
                                        <Plus size={18} className="mr-2 group-hover:scale-125 transition-transform" /> Add Learning Format
                                    </Button>

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <h3 className="text-sm font-Urbanist font-medium text-black mb-2">Common Learning Formats</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-sm font-Urbanist">
                                            <div>
                                                <p className="font-medium text-black">Video Lectures</p>
                                                <p className="text-gray-600">Pre-recorded lessons students can watch anytime</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-black">Live Workshops</p>
                                                <p className="text-gray-600">Real-time interactive sessions</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-black">Practical Assignments</p>
                                                <p className="text-gray-600">Hands-on projects to apply knowledge</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-black">Group Discussions</p>
                                                <p className="text-gray-600">Collaborative learning opportunities</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Curriculum */}
                        {activeSection === 'curriculum' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="border-b pb-2 mb-6">
                                    <h2 className="text-xl text-black mb-1">Course Curriculum</h2>
                                    <p className="text-sm text-gray-600">Structure your course content</p>
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
                                                    <h3 className="font-medium text-lg text-black ml-3">Module {index + 1}</h3>
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
                                                        placeholder="e.g., Introduction to JavaScript"
                                                        className="border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-black font-Urbanist">Duration (hours)</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={item.duration}
                                                        onChange={(e) => handleCurriculumChange(index, 'duration', e.target.value)}
                                                        className="border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-4 space-y-2">
                                                <Label className="text-black font-Urbanist">Module Description</Label>
                                                <Textarea
                                                    value={item.description}
                                                    onChange={(e) => handleCurriculumChange(index, 'description', e.target.value)}
                                                    placeholder="What will students learn in this module?"
                                                    className="border-gray-300 focus:border-black focus:ring-black rounded-lg min-h-[100px] text-black"
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addCurriculumItem}
                                        className="mt-2 border-dashed border-gray-300 text-black hover:bg-gray-50 transition-all w-full py-6 group"
                                    >
                                        <Plus size={18} className="mr-2 group-hover:scale-125 transition-transform" /> Add Curriculum Module
                                    </Button>

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <h3 className="text-sm font-Urbanist font-medium text-black mb-2">Curriculum Structure Tips</h3>
                                        <ul className="text-sm font-Urbanist text-gray-600 space-y-2 list-disc pl-5">
                                            <li>Start with foundational concepts before moving to advanced topics</li>
                                            <li>Balance theory with practical exercises</li>
                                            <li>Group related topics together logically</li>
                                            <li>Estimate accurate time commitments for each module</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Schedule & Pricing Section */}
                        {activeSection === 'schedule' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="border-b pb-2 mb-6">
                                    <h2 className="text-xl font-Urbanist text-black mb-1">Schedule & Pricing</h2>
                                    <p className="text-sm font-Urbanist text-gray-600">Set your course availability and pricing</p>
                                </div>

                                {/* Pricing Section */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-Urbanist font-medium text-black flex items-center">
                                        <Coins className="h-5 w-5 mr-2 text-yellow-500" /> Pricing
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {formData.deliveryMode !== 'offline' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="onlinePrice" className="text-black font-Urbanist">
                                                    Online Price ({formData.deliveryMode === 'hybrid' ? 'Online Portion' : 'Full Course'})
                                                </Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs.</span>
                                                    <Input
                                                        id="onlinePrice"
                                                        name="onlinePrice"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={formData.onlinePrice}
                                                        onChange={handleInputChange}
                                                        className="pl-8 border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {formData.deliveryMode !== 'online' && (
                                            <div className="space-y-2">
                                                <Label htmlFor="offlinePrice" className="text-black font-Urbanist">
                                                    Offline Price ({formData.deliveryMode === 'hybrid' ? 'In-Person Portion' : 'Full Course'})
                                                </Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs.</span>
                                                    <Input
                                                        id="offlinePrice"
                                                        name="offlinePrice"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={formData.offlinePrice}
                                                        onChange={handleInputChange}
                                                        className="pl-8 border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="price" className="text-black font-Urbanist">
                                                {formData.deliveryMode === 'hybrid' ? 'Minimum Price' : 'Final Price'}
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs.</span>
                                                <Input
                                                    id="price"
                                                    name="price"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        formData.deliveryMode === 'online' ? formData.onlinePrice :
                                                            formData.deliveryMode === 'offline' ? formData.offlinePrice :
                                                                Math.min(formData.onlinePrice || 0, formData.offlinePrice || 0)
                                                    }
                                                    onChange={handleInputChange}
                                                    className="pl-8 border-gray-300 focus:border-black focus:ring-black rounded-lg text-black bg-gray-50"
                                                    placeholder="0.00"
                                                    disabled
                                                />
                                            </div>
                                            {formData.deliveryMode === 'hybrid' && (
                                                <p className="text-xs text-gray-500 font-Urbanist mt-1">
                                                    Calculated as the lower of online/offline prices
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <div className="flex items-start">
                                            <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h4 className="text-sm font-Urbanist font-medium text-blue-800 mb-1">Pricing Guidance</h4>
                                                <ul className="text-xs font-Urbanist text-blue-700 space-y-1 list-disc pl-5">
                                                    <li>Consider your target audience and market standards</li>
                                                    <li>For hybrid courses, you can price online and in-person components separately</li>
                                                    <li>Prices can be updated later as needed</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule Section */}
                                <div className="space-y-6 mt-8">
                                    <h3 className="text-lg font-Urbanist font-medium text-black flex items-center">
                                        <Clock className="h-5 w-5 mr-2 text-blue-500" /> Schedule
                                    </h3>

                                    <div className="space-y-4">
                                        {formData.schedule.map((item, index) => (
                                            <div
                                                key={index}
                                                className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-all duration-200 group relative"
                                            >
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className="font-Urbanist font-medium text-black">Session {index + 1}</h4>
                                                    {index > 0 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeScheduleItem(index)}
                                                            className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-red-500 hover:bg-red-50 rounded-full shadow-md h-8 w-8 p-0"
                                                        >
                                                            <X size={16} />
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                                                    <div className="space-y-2">
                                                        <Label className="text-black font-Urbanist">Medium</Label>
                                                        <Select
                                                            value={item.medium}
                                                            onValueChange={(value) => handleScheduleChange(index, 'medium', value)}
                                                        >
                                                            <SelectTrigger className="w-full border-gray-300 focus:border-black focus:ring-black rounded-lg text-black">
                                                                <SelectValue placeholder="Select medium" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {formData.deliveryMode === 'online' && <SelectItem key={'online'} value={'online'}>Online</SelectItem>}
                                                                {formData.deliveryMode === 'offline' && <SelectItem key={'offline'} value={'offline'}>Offline</SelectItem>}
                                                                {formData.deliveryMode === "hybrid" && <><SelectItem key={'online'} value={'online'}>Online</SelectItem>
                                                                    <SelectItem key={'offline'} value={'offline'}>Offline</SelectItem>
                                                                    <SelectItem key={'both'} value={'both'}>Both Online $ Offline</SelectItem></>}


                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-black font-Urbanist">Day</Label>
                                                        <Select
                                                            value={item.day}
                                                            onValueChange={(value) => handleScheduleChange(index, 'day', value)}
                                                        >
                                                            <SelectTrigger className="w-full border-gray-300 focus:border-black focus:ring-black rounded-lg text-black">
                                                                <SelectValue placeholder="Select day" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {daysOfWeek.map(day => (
                                                                    <SelectItem key={day} value={day}>{day}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-black font-Urbanist">Start Time</Label>
                                                        <Input
                                                            type="time"
                                                            value={item.startTime}
                                                            onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                                                            className="border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-black font-Urbanist">End Time</Label>
                                                        <Input
                                                            type="time"
                                                            value={item.endTime}
                                                            onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                                                            className="border-gray-300 focus:border-black focus:ring-black rounded-lg text-black"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={addScheduleItem}
                                            className="mt-2 border-dashed border-gray-300 text-black hover:bg-gray-50 transition-all group"
                                        >
                                            <Plus size={16} className="mr-2 group-hover:scale-125 transition-transform" /> Add Session
                                        </Button>

                                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
                                            <div className="flex items-start">
                                                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <h4 className="text-sm font-Urbanist font-medium text-yellow-800 mb-1">Schedule Notes</h4>
                                                    <ul className="text-xs font-Urbanist text-yellow-700 space-y-1 list-disc pl-5">
                                                        <li>For self-paced courses, you can set a single session with flexible timing</li>
                                                        <li>Ensure session times don't overlap</li>
                                                        <li>Consider time zones if offering live sessions to a global audience</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between pt-6 border-t">
                            {activeSection !== 'basic' ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={goToPreviousSection}
                                    className="flex items-center gap-2 text-black border-gray-300 hover:bg-gray-50"
                                >
                                    <ChevronLeft size={18} /> Previous
                                </Button>
                            ) : (
                                <div></div> // Empty div to maintain space
                            )}

                            {activeSection !== 'schedule' ? (
                                <Button
                                    type="button"  // Add this line
                                    onClick={goToNextSection}
                                    className="flex items-center gap-2 bg-black text-white hover:bg-gray-800"
                                >
                                    Next <ChevronRight size={18} />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 bg-black text-white hover:bg-gray-800"
                                >
                                    {loading ? (
                                        <>
                                            <Loader className="h-4 w-4 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} /> Save Course
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Toaster position="top-center" />
        </div>
    );
}