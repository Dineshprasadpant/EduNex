'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Clock,
  Users,
  Star,
  BookOpen,
  Presentation,
  School,
  ChevronRight,
  ChevronUp,
  CheckCircle,
  User,
  AlertCircle,
  Info
} from 'lucide-react';
import { BatchDetails, BatchApiService } from '../../../../apiCalls/studentsBatch';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function BatchDetailsPage() {
  const router = useRouter();
  const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('meetings');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBatchData = async () => {
      try {
        // Check for batch ID in cookies
        const userCookie = Cookies.get('user');
        if (!userCookie) {
          router.push('/login');
          return;
        }

        const user = JSON.parse(userCookie);
        if (!user.batch) {
          router.push('/login');
          return;
        }

        const data = await BatchApiService.getBatchDetails(user.batch);
        setBatchDetails(data);
      } catch (error) {
        toast.error('Failed to load batch details');
        console.error('Error fetching batch details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatchData();

    // Add scroll event listener
    const handleScroll = () => {
      const position = window.scrollY;
      setScrollPosition(position);
      setShowScrollTop(position > 400);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [router]);

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper function to determine if a meeting is upcoming by combining date and time
  const isMeetingUpcoming = (meeting: any) => {
    if (!meeting?.date || !meeting?.time) return false;

    try {
      // Parse date and time components
      const [hours, minutes] = meeting.time.split(':').map(Number);
      const meetingDate = new Date(meeting.date);
      meetingDate.setHours(hours, minutes, 0, 0);

      // Compare with current date and time
      return meetingDate > new Date();
    } catch (error) {
      console.error('Error calculating if meeting is upcoming:', error);
      return false;
    }
  };

  // Get the next upcoming meeting, if any
  const getNextMeeting = () => {
    if (!batchDetails?.scheduled_meetings || batchDetails.scheduled_meetings.length === 0) {
      return null;
    }

    // Filter upcoming meetings and sort by date
    const upcomingMeetings = batchDetails.scheduled_meetings
      .filter(meeting => isMeetingUpcoming(meeting))
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });

    return upcomingMeetings.length > 0 ? upcomingMeetings[0] : null;
  };

  const primaryColor = '#182c34';

  const nextMeeting = getNextMeeting();

  // Check if there are any upcoming meetings
  const hasUpcomingMeetings = batchDetails?.scheduled_meetings?.some(meeting =>
    isMeetingUpcoming(meeting)
  ) || false;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!batchDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-full max-w-md p-8 text-center">
          <School className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-3">No Batch Found</h1>
          <p className="text-gray-600 mb-6">You are not enrolled in any batch at the moment.</p>
          <Button onClick={() => router.push('/')} className="bg-gray-900 hover:bg-gray-800">
            Return Home
          </Button>
        </div>
      </div>
    );
  }



  // Make sure course object exists before rendering
  if (!batchDetails.course) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-full max-w-md p-8 text-center">
          <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Course Data Not Found</h1>
          <p className="text-gray-600 mb-6">The course information for this batch could not be loaded.</p>
          <Button onClick={() => router.push('/')} className="bg-gray-900 hover:bg-gray-800">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-white" ref={contentRef}>
        {/* Fixed header that becomes visible on scroll */}
        <div
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollPosition > 50
            ? 'py-3 bg-white/90 backdrop-blur-md shadow-sm'
            : 'py-6 bg-transparent opacity-0 -translate-y-full'
            }`}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-lg bg-gray-900 flex items-center justify-center mr-3">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <h1 className="font-bold text-lg text-gray-900">
                  {batchDetails.batch_name}
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center">
                  <nav className="flex space-x-1 bg-gray-100 p-1 rounded-full">
                    <button
                      onClick={() => setActiveTab('meetings')}
                      className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${activeTab === 'meetings'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Meetings
                    </button>
                    <button
                      onClick={() => setActiveTab('curriculum')}
                      className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${activeTab === 'curriculum'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Curriculum
                    </button>
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${activeTab === 'overview'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('schedule')}
                      className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${activeTab === 'overview'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      Schedule
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden bg-[#182c34] animate-fadeIn">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600"></div>
          <div className="absolute top-20 right-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl"></div>

          <div className="container mx-auto px-6 py-16 relative z-10">
            <Badge className="mb-4 bg-white/10 hover:bg-white/20 text-white border-none ">
              {batchDetails.course.category || 'General'}
            </Badge>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-white animate-slideUpFade">
              {batchDetails.batch_name}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-white/90 mb-8">
              <div className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                <span>{batchDetails.course.title || 'Course'}</span>
              </div>
              <div className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                <span>{batchDetails.course.studentsEnrolled || 0} students</span>
              </div>
              <div className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                <span>{batchDetails.course.overallHours || 0} hours</span>
              </div>
            </div>

            {/* Module Leader */}
            <div className="flex items-center">
              <Avatar className="border-2 border-white/20 mr-3 h-12 w-12">
                <AvatarFallback className="bg-gray-700 text-white text-lg">
                  {batchDetails.course.moduleLeader ?
                    batchDetails.course.moduleLeader.split(' ').map(name => name[0]).join('') :
                    'ML'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-white/70">Module Leader</p>
                <p className="font-medium text-lg text-white">{batchDetails.course.moduleLeader || 'Not Assigned'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Meeting Alert Banner (if available) */}
        {nextMeeting ? (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
            <div className="container mx-auto px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center mr-3 flex-shrink-0">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Next Scheduled Meeting</p>
                    <h3 className="font-medium text-gray-900">{nextMeeting.title} • {new Date(nextMeeting.date).toLocaleDateString()} at {nextMeeting.time}</h3>
                  </div>
                </div>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 shadow-sm"
                  asChild
                >
                  <a href={nextMeeting.meeting_link} target="_blank" rel="noopener noreferrer">
                    Join Meeting
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border-b border-gray-100">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0">
                    <Calendar className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Meeting Schedule</p>
                    <h3 className="font-medium text-gray-900">No upcoming meetings scheduled</h3>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('meetings')}
                  className="text-gray-700 border-gray-300"
                >
                  View Meeting History
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="container mx-auto px-6 py-8">
          {/* Mobile navigation */}
          <div className="md:hidden flex justify-center mb-8">
            <nav className="flex space-x-1 bg-gray-100 p-1 rounded-full">
              <button
                onClick={() => setActiveTab('meetings')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${activeTab === 'meetings'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
                  }`}
              >
                Meetings
              </button>
              <button
                onClick={() => setActiveTab('curriculum')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${activeTab === 'curriculum'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
                  }`}
              >
                Curriculum
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${activeTab === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
                  }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${activeTab === 'schedule'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
                  }`}
              >
                Schedule
              </button>
            </nav>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:block mb-10">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px space-x-8">
                <button
                  onClick={() => setActiveTab('meetings')}
                  className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors relative ${activeTab === 'meetings'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Meetings
                </button>
                <button
                  onClick={() => setActiveTab('curriculum')}
                  className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors relative ${activeTab === 'curriculum'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Curriculum
                </button>
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors relative ${activeTab === 'overview'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors relative ${activeTab === 'schedule'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  Schedule
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content - Overview */}
          {activeTab === 'overview' && (
            <div className="animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-12">
                  {/* Course Description */}
                  <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">About This Course</h2>
                    <div className="prose prose-slate max-w-none">
                      {batchDetails.course.description ?
                        batchDetails.course.description.map((paragraph, index) => (
                          <p key={index} className="text-gray-700 leading-relaxed mb-4">{paragraph}</p>
                        )) :
                        <p className="text-gray-700 leading-relaxed mb-4">No course description available.</p>
                      }
                    </div>
                  </section>

                  {/* Course Highlights */}
                  <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Highlights</h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {batchDetails.course.courseHighlights && batchDetails.course.courseHighlights.length > 0 ?
                        batchDetails.course.courseHighlights.map((highlight, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                            <span className="text-gray-700">{highlight}</span>
                          </li>
                        )) :
                        <li className="flex items-start">
                          <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">No course highlights available.</span>
                        </li>
                      }
                    </ul>
                  </section>

                  {/* Learning Format */}
                  <section>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Format</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {batchDetails.course.learningFormat && batchDetails.course.learningFormat.length > 0 ?
                        batchDetails.course.learningFormat.map((format, index) => (
                          <div key={index} className="relative group">
                            {/* Subtle decorative background that reveals on hover */}
                            <div className="absolute inset-0 bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="relative flex items-start p-4 rounded-lg">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0
                              ${index % 3 === 0 ? 'bg-blue-100 text-blue-600' :
                                  index % 3 === 1 ? 'bg-purple-100 text-purple-600' :
                                    'bg-amber-100 text-amber-600'}`}>
                                {index % 3 === 0 && <BookOpen className="h-5 w-5" />}
                                {index % 3 === 1 && <Presentation className="h-5 w-5" />}
                                {index % 3 === 2 && <Star className="h-5 w-5" />}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{format.name}</h3>
                                <p className="text-gray-600 mt-1">{format.description}</p>
                              </div>
                            </div>
                          </div>
                        )) :
                        <div className="col-span-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-start">
                            <Info className="h-5 w-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-700">No learning format information available.</p>
                          </div>
                        </div>
                      }
                    </div>
                  </section>
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-8">
                  {/* Course Details */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Course Details</h3>
                    <ul className="space-y-4">
                      <li className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Module Leader</span>
                        <span className="font-medium text-gray-900">{batchDetails.course.moduleLeader || 'Not Assigned'}</span>
                      </li>
                      <li className="flex justify-between border-b border-gray-200 pb-2 gap-10">
                        <span className="text-gray-600">Category</span>
                        <span className="font-medium text-gray-900">{batchDetails.course.category || 'General'}</span>
                      </li>
                      <li className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Duration</span>
                        <span className="font-medium text-gray-900">{batchDetails.course.overallHours || 0} hours</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Instructors</span>
                        <span className="font-medium text-gray-900">{batchDetails.course.teachersCount || 0} teachers</span>
                      </li>
                    </ul>
                  </div>

                  {/* More Meetings Preview */}
                  {hasUpcomingMeetings ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Upcoming Meetings</h3>
                        <button
                          onClick={() => setActiveTab('meetings')}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          View all <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        {batchDetails.scheduled_meetings
                          .filter(meeting => isMeetingUpcoming(meeting))
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .slice(0, 3)
                          .map((meeting, index) => (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg group hover:bg-gray-100 transition-colors">
                              <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                              <div className="flex flex-wrap items-center text-gray-500 text-sm mt-1">
                                <div className="flex items-center mr-3">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  <span>{new Date(meeting.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>{meeting.time}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">No Upcoming Meetings</h3>
                          <p className="text-sm text-gray-600">
                            There are no upcoming meetings scheduled for your batch at this time. You can check the meetings tab for past meetings.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content - Curriculum */}
          {activeTab === 'curriculum' && (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Curriculum</h2>
                  <p className="text-gray-500">{batchDetails.course.overallHours || 0} total hours of content</p>
                </div>
                <Badge className="bg-gray-900 hover:bg-gray-800 text-white">
                  {batchDetails.course.curriculum ? batchDetails.course.curriculum.length : 0} Modules
                </Badge>
              </div>

              {batchDetails.course.curriculum && batchDetails.course.curriculum.length > 0 ? (
                <ol className="space-y-8">
                  {batchDetails.course.curriculum.map((module, index) => (
                    <li key={index} className="relative group">
                      {/* Progress indicator line */}
                      {index < batchDetails.course.curriculum.length - 1 && (
                        <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-200"></div>
                      )}

                      <div className="flex gap-4">
                        {/* Module number indicator */}
                        <div className="relative z-10">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 font-medium
                          ${index === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 border border-gray-200 text-gray-700 group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors'}`}>
                            {index + 1}
                          </div>
                        </div>

                        {/* Module content */}
                        <div className="flex-1 pb-8">
                          <div className="transition-colors rounded-lg">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors">{module.title}</h3>
                            <p className="text-gray-600 mb-4">{module.description}</p>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                {module.duration} hours
                              </div>
                              <div className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-1 text-gray-400" />
                                {Math.round(module.duration * 2)} lessons
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-100">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Curriculum Available</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    The curriculum for this course is not available at the moment.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab Content - Meetings */}
          {activeTab === 'meetings' && (
            <div className="animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Scheduled Meetings</h2>
                  <p className="text-gray-500">View upcoming and past meetings for your batch</p>
                </div>

                {hasUpcomingMeetings && (
                  <Badge className="mt-2 md:mt-0 bg-green-100 text-green-800 hover:bg-green-200 border-none">
                    {batchDetails.scheduled_meetings.filter(meeting => isMeetingUpcoming(meeting)).length} Upcoming
                  </Badge>
                )}
              </div>

              {/* No meetings message */}
              {!batchDetails.scheduled_meetings || batchDetails.scheduled_meetings.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-100">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Meetings Scheduled</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    There are no meetings scheduled for this batch at the moment. Check back later.
                  </p>
                </div>
              )}

              {/* Meetings list with sections */}
              {batchDetails.scheduled_meetings && batchDetails.scheduled_meetings.length > 0 && (
                <div className="space-y-8">
                  {/* Upcoming meetings section */}
                  {hasUpcomingMeetings && (
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center">
                        <Calendar className="h-5 w-5 text-blue-600 mr-2" />
                        Upcoming Meetings
                      </h3>
                      <div className="space-y-4">
                        {batchDetails.scheduled_meetings
                          .filter(meeting => isMeetingUpcoming(meeting))
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map((meeting, index) => {
                            const isNextMeeting = index === 0;
                            const meetingDate = new Date(meeting.date);

                            return (
                              <div
                                key={index}
                                className={`border rounded-lg group hover:border-blue-200 transition-all
                             ${isNextMeeting
                                    ? 'border-blue-200 bg-white relative overflow-hidden shadow-sm'
                                    : 'border-gray-200 bg-white'
                                  }
                           `}
                              >
                                {isNextMeeting && (
                                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                                )}

                                <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                  <div className="flex items-start gap-4">
                                    <div className={`rounded-full p-3 flex-shrink-0 h-14 w-14 flex items-center justify-center
                                 ${isNextMeeting
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-700'}`
                                    }>
                                      <Calendar className="h-6 w-6" />
                                    </div>
                                    <div>
                                      <div className="flex items-center">
                                        <h3 className="font-semibold text-lg text-gray-900">{meeting.title}</h3>
                                        {isNextMeeting && (
                                          <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                            Next Up
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap mt-2 gap-x-4 gap-y-2 text-sm text-gray-500">
                                        <div className="flex items-center">
                                          <Calendar className="h-4 w-4 mr-1" />
                                          <span>{meetingDate.toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <Clock className="h-4 w-4 mr-1" />
                                          <span>{meeting.time}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <Clock className="h-4 w-4 mr-1" />
                                          <span>{meeting.duration_minutes} minutes</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <Button
                                    className={isNextMeeting
                                      ? 'bg-blue-600 hover:bg-blue-700 shadow-sm'
                                      : 'bg-gray-900 hover:bg-gray-800'
                                    }
                                    asChild
                                  >
                                    <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                                      Join Meeting
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Past meetings section */}
                  {batchDetails.scheduled_meetings && batchDetails.scheduled_meetings.some(meeting => !isMeetingUpcoming(meeting)) && (
                    <div className={!hasUpcomingMeetings ? '' : 'mt-12 pt-8 border-t border-gray-200'}>
                      <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center">
                        <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                        Past Meetings
                      </h3>
                      <div className="space-y-4">
                        {batchDetails.scheduled_meetings
                          .filter(meeting => !isMeetingUpcoming(meeting))
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Most recent first
                          .map((meeting, index) => {
                            const meetingDate = new Date(meeting.date);

                            return (
                              <div
                                key={index}
                                className="border-gray-200 border rounded-lg bg-gray-50/50"
                              >
                                <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                  <div className="flex items-start gap-4">
                                    <div className="rounded-full p-3 flex-shrink-0 h-14 w-14 flex items-center justify-center bg-gray-100 text-gray-400">
                                      <Calendar className="h-6 w-6" />
                                    </div>
                                    <div>
                                      <div className="flex items-center">
                                        <h3 className="font-semibold text-lg text-gray-900">{meeting.title}</h3>
                                        <span className="ml-3 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                          Past
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap mt-2 gap-x-4 gap-y-2 text-sm text-gray-500">
                                        <div className="flex items-center">
                                          <Calendar className="h-4 w-4 mr-1" />
                                          <span>{meetingDate.toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <Clock className="h-4 w-4 mr-1" />
                                          <span>{meeting.time}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <Clock className="h-4 w-4 mr-1" />
                                          <span>{meeting.duration_minutes} minutes</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <Button
                                    variant="outline"
                                    className="border-gray-300 text-gray-600"
                                    disabled
                                  >
                                    Meeting Ended
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* No upcoming meetings message */}
                  {!hasUpcomingMeetings && batchDetails.scheduled_meetings && batchDetails.scheduled_meetings.length > 0 && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-6">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium text-blue-900">No Upcoming Meetings</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            There are no upcoming meetings scheduled for your batch at this time. New meetings will be displayed here when they are scheduled.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="animate-fadeIn">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Schedule</h2>
                <p className="text-gray-500">Regular class timings and delivery format</p>
              </div>

              {batchDetails.course.schedule && batchDetails.course.schedule.length > 0 ? (
                <div className="space-y-8">
                  {/* Combined Schedule Table */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-medium text-gray-900">Weekly Schedule</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-px bg-gray-200">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                        const daySchedules = batchDetails.course.schedule.filter((s: { day: string; }) => s.day === day);

                        // Group schedules by time slot
                        const timeSlots: Record<string, { startTime: string, endTime: string, mediums: Set<string> }> = {};
                        daySchedules.forEach((schedule: { startTime: any; endTime: any; medium: string; }) => {
                          const timeKey = `${schedule.startTime}-${schedule.endTime}`;
                          if (!timeSlots[timeKey]) {
                            timeSlots[timeKey] = {
                              startTime: schedule.startTime,
                              endTime: schedule.endTime,
                              mediums: new Set()
                            };
                          }
                          timeSlots[timeKey].mediums.add(schedule.medium);
                        });

                        const uniqueTimeSlots = Object.values(timeSlots);

                        return (
                          <div key={day} className="bg-white">
                            <div className="p-4 border-b border-gray-200">
                              <h3 className="font-medium text-gray-900 text-center">{day.substring(0, 3)}</h3>
                            </div>
                            <div className="p-4 space-y-3">
                              {uniqueTimeSlots.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center">No class</p>
                              ) : (
                                uniqueTimeSlots.map((slot, index) => {
                                  const hasBoth = slot.mediums.has('both');
                                  const hasOnline = slot.mediums.has('online');
                                  const hasOffline = slot.mediums.has('offline');

                                  return (
                                    <div key={index} className="text-center">
                                      <p className="text-sm text-gray-900 font-medium">
                                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                      </p>
                                      {hasBoth ? (
                                        <Badge
                                          variant="outline"
                                          className="mt-1 capitalize"
                                          style={{
                                            backgroundColor: `${primaryColor}10`,
                                            borderColor: primaryColor,
                                            color: primaryColor
                                          }}
                                        >
                                          Hybrid (Both)
                                        </Badge>
                                      ) : hasOnline && hasOffline ? (
                                        <div className="flex justify-center gap-1 mt-1">
                                          <Badge
                                            variant="outline"
                                            className="capitalize"
                                            style={{
                                              backgroundColor: '#eff6ff',
                                              borderColor: '#bfdbfe',
                                              color: '#1d4ed8'
                                            }}
                                          >
                                            Online
                                          </Badge>
                                          <Badge
                                            variant="outline"
                                            className="capitalize"
                                            style={{
                                              backgroundColor: '#f0fdf4',
                                              borderColor: '#bbf7d0',
                                              color: '#15803d'
                                            }}
                                          >
                                            Offline
                                          </Badge>
                                        </div>
                                      ) : hasOnline ? (
                                        <Badge
                                          variant="outline"
                                          className="mt-1 capitalize"
                                          style={{
                                            backgroundColor: '#eff6ff',
                                            borderColor: '#bfdbfe',
                                            color: '#1d4ed8'
                                          }}
                                        >
                                          Online
                                        </Badge>
                                      ) : hasOffline ? (
                                        <Badge
                                          variant="outline"
                                          className="mt-1 capitalize"
                                          style={{
                                            backgroundColor: '#f0fdf4',
                                            borderColor: '#bbf7d0',
                                            color: '#15803d'
                                          }}
                                        >
                                          Offline
                                        </Badge>
                                      ) : null}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-6 border-t border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-3">Delivery Format</h3>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#1d4ed8' }}></div>
                          <span className="text-sm text-gray-600">Online</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#15803d' }}></div>
                          <span className="text-sm text-gray-600">Offline</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></div>
                          <span className="text-sm text-gray-600">Hybrid (Both)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Schedule Available</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    The schedule for this course has not been set yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scroll to top button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-fadeIn"
          >
            <ChevronUp className="h-5 w-5 text-gray-700" />
          </button>
        )}

        <style jsx>{`
     @keyframes fadeIn {
       from { opacity: 0; }
       to { opacity: 1; }
     }
     
     @keyframes slideUpFade {
       from { opacity: 0; transform: translateY(20px); }
       to { opacity: 1; transform: translateY(0); }
     }
     
     .animate-fadeIn {
       animation: fadeIn 0.4s ease-out forwards;
     }
     
     .animate-slideUpFade {
       animation: slideUpFade 0.5s ease-out forwards;
     }
   `}</style>
      </div>
    </Suspense>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section Skeleton */}
      <div className="bg-gray-900">
        <div className="container mx-auto px-6 py-16">
          <Skeleton className="h-6 w-24 bg-white/10 mb-4" />
          <Skeleton className="h-10 w-3/4 bg-white/10 mb-6" />

          <div className="flex flex-wrap gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-32 bg-white/10" />
            ))}
          </div>

          <div className="flex items-center mt-6">
            <Skeleton className="h-12 w-12 rounded-full bg-white/10 mr-3" />
            <div>
              <Skeleton className="h-4 w-24 bg-white/10 mb-1" />
              <Skeleton className="h-5 w-32 bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      {/* Alert banner skeleton */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Skeleton className="h-10 w-10 rounded-full bg-gray-200 mr-3" />
              <div>
                <Skeleton className="h-4 w-32 bg-gray-200 mb-1" />
                <Skeleton className="h-5 w-64 bg-gray-200" />
              </div>
            </div>
            <Skeleton className="h-10 w-28 rounded-md bg-gray-200" />
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex mb-8 justify-center md:justify-start">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-full">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full bg-gray-200" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-48 bg-gray-200 mb-2" />
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full bg-gray-200" />
                ))}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {[...Array(4)].map((_, k) => (
                    <Skeleton key={k} className="h-20 w-full bg-gray-200 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-8">
            <Skeleton className="h-64 w-full bg-gray-200 rounded-lg" />
            <Skeleton className="h-48 w-full bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}