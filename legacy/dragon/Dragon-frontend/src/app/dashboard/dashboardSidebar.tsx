"use client";

import { useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Menu, X, Home, BookOpen, PenTool, Bell, Megaphone,
    FileText, Calendar, Users,
    GraduationCap, ClipboardList,
    FileQuestion, Briefcase,
    Newspaper, FolderPlus,
    Layers, User,
    ChevronRight, LogOut,
    PlaneIcon, Mail, Bookmark,
    FileStack, BookUp, BookCheck,
    UserPlus, BarChart2, LineChart,
    MessageSquare, CreditCard,
    Settings, HelpCircle, FileSearch
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useDashboard } from "./dashboardContext";

interface UserData {
    role?: string;
    name?: string;
}

const DashboardSidebar = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserData>({});
    const { isDashboardDisabled } = useDashboard();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        try {
            const userData = Cookies.get("user") ? JSON.parse(Cookies.get("user") || "{}") : {};
            setUser(userData);
        } catch (error) {
            console.error("Error parsing user data:", error);
            setUser({});
        }
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsMenuOpen(true);
            } else {
                setIsMenuOpen(false);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (isMenuOpen &&
                window.innerWidth < 1024 &&
                !target.closest('.sidebar') &&
                !target.closest('.menu-toggle')) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const toggleMenu = useCallback(() => {
        setIsMenuOpen(prevState => !prevState);
    }, []);

    const toggleCategory = useCallback((category: string) => {
        setActiveCategory(prevCategory =>
            prevCategory === category ? null : category
        );
    }, []);

    const handleLogout = useCallback(() => {
        Cookies.remove("user");
        Cookies.remove("token");
        router.push("/login");
    }, [router]);

    const isAdmin = user.role === "admin";
    const isTeacher = user.role === "teacher";
    const isStudent = user.role === "user";

    if (!mounted) {
        return null;
    }

    return (
        <>

            <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-100 font-Urbanist">
                {/* Mobile menu toggle */}
                {!isDashboardDisabled &&
                    <>
                        <button
                            onClick={toggleMenu}
                            className={`menu-toggle lg:hidden fixed top-4 left-4 z-40 p-2 rounded-md ${!isMenuOpen ? "bg-[#102c34]" : ""} text-white shadow-lg transition-colors`}
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? null : <Menu size={20} />}
                        </button>

                        {/* Overlay for mobile */}
                        {isMenuOpen && window.innerWidth < 1024 && (
                            <div
                                className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-20 animate-fadeIn"
                                onClick={toggleMenu}
                            />
                        )}
                    </>
                }

                <div className="flex h-full w-full">
                    {/* Sidebar */}
                    {!isDashboardDisabled && <><aside
                        className={`sidebar fixed lg:relative z-30 h-full flex flex-col transform transition-all duration-300 ease-out
                        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                        lg:translate-x-0 w-72 max-w-[85vw]
                        bg-[#102c34] text-white shadow-xl`}
                    >
                        <div className="p-4 border-b border-[#1a3d47] flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <GraduationCap className="h-6 w-6" />
                                <h2 className="text-xl font-bold">Dragon</h2>
                            </div>
                            <button
                                onClick={toggleMenu}
                                className="lg:hidden p-1 rounded-md hover:bg-[#1a3d47] transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* User info */}
                        <div className="p-4 border-b border-[#1a3d47] flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-white text-[#102c34] flex items-center justify-center shadow-md">
                                <span className="font-semibold">{user.role ? user.role.charAt(0).toUpperCase() : "U"}</span>
                            </div>
                            <div>
                                <p className="font-medium">{user.name || "User"}</p>
                                <p className="text-xs text-gray-300 capitalize">{user.role || "Role"}</p>
                            </div>
                        </div>

                        <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-transparent">
                            <div className="px-2">
                                {/* Common navigation for all users */}
                                <div className="mb-3">
                                    <p className="px-3 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                        Main
                                    </p>
                                    <ul className="space-y-1">
                                        <li>
                                            <Link href="/dashboard/introduction" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                >
                                                    <Home size={18} className="mr-2" />
                                                    Introduction
                                                </Button>
                                            </Link>
                                        </li>
                                    </ul>
                                </div>

                                {isTeacher ? (<ul className="mb-4">
                                    <li>
                                        <Link href="/dashboard/manageBatch" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                            >
                                                <Users size={18} className="mr-2" />
                                                Manage Batches
                                            </Button>
                                        </Link>
                                    </li>
                                </ul>) : null}

                                {/* Admin and Teacher Navigation */}
                                {(isAdmin || isTeacher) && (
                                    <>
                                        {/* Question Management - Only for Teachers */}
                                        <div className="mb-3">
                                            <Collapsible
                                                open={activeCategory === 'questions'}
                                                onOpenChange={() => toggleCategory('questions')}
                                            >
                                                <CollapsibleTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-between text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                    >
                                                        <div className="flex items-center">
                                                            <FileQuestion size={18} className="mr-2" />
                                                            <span>Question Bank</span>
                                                        </div>
                                                        <ChevronRight size={16} className={`transition-transform ${activeCategory === 'questions' ? 'rotate-90' : ''}`} />
                                                    </Button>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="pl-6 space-y-1 animate-slideDown">
                                                    <Link href="/dashboard/addquestion" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                        >
                                                            <FileStack size={16} className="mr-2" />
                                                            Add Questions
                                                        </Button>
                                                    </Link>
                                                    <Link href="/dashboard/managequestionsheet" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                        >
                                                            <FileSearch size={16} className="mr-2" />
                                                            Manage Questions
                                                        </Button>
                                                    </Link>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </div>

                                        {/* Exam Management - For both Admin and Teachers */}
                                        <div className="mb-3">
                                            <Collapsible
                                                open={activeCategory === 'exams'}
                                                onOpenChange={() => toggleCategory('exams')}
                                            >
                                                <CollapsibleTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-between text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                    >
                                                        <div className="flex items-center">
                                                            <ClipboardList size={18} className="mr-2" />
                                                            <span>Exam Management</span>
                                                        </div>
                                                        <ChevronRight size={16} className={`transition-transform ${activeCategory === 'exams' ? 'rotate-90' : ''}`} />
                                                    </Button>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="pl-6 space-y-1 animate-slideDown">
                                                    <Link href="/dashboard/scheduleExam" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                        >
                                                            <Calendar size={16} className="mr-2" />
                                                            Schedule Exam
                                                        </Button>
                                                    </Link>
                                                    <Link href="/dashboard/manageExam" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                        >
                                                            <BookCheck size={16} className="mr-2" />
                                                            Manage Exams
                                                        </Button>
                                                    </Link>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </div>

                                        {/* Class Materials - For both Admin and Teachers */}
                                        <div className="mb-3">
                                            <Collapsible
                                                open={activeCategory === 'materials'}
                                                onOpenChange={() => toggleCategory('materials')}
                                            >
                                                <CollapsibleTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-between text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                    >
                                                        <div className="flex items-center">
                                                            <FileText size={18} className="mr-2" />
                                                            <span>Class Materials</span>
                                                        </div>
                                                        <ChevronRight size={16} className={`transition-transform ${activeCategory === 'materials' ? 'rotate-90' : ''}`} />
                                                    </Button>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent className="pl-6 space-y-1 animate-slideDown">
                                                    <Link href="/dashboard/addClassMaterial" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                        >
                                                            <BookUp size={16} className="mr-2" />
                                                            Add Materials
                                                        </Button>
                                                    </Link>
                                                    <Link href="/dashboard/manageClassMaterial" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                        >
                                                            <Bookmark size={16} className="mr-2" />
                                                            Manage Materials
                                                        </Button>
                                                    </Link>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </div>

                                        {/* Admin-only sections */}
                                        {isAdmin && (
                                            <>
                                                {/* Course Management */}
                                                <div className="mb-3">
                                                    <Collapsible
                                                        open={activeCategory === 'courses'}
                                                        onOpenChange={() => toggleCategory('courses')}
                                                    >
                                                        <CollapsibleTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-between text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                            >
                                                                <div className="flex items-center">
                                                                    <BookOpen size={18} className="mr-2" />
                                                                    <span>Course Management</span>
                                                                </div>
                                                                <ChevronRight size={16} className={`transition-transform ${activeCategory === 'courses' ? 'rotate-90' : ''}`} />
                                                            </Button>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent className="pl-6 space-y-1 animate-slideDown">
                                                            <Link href="/dashboard/addCourses" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                                >
                                                                    <FolderPlus size={16} className="mr-2" />
                                                                    Add Courses
                                                                </Button>
                                                            </Link>
                                                            <Link href="/dashboard/updateCourses" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                                >
                                                                    <PenTool size={16} className="mr-2" />
                                                                    Update Courses
                                                                </Button>
                                                            </Link>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                </div>
                                                <div className="mb-3">
                                                    <ul className="space-y-1">
                                                        <li>
                                                            <Link href="/dashboard/manageSubscribers" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                                >
                                                                    <Mail size={18} className="mr-2" />
                                                                    Manage Subscribers
                                                                </Button>
                                                            </Link>
                                                        </li>
                                                    </ul>
                                                </div>
                                                <div className="mb-3">
                                                    <ul className="space-y-1">
                                                        <li>
                                                            <Link href="/dashboard/manageFeedbacks" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                                >
                                                                    <MessageSquare size={18} className="mr-2" />
                                                                    Manage feedbacks
                                                                </Button>
                                                            </Link>
                                                        </li>
                                                    </ul>
                                                </div>

                                                <div className="mb-3">
                                                    <ul className="space-y-1">
                                                        <li>
                                                            <Link href="/dashboard/registerTeachers" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                                >
                                                                    <UserPlus size={18} className="mr-2" />
                                                                    Register Teacher
                                                                </Button>
                                                            </Link>
                                                        </li>
                                                    </ul>
                                                </div>

                                                <div className="mb-3">
                                                    <Collapsible
                                                        open={activeCategory === 'analytics'}
                                                        onOpenChange={() => toggleCategory('analytics')}
                                                    >
                                                        <CollapsibleTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-between text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                            >
                                                                <div className="flex items-center">
                                                                    <BarChart2 size={18} className="mr-2" />
                                                                    <span>Analytics</span>
                                                                </div>
                                                                <ChevronRight size={16} className={`transition-transform ${activeCategory === 'analytics' ? 'rotate-90' : ''}`} />
                                                            </Button>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent className="pl-6 space-y-1 animate-slideDown">
                                                            <Link href="/dashboard/userAnalytics" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                                >
                                                                    <LineChart size={16} className="mr-2" />
                                                                    User Analytics
                                                                </Button>
                                                            </Link>
                                                            <Link href="/dashboard/examPerformance" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                                >
                                                                    <BarChart2 size={16} className="mr-2" />
                                                                    Exam Performance
                                                                </Button>
                                                            </Link>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                </div>

                                                {/* Events & News */}
                                                <div className="mb-3">
                                                    <Collapsible
                                                        open={activeCategory === 'events'}
                                                        onOpenChange={() => toggleCategory('events')}
                                                    >
                                                        <CollapsibleTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-between text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                            >
                                                                <div className="flex items-center">
                                                                    <Calendar size={18} className="mr-2" />
                                                                    <span>Events & News</span>
                                                                </div>
                                                                <ChevronRight size={16} className={`transition-transform ${activeCategory === 'events' ? 'rotate-90' : ''}`} />
                                                            </Button>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent className="pl-6 space-y-1 animate-slideDown">
                                                            <Link href="/dashboard/createEvents" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                                >
                                                                    <Megaphone size={16} className="mr-2" />
                                                                    Create Events
                                                                </Button>
                                                            </Link>
                                                            <Link href="/dashboard/manageEvents" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                                >
                                                                    <Calendar size={16} className="mr-2" />
                                                                    Manage Events
                                                                </Button>
                                                            </Link>
                                                            <Link href="/dashboard/addNews" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                                >
                                                                    <Newspaper size={16} className="mr-2" />
                                                                    Add News
                                                                </Button>
                                                            </Link>
                                                            <Link href="/dashboard/updateNews" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                                >
                                                                    <Newspaper size={16} className="mr-2" />
                                                                    Manage News
                                                                </Button>
                                                            </Link>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                </div>

                                                {isAdmin && (<div className="mb-3">
                                                    <Collapsible
                                                        open={activeCategory === 'advertisements'}
                                                        onOpenChange={() => toggleCategory('advertisements')}
                                                    >
                                                        <CollapsibleTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-between text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                            >
                                                                <div className="flex items-center">
                                                                    <Bell size={18} className="mr-2" />
                                                                    <span>Advertisements</span>
                                                                </div>
                                                                <ChevronRight size={16} className={`transition-transform ${activeCategory === 'advertisements' ? 'rotate-90' : ''}`} />
                                                            </Button>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent className="pl-6 space-y-1 animate-slideDown">
                                                            <Link href="/dashboard/createAdvertisement" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                                >
                                                                    <Megaphone size={16} className="mr-2" />
                                                                    Create Advertisements
                                                                </Button>
                                                            </Link>
                                                            <Link href="/dashboard/manageAdvertisement" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                                >
                                                                    <Bell size={16} className="mr-2" />
                                                                    Manage Advertisements
                                                                </Button>
                                                            </Link>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                </div>)}

                                                {/* Users & Batches */}
                                                <div className="mb-3">
                                                    <Collapsible
                                                        open={activeCategory === 'users'}
                                                        onOpenChange={() => toggleCategory('users')}
                                                    >
                                                        <CollapsibleTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-between text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                            >
                                                                <div className="flex items-center">
                                                                    <Users size={18} className="mr-2" />
                                                                    <span>Users & Batches</span>
                                                                </div>
                                                                <ChevronRight size={16} className={`transition-transform ${activeCategory === 'users' ? 'rotate-90' : ''}`} />
                                                            </Button>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent className="pl-6 space-y-1 animate-slideDown">
                                                            <Link href="/dashboard/users" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                                >
                                                                    <Users size={16} className="mr-2" />
                                                                    Manage Users
                                                                </Button>
                                                            </Link>
                                                            <Link href="/dashboard/manageBatch" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                                >
                                                                    <Briefcase size={16} className="mr-2" />
                                                                    Manage Batches
                                                                </Button>
                                                            </Link>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                </div>
                                            </>
                                        )}

                                        {/* Shared sections for Admin and Teachers */}
                                        {(isAdmin || isTeacher) && (
                                            <div className="mb-3">
                                                <Collapsible
                                                    open={activeCategory === 'announcements'}
                                                    onOpenChange={() => toggleCategory('announcements')}
                                                >
                                                    <CollapsibleTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-between text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                        >
                                                            <div className="flex items-center">
                                                                <Bell size={18} className="mr-2" />
                                                                <span>Announcements</span>
                                                            </div>
                                                            <ChevronRight size={16} className={`transition-transform ${activeCategory === 'announcements' ? 'rotate-90' : ''}`} />
                                                        </Button>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent className="pl-6 space-y-1 animate-slideDown">
                                                        <Link href="/dashboard/createAnnouncement" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                            >
                                                                <Megaphone size={16} className="mr-2" />
                                                                Create Announcement
                                                            </Button>
                                                        </Link>
                                                        <Link href="/dashboard/manageAnnouncement" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                            >
                                                                <Bell size={16} className="mr-2" />
                                                                Manage Announcements
                                                            </Button>
                                                        </Link>
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Student Navigation */}
                                {isStudent && (
                                    <>
                                        <div className="mb-3">
                                            <p className="px-3 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                                Student Portal
                                            </p>
                                            <ul className="space-y-1">
                                                <li>
                                                    <Link href="/dashboard/studentsCourse" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                        >
                                                            <BookOpen size={18} className="mr-2" />
                                                            Courses
                                                        </Button>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link href="/dashboard/exams" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                        >
                                                            <ClipboardList size={18} className="mr-2" />
                                                            Exams
                                                        </Button>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link href="/dashboard/classMaterials" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                        >
                                                            <FileText size={18} className="mr-2" />
                                                            Study Materials
                                                        </Button>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link href="/dashboard/userProfile" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                        >
                                                            <User size={18} className="mr-2" />
                                                            Profile
                                                        </Button>
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link href="/dashboard/upgradePlan" onClick={() => window.innerWidth < 1024 && setIsMenuOpen(false)}>
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                                                        >
                                                            <CreditCard size={18} className="mr-2" />
                                                            Upgrade Plan
                                                        </Button>
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                    </>
                                )}
                            </div>
                        </nav>

                        <div className="p-4  border-t border-[#1a3d47] mt-auto">
                            <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className="w-full justify-start text-white hover:bg-white hover:text-[#102c34] text-sm transition-colors"
                            >
                                <LogOut size={18} className="mr-2" />
                                Logout
                            </Button>
                        </div>
                    </aside></>}


                    {/* Main content */}
                    <main className="flex-1 h-full overflow-y-auto">
                        <div className="min-h-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>

        </>
    );
};

export default DashboardSidebar;