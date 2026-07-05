"use client"
import React, { useState, useEffect, useRef } from 'react';
import { getUserInfo } from '../../../../apiCalls/manageUser';
import { 
  Mail, Phone, Book, Clipboard, 
  AlertCircle, BarChart2, TrendingUp, TrendingDown,
  CheckCircle, User, Calendar, Award, ArrowRight, Target
} from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface ExamResult {
  totalMarks: number;
  examId: string;
  examName: string;
  totalQuestions: number;
  correctAnswers: number;
  unAnsweredQuestions: number;
  totalMarksObtained: number;
}

interface UserData {
  _id: string;
  fullname: string;
  role: 'admin' | 'teacher' | 'user';
  email: string;
  phone: string;
  status: 'verified' | 'unverified';
  courseEnrolled: {
    title: string
  };
  citizenshipImageUrl: string;
  plan: 'full' | 'half' | 'free';
  examsAttended: ExamResult[];
}

const UserProfile: React.FC = () => {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'exams' | 'analysis'>('overview');
  const [scrollPosition, setScrollPosition] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = Cookies.get("user") || "";
        if(!user){
            router.push("/login")
        }
        const parsedUser = JSON.parse(user)
        const userId = parsedUser.id;
        const response = await getUserInfo(userId || '');
        if (response.success) {
          setUserData(response.users);
        } else {
          setError('Failed to fetch user data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    
    // Add scroll event listener
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [router]);

  const calculatePerformanceMetrics = () => {
    if (!userData?.examsAttended || userData.examsAttended.length === 0) {
      return {
        averageScore: 0,
        completionRate: 0,
        accuracy: 0,
        trend: 'neutral',
        totalExams: 0
      };
    }

    const totalExams = userData.examsAttended.length;
    let totalAnswered = 0;
    let totalCorrect = 0;
    let totalQuestions = 0;
    let totalMarks = 0;

    userData.examsAttended.forEach(exam => {
      totalAnswered += exam.totalQuestions - exam.unAnsweredQuestions;
      totalCorrect += exam.correctAnswers;
      totalQuestions += exam.totalQuestions;
      totalMarks += exam.totalMarksObtained;
    });

    // Calculate average score (percentage)
    const averageScore = totalQuestions > 0 ? Math.round((totalMarks / totalQuestions) * 100) : 0;

    // Calculate completion rate (percentage of questions answered)
    const completionRate = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

    // Calculate accuracy (percentage of correct answers among answered questions)
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    // Determine trend (compare last two exams if available)
    let trend: 'improving' | 'declining' | 'neutral' = 'neutral';
    if (userData.examsAttended.length >= 2) {
      const lastExam = userData.examsAttended[userData.examsAttended.length - 1];
      const prevExam = userData.examsAttended[userData.examsAttended.length - 2];
      
      const lastScore = lastExam.totalMarksObtained / lastExam.totalQuestions;
      const prevScore = prevExam.totalMarksObtained / prevExam.totalQuestions;
      
      trend = lastScore > prevScore ? 'improving' : lastScore < prevScore ? 'declining' : 'neutral';
    }

    return {
      averageScore,
      completionRate,
      accuracy,
      trend,
      totalExams
    };
  };

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'improving': return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case 'declining': return <TrendingDown className="h-5 w-5 text-rose-500" />;
      default: return <TrendingUp className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPerformanceAssessment = () => {
    const { averageScore, completionRate, accuracy, trend } = calculatePerformanceMetrics();

    let assessment = [];

    // Score assessment
    if (averageScore >= 70) {
      assessment.push("Excellent performance with consistently high scores");
    } else if (averageScore >= 40) {
      assessment.push("Average performance with room for improvement");
    } else {
      assessment.push("Below average performance, needs significant improvement");
    }

    // Completion rate assessment
    if (completionRate >= 90) {
      assessment.push("Completes most questions, good time management");
    } else if (completionRate >= 60) {
      assessment.push("Moderate completion rate, could improve pacing");
    } else {
      assessment.push("Low completion rate, many questions left unanswered");
    }

    // Accuracy assessment
    if (accuracy >= 80) {
      assessment.push("High accuracy when answering questions");
    } else if (accuracy >= 50) {
      assessment.push("Moderate accuracy, some knowledge gaps present");
    } else {
      assessment.push("Low accuracy, significant knowledge gaps identified");
    }

    // Trend assessment
    if (trend === 'improving') {
      assessment.push("Performance is improving with each attempt");
    } else if (trend === 'declining') {
      assessment.push("Performance has declined recently");
    } else {
      assessment.push("Performance has remained steady");
    }

    return assessment;
  };

  // Modern loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="loading-dots">
          <div></div>
          <div></div>
          <div></div>
        </div>
        <style jsx>{`
          .loading-dots {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }
          
          .loading-dots div {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #6366f1;
            opacity: 0;
            animation: loadingDots 1.5s infinite ease-in-out;
          }
          
          .loading-dots div:nth-child(2) {
            animation-delay: 0.15s;
          }
          
          .loading-dots div:nth-child(3) {
            animation-delay: 0.3s;
          }
          
          @keyframes loadingDots {
            0%, 80%, 100% {
              opacity: 0;
              transform: scale(0.8);
            }
            40% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Unable to Load Profile</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 flex items-center justify-center bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor"/>
            </svg>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md w-full p-8">
          <div className="h-16 w-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-6">We couldn't locate the profile you're looking for.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="py-2.5 px-5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const performanceMetrics = calculatePerformanceMetrics();
  const performanceAssessment = getPerformanceAssessment();

  // Custom circular progress component
  const CircularProgress = ({ 
    value = 0, 
    maxValue = 100, 
    radius = 60, 
    strokeWidth = 12, 
    color = "#6366f1",
    textColor = "#111827"
  }) => {
    const normalizedValue = Math.min(Math.max(value, 0), maxValue);
    const percentage = (normalizedValue / maxValue) * 100;
    
    // SVG parameters
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={(radius + strokeWidth) * 2} height={(radius + strokeWidth) * 2} className="transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx={(radius + strokeWidth)}
            cy={(radius + strokeWidth)}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          
          {/* Progress Circle */}
          <circle
            cx={(radius + strokeWidth)}
            cy={(radius + strokeWidth)}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="progress-ring__circle"
            style={{
              transition: "stroke-dashoffset 1s ease"
            }}
          />
        </svg>
        
        {/* Percentage Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold`} style={{ color: textColor }}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header section with semi-transparent effect on scroll */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollPosition > 50 ? 'py-3 bg-white/90 backdrop-blur-md shadow-sm' : 'py-6 bg-transparent'
        }`}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end">
           
            
            <div className="flex items-center space-x-2">
              <div className="hidden md:flex items-center space-x-6">
                <button 
                  onClick={() => setActiveSection('overview')}
                  className={`text-sm font-medium transition-colors ${
                    activeSection === 'overview' ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Overview
                </button>
                <button 
                  onClick={() => setActiveSection('analysis')}
                  className={`text-sm font-medium transition-colors ${
                    activeSection === 'analysis' ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analysis
                </button>
                <button 
                  onClick={() => setActiveSection('exams')}
                  className={`text-sm font-medium transition-colors ${
                    activeSection === 'exams' ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Exams
                </button>
              </div>
              
              <div className="rounded-full h-9 w-9 flex items-center justify-center text-xs font-medium bg-indigo-100 text-indigo-700">
                {userData.role.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
          
          {/* Mobile navigation */}
          <div className="md:hidden flex justify-center mt-4 pb-1">
            <div className="inline-flex rounded-full bg-gray-100 p-1">
              <button 
                onClick={() => setActiveSection('overview')}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                  activeSection === 'overview' 
                    ? 'bg-white shadow text-gray-900' 
                    : 'text-gray-500'
                }`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveSection('analysis')}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                  activeSection === 'analysis' 
                    ? 'bg-white shadow text-gray-900' 
                    : 'text-gray-500'
                }`}
              >
                Analysis
              </button>
              <button 
                onClick={() => setActiveSection('exams')}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                  activeSection === 'exams' 
                    ? 'bg-white shadow text-gray-900' 
                    : 'text-gray-500'
                }`}
              >
                Exams
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile and content area */}
      <div className="pt-32 pb-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile Information */}
          <div className="mb-16 relative" ref={profileRef}>
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 mb-8 md:mb-0">
                <div className="relative">
                    <div className="h-40 w-40 relative shadow-lg mb-6">
                      <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-br from-indigo-400 to-indigo-600 transform skew-y-3 rotate-3"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <User className="h-16 w-16 text-white" />
                      </div>
                    </div>
                  
                  {/* Verification badge */}
                  {userData.status === 'verified' && (
                    <div className="absolute top-4 right-4 bg-white h-8 w-8 rounded-full shadow-md flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                  )}
                  
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{userData.fullname}</h1>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                      userData.plan === 'full' ? 'bg-indigo-100 text-indigo-700' : 
                      userData.plan === 'half' ? 'bg-purple-100 text-purple-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {userData.plan.toUpperCase()} PLAN
                    </span>
                    
                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {userData.role.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <Mail className="mr-3 h-5 w-5 text-gray-400" />
                      <span>{userData.email}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-700">
                      <Phone className="mr-3 h-5 w-5 text-gray-400" />
                      <span>{userData.phone}</span>
                    </div>
                    
                    {userData.courseEnrolled && (
                      <div className="flex items-center text-gray-700">
                        <Book className="mr-3 h-5 w-5 text-gray-400" />
                        <span>{userData.courseEnrolled.title}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="md:w-2/3">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Overview</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                      <CircularProgress 
                        value={performanceMetrics.averageScore} 
                        color="#6366f1" 
                      />
                      <p className="mt-4 text-gray-900 font-medium">Average Score</p>
                    </div>
                    
                    <div className="text-center">
                      <CircularProgress 
                        value={performanceMetrics.completionRate} 
                        color="#10b981" 
                      />
                      <p className="mt-4 text-gray-900 font-medium">Completion Rate</p>
                    </div>
                    
                    <div className="text-center">
                      <CircularProgress 
                        value={performanceMetrics.accuracy} 
                        color="#8b5cf6" 
                      />
                      <p className="mt-4 text-gray-900 font-medium">Accuracy</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 bg-gray-50 border-l-4 border-indigo-500">
                  <div className="flex items-center mb-4">
                    {getTrendIcon(performanceMetrics.trend)}
                    <h3 className="ml-2 text-lg font-medium text-gray-900">
                      {performanceMetrics.trend.charAt(0).toUpperCase() + performanceMetrics.trend.slice(1)} Trend
                    </h3>
                  </div>
                  <p className="text-gray-700">
                    {performanceMetrics.trend === 'improving' ? 
                      'Your performance is steadily improving. Keep up with your current study routine!' : 
                     performanceMetrics.trend === 'declining' ? 
                      'Recent exams show a decline in performance. Consider reviewing earlier materials or scheduling a tutoring session.' : 
                      'Your performance has remained stable. Challenge yourself with more advanced content to continue growing.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content based on active section */}
          {activeSection === 'overview' && (
            <div>
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Performance Assessment</h2>
                
                <div className="space-y-6">
                  {performanceAssessment.map((assessment, index) => (
                    <div key={index} className="flex">
                      <div className="mr-4 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-semibold">{index + 1}</span>
                        </div>
                      </div>
                      <div className="pb-6 relative">
                        <p className="text-gray-700">{assessment}</p>
                        {index < performanceAssessment.length - 1 && (
                          <div className="absolute top-8 bottom-0 left-[-17px] w-px bg-indigo-100"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Recommended Next Steps</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
                  <div className="group">
                    <div className="h-48 mb-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 transform group-hover:scale-105 transition-transform duration-300 ease-out"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Target className="h-12 w-12 text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-xl font-bold text-white">Practice Tests</h3>
                      </div>
                    </div>
                    <p className="text-gray-700">Take practice tests to improve your accuracy and timing</p>
                    <button className="mt-3 inline-flex items-center text-emerald-600 font-medium hover:text-emerald-700">
                      Browse tests <ArrowRight className="ml-1 h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="group">
                    <div className="h-48 mb-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-indigo-600 transform group-hover:scale-105 transition-transform duration-300 ease-out"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Book className="h-12 w-12 text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-xl font-bold text-white">Review Materials</h3>
                      </div>
                    </div>
                    <p className="text-gray-700">Focus on comprehensive review of your weak areas</p>
                    <button className="mt-3 inline-flex items-center text-indigo-600 font-medium hover:text-indigo-700">
                      View materials <ArrowRight className="ml-1 h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="group">
                    <div className="h-48 mb-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 transform group-hover:scale-105 transition-transform duration-300 ease-out"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Calendar className="h-12 w-12 text-white" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-xl font-bold text-white">Schedule Tutorials</h3>
                      </div>
                    </div>
                    <p className="text-gray-700">Book one-on-one sessions with instructors for targeted help</p>
                    <button className="mt-3 inline-flex items-center text-amber-600 font-medium hover:text-amber-700">
                      Book session <ArrowRight className="ml-1 h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeSection === 'analysis' && (
            <div>
              {userData.examsAttended.length > 0 ? (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">Performance Analysis</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                    {/* Strengths */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 inline-flex items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        </div>
                        Strengths
                      </h3>
                      
                      <div className="space-y-6 mt-6">
                        {userData.examsAttended
                          .sort((a, b) => {
                            const aScore = a.totalMarks / a.totalMarksObtained;
                            const bScore = b.totalMarks / b.totalMarksObtained;
                            return bScore - aScore;
                          })
                          .slice(0, 3) 
                          .map((exam, index) => {
                            const percentage = Math.round((exam.totalMarksObtained / exam.totalMarks) * 100);
                            return (
                              <div key={index} className="relative">
                                <div className="absolute top-0 bottom-0 left-2 w-px bg-emerald-100"></div>
                                <div className="relative pl-10">
                                  <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-emerald-500"></div>
                                  <h4 className="text-lg font-medium text-gray-900 mb-1">{exam.examName}</h4>
                                  <p className="text-emerald-600 font-semibold mb-1">{percentage}% Score</p>
                                  <p className="text-gray-700 text-sm">
                                    {exam.correctAnswers} of {exam.totalQuestions} correct answers
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                    
                    {/* Areas for Improvement */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 inline-flex items-center">
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center mr-3">
                          <Target className="h-5 w-5 text-rose-500" />
                        </div>
                        Areas for Improvement
                      </h3>
                      
                      <div className="space-y-6 mt-6">
                        {userData.examsAttended
                          .sort((a, b) => {
                            const aScore = a.totalMarks / a.totalMarksObtained;
                            const bScore = b.totalMarks / b.totalMarksObtained;
                            return aScore - bScore;
                          })
                          .slice(0, 3)
                          .map((exam, index) => {
                            const percentage = Math.round((exam.totalMarksObtained / exam.totalMarks) * 100);
                            console.log(percentage)
                            return (
                              <div key={index} className="relative">
                                <div className="absolute top-0 bottom-0 left-2 w-px bg-rose-100"></div>
                                <div className="relative pl-10">
                                  <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-rose-500"></div>
                                  <h4 className="text-lg font-medium text-gray-900 mb-1">{exam.examName}</h4>
                                  <p className="text-rose-600 font-semibold mb-1">{percentage}% Score</p>
                                  <p className="text-gray-700 text-sm">
                                    {exam.correctAnswers} of {exam.totalQuestions} correct answers
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance Insights */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Performance Insights</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">

                      
                      <div className="relative">
                        <div className="absolute -top-3 -left-3 w-16 h-16 bg-indigo-100 rounded-full opacity-50"></div>
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Time Management</h3>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
                            <div 
                              className="h-full bg-indigo-600 rounded-full"
                              style={{ width: `${performanceMetrics.completionRate}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Needs Work</span>
                            <span className="text-sm text-gray-500">Excellent</span>
                          </div>
                          
                          <p className="mt-4 text-gray-700">
                            {performanceMetrics.completionRate >= 80 ? 
                              'You demonstrate excellent time management skills, completing most questions within the allotted time.' :
                             performanceMetrics.completionRate >= 50 ? 
                              'Your time management is average. Consider practicing timed exercises to improve efficiency.' :
                              'Time management appears to be a challenge. Many questions are left unanswered due to time constraints.'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="relative mt-8 md:mt-12">
                        <div className="absolute -top-3 -left-3 w-16 h-16 bg-purple-100 rounded-full opacity-50"></div>
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Accuracy</h3>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
                            <div 
                              className="h-full bg-purple-600 rounded-full"
                              style={{ width: `${performanceMetrics.accuracy}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Needs Work</span>
                            <span className="text-sm text-gray-500">Excellent</span>
                          </div>
                          
                          <p className="mt-4 text-gray-700">
                            {performanceMetrics.accuracy >= 80 ? 
                              'Your accuracy is impressive. You consistently select the correct answers when you respond.' :
                             performanceMetrics.accuracy >= 50 ? 
                              'Your accuracy is moderate. Focus on understanding core concepts more deeply.' :
                              'Your accuracy needs improvement. Consider revisiting fundamental concepts before advancing.'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="relative mt-8 md:mt-24">
                        <div className="absolute -top-3 -left-3 w-16 h-16 bg-emerald-100 rounded-full opacity-50"></div>
                        <div className="relative z-10">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">Overall Performance</h3>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
                            <div 
                              className="h-full bg-emerald-600 rounded-full"
                              style={{ width: `${performanceMetrics.averageScore}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Needs Work</span>
                            <span className="text-sm text-gray-500">Excellent</span>
                          </div>
                          
                          <p className="mt-4 text-gray-700">
                            {performanceMetrics.averageScore >= 70 ? 
                              'Your overall performance is excellent. Continue challenging yourself with advanced material.' :
                             performanceMetrics.averageScore >= 40 ? 
                              'Your overall performance is satisfactory, with clear room for improvement in specific areas.' :
                              'Your overall performance indicates significant challenges. Consider seeking additional support.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
                    <Clipboard className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">No Exam Data Available</h3>
                  <p className="text-gray-600 max-w-md mx-auto mb-8">
                    You haven't completed any exams yet. Your performance analysis will be available once you take your first exam.
                  </p>
                  <button className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                    Browse Available Exams
                  </button>
                </div>
              )}
            </div>
          )}
          
          {activeSection === 'exams' && (
            <div>
              <div className="flex flex-wrap items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Exam History</h2>
                
                {userData.examsAttended.length > 0 && (
                  <div className="mt-4 sm:mt-0 flex items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 mr-2">
                      <Clipboard className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{userData.examsAttended.length} Exams Completed</span>
                  </div>
                )}
              </div>
              
              {userData.examsAttended.length > 0 ? (
                <div className="space-y-8">
                  {userData.examsAttended.map((exam, index) => {
                    const percentage = Math.round((exam.totalMarksObtained / exam.totalQuestions) * 100);
                    const bgColor = 
                      percentage >= 70 ? 'bg-emerald-100 text-emerald-800' :
                      percentage >= 40 ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800';
                    
                    return (
                      <div key={index} className="bg-white overflow-hidden relative group">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full transform translate-x-16 -translate-y-16 group-hover:bg-indigo-50 transition-colors duration-300"></div>
                        
                        <div className="relative z-10 p-6">
                          <div className="sm:flex items-start justify-between">
                            <div className="mb-4 sm:mb-0">
                              <div className="flex items-center">
                                <h3 className="text-xl font-bold text-gray-900 mr-3">{exam.examName}</h3>
                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${bgColor}`}>
                                  {percentage}%
                                </span>
                              </div>
                              <p className="text-gray-500 text-sm mt-1">Exam ID: {exam.examId}</p>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-indigo-600">{exam.totalQuestions}</div>
                                <p className="text-xs text-gray-500">Questions</p>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-2xl font-bold text-emerald-600">{exam.correctAnswers}</div>
                                <p className="text-xs text-gray-500">Correct</p>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-2xl font-bold text-amber-600">{exam.unAnsweredQuestions}</div>
                                <p className="text-xs text-gray-500">Unanswered</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`absolute top-0 left-0 h-full ${
                                  percentage >= 70 ? 'bg-emerald-500' :
                                  percentage >= 40 ? 'bg-amber-500' :
                                  'bg-rose-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            
                            <div className="flex justify-between mt-1">
                              <span className="text-xs text-gray-500">Score: {exam.totalMarksObtained}/{exam.totalQuestions}</span>
                              <span className="text-xs text-gray-500">
                                Performance: {
                                  percentage >= 70 ? 'Excellent' :
                                  percentage >= 40 ? 'Average' :
                                  'Needs Improvement'
                                }
                              </span>
                            </div>
                          </div>
                          
                          
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 relative">
                  {/* Background decoration */}
                  <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-50 rounded-full transform -translate-x-20 -translate-y-20"></div>
                  <div className="absolute bottom-0 right-0 w-40 h-40 bg-emerald-50 rounded-full transform translate-x-20 translate-y-20"></div>
                  
                  <div className="relative z-10">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
                      <Clipboard className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">No Exam Records Found</h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-8">
                      You haven't completed any exams yet. Your results will appear here once you finish your first exam.
                    </p>
                    <button className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm">
                      Browse Available Exams
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Floating scroll-to-top button */}
      {scrollPosition > 500 && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-8 right-8 z-50 w-10 h-10 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default UserProfile;