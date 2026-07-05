"use client";
import { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

import {
  Clock,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Award,
  Calendar,
  ClipboardList,
  Flag,
  Hourglass,
  Info,
  Rocket,
  Zap,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  FileText,
  Star,
  User,
  RefreshCw,
  ArrowUp
} from "lucide-react";
import Cookies from "js-cookie";
import {
  format,
  parseISO,
  isBefore,
  isAfter,
  differenceInSeconds,
} from "date-fns";
import { useRouter } from "next/navigation";
import {
  fetchExams,
  fetchQuestionSheet,
  submitExamAnswers,
  submitExamResult,
} from "../../../../apiCalls/manageExam";
import { useDashboard } from "../dashboardContext";

// Define all enums as proper TypeScript enums
enum ExamView {
  LIST = "list",
  RULES = "rules",
  QUESTIONS = "questions",
  RESULT = "result",
}

enum ExamStatus {
  CURRENT = "current",
  UPCOMING = "upComming", // Note: Consider fixing the spelling to "upcoming"
}

// Define proper interfaces with all required properties
interface Exam {
  _id: string;
  exam_id: string;
  title: string;
  description: string;
  exam_name: string;
  startDateTime: string;
  endDateTime: string;
  total_marks: number;
  pass_marks: number;
  question_sheet_id?: string;
  batches: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  status?: string;
  duration: number;
  negativeMarking: boolean;
  negativeMarkingNumber: Number;
}

interface Question {
  question: string;
  marks: number;
  answers: string[];
  _id: string;
}

interface QuestionSheet {
  _id: string;
  sheetName: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  negativeMarkingNumber: Number;
  __v: number;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface ExamResult {
  totalQuestions: number;
  correctAnswersCount: number;
  totalMarksObtained: number;
  totalPossibleMarks: number;
  percentage: number;
  examName: string | undefined;
  unAnsweredQuestions: number;
  answers: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    marksObtained: number;
    marksDeducted: number;
    isUnanswered?: boolean;
  }[];
}

// Define props interface for the CircularProgress component
interface CircularProgressProps {
  value: number;
  maxValue?: number;
  radius?: number;
  strokeWidth?: number;
  color?: string;
  textColor?: string;
}

export default function ExamPortal() {
  const [currentView, setCurrentView] = useState<ExamView>(ExamView.LIST);
  const router = useRouter();
  const [currentExams, setCurrentExams] = useState<Exam[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [questionSheet, setQuestionSheet] = useState<QuestionSheet | null>(null);
  const [currentPagination, setCurrentPagination] = useState<PaginationData | null>(null);
  const [upcomingPagination, setUpcomingPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<ExamStatus>(ExamStatus.CURRENT);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [scrollPosition, setScrollPosition] = useState(0);
  const limit = 10;
  const {
    isDashboardDisabled,
    disableDashboard,
    enableDashboard
  } = useDashboard();

  useEffect(() => {
    const userCookie = Cookies.get("user");
    if (!userCookie) {
      console.error("User cookie not found");
      return;
    }

    try {
      const { batch, id } = JSON.parse(userCookie);
      if (batch && id) {
        loadExams(currentPage, upcomingPage, batch, id);
      }
    } catch (err) {
      console.error("Error parsing user cookie", err);
      setError("Failed to load user data. Please try again.");
    }
  }, [currentPage, upcomingPage, activeTab]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const loadExams = async (
    currentPage: number,
    upcomingPage: number,
    batch: string,
    id: string
  ) => {
    try {
      setLoading(true);

      // Fetch current exams
      const currentData = await fetchExams({
        batch,
        id,
        page: currentPage,
        limit,
        status: ExamStatus.CURRENT,
      });
      setCurrentExams(currentData.data);
      setCurrentPagination(currentData.pagination);

      // Fetch upcoming exams
      const upcomingData = await fetchExams({
        batch,
        id,
        page: upcomingPage,
        limit,
        status: ExamStatus.UPCOMING,
      });
      setUpcomingExams(upcomingData.data);
      setUpcomingPagination(upcomingData.pagination);

      setError(null);
    } catch (err) {
      setError("Failed to load exams. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionSheet = async (id: string) => {
    try {
      setLoading(true);
      const data = await fetchQuestionSheet(id);
      setQuestionSheet(data.data);
      setError(null);
    } catch (err) {
      setError("Failed to load exam questions. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number, isUpcoming: boolean = false) => {
    if (isUpcoming) {
      if (
        newPage < 1 ||
        (upcomingPagination && newPage > upcomingPagination.totalPages)
      )
        return;
      setUpcomingPage(newPage);
    } else {
      if (
        newPage < 1 ||
        (currentPagination && newPage > currentPagination.totalPages)
      )
        return;
      setCurrentPage(newPage);
    }
  };

  const handleBeginExam = (exam: Exam) => {
    if (!exam.question_sheet_id) {
      toast.error("Question sheet not available for this exam.");
      return;
    }
    setSelectedExam(exam);
    setCurrentView(ExamView.RULES);
  };

  const startExam = async () => {
    if (!selectedExam?.question_sheet_id) return;
    await loadQuestionSheet(selectedExam.question_sheet_id);
    disableDashboard();
    setTimeLeft(selectedExam.duration * 60);
    setCurrentView(ExamView.QUESTIONS);
  };

  const handleAnswerChange = (questionId: string, answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!questionSheet || !selectedExam) return;

    try {
      setSubmitting(true);

      // Submit answers to get correct answers
      const response = await submitExamAnswers(questionSheet._id);

      // Calculate result
      const calculatedResult = calculateResult(
        questionSheet,
        answers,
        response.data,
        selectedExam.negativeMarking,
        selectedExam.negativeMarkingNumber
      );

      setResult(calculatedResult);

      // Submit final result to backend
      await submitExamResult(selectedExam._id, calculatedResult);
      setCurrentView(ExamView.RESULT);
      enableDashboard()
      toast.success("Exam submitted successfully!");
    } catch (err) {
      toast.error("Failed to submit answers. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateResult = (
    questionSheet: QuestionSheet,
    userAnswers: Record<string, number>,
    correctAnswersData: any,
    negativeMarking: boolean,
    negativeMarkingNumber: any
  ): ExamResult => {
    let correctAnswersCount = 0;
    let totalMarksObtained = 0;
    let unAnsweredQuestions = 0;
    const totalPossibleMarks = questionSheet.questions.reduce(
      (sum, q) => sum + q.marks,
      0
    );

    const answersDetail = questionSheet.questions.map((q) => {
      const userAnswerIndex = userAnswers[q._id] ?? -1;
      let userAnswer = "Not answered";
      let isUnanswered = false;

      // Check if answer is empty (unanswered)
      if (userAnswerIndex === -1) {
        isUnanswered = true;
        unAnsweredQuestions++;
      } else {
        userAnswer = q.answers[userAnswerIndex] || "Not answered";
      }

      // Find correct answer from the response
      const correctAnswerData = correctAnswersData.questions.find(
        (qa: any) => qa._id === q._id
      );
      const correctAnswer = correctAnswerData?.correctAnswer || "";

      const isCorrect = userAnswer === correctAnswer;
      let marksObtained = 0;
      let marksDeducted = 0;

      if (isCorrect) {
        marksObtained = q.marks;
        correctAnswersCount++;
      } else if (negativeMarking && userAnswerIndex >= 0 && !isUnanswered) {
        // Only apply negative marking for answered (but incorrect) questions
        marksDeducted = q.marks * (negativeMarkingNumber / 100);
      }

      totalMarksObtained += marksObtained - marksDeducted;

      return {
        question: q.question,
        userAnswer,
        correctAnswer,
        marksObtained,
        marksDeducted,
        isUnanswered,
      };
    });

    const percentage = (totalMarksObtained / totalPossibleMarks) * 100;

    return {
      totalQuestions: questionSheet.questions.length,
      correctAnswersCount,
      totalMarksObtained,
      totalPossibleMarks,
      percentage,
      unAnsweredQuestions,
      answers: answersDetail,
      examName: selectedExam?.exam_name || selectedExam?.title || "Exam",
    };
  };

  const toggleQuestionExpand = (questionId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const downloadResult = () => {
    if (!result || !selectedExam) return;

    const content = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${selectedExam.exam_name} - Exam Result</title>
            <style>
              
              body {
                font-family: 'Inter', sans-serif;
                line-height: 1.6;
                color: #1e293b;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8fafc;
              }
              .header {
                text-align: center;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 1px solid #e2e8f0;
                position: relative;
              }
              .header::after {
                content: '';
                position: absolute;
                bottom: -1px;
                left: 30%;
                right: 30%;
                height: 3px;
                background: linear-gradient(to right, #4338ca, #6d28d9);
                border-radius: 3px;
              }
              .header h1 {
                font-family: 'Raleway', sans-serif;
                color: #0f172a;
                margin-bottom: 8px;
                font-weight: 700;
                letter-spacing: -0.025em;
              }
              .header p {
                color: #64748b;
                margin-top: 0;
                font-size: 16px;
              }
              .summary {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-bottom: 40px;
              }
              .summary-card {
                background: #ffffff;
                border-radius: 12px;
                padding: 24px;
                text-align: center;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                border-top: 4px solid;
                transition: transform 0.2s, box-shadow 0.2s;
              }
              .summary-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
              }
              .summary-card h3 {
                margin: 0 0 8px 0;
                font-size: 14px;
                color: #64748b;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              .summary-card .value {
                font-size: 32px;
                font-weight: bold;
                color: #0f172a;
                font-family: 'Raleway', sans-serif;
              }
              .breakdown-title {
                color: #0f172a;
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 12px;
                margin: 50px 0 25px 0;
                font-size: 20px;
                font-family: 'Raleway', sans-serif;
                font-weight: 600;
                position: relative;
              }
              .breakdown-title::after {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 0;
                width: 60px;
                height: 2px;
                background: linear-gradient(to right, #4338ca, #6d28d9);
              }
              .question {
                margin-bottom: 24px;
                padding: 24px;
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                transition: transform 0.2s;
                border-left: 4px solid;
              }
              .question.correct {
                border-color: #0d9488;
              }
              .question.incorrect {
                border-color: #ef4444;
              }
              .question:hover {
                transform: translateY(-2px);
              }
              .indicator {
                display: inline-block;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                margin-left: 10px;
              }
              .correct {
                background: #0d9488;
              }
              .incorrect {
                background: #ef4444;
              }
              .answer-label {
                display: inline-block;
                font-size: 14px;
                font-weight: 600;
                color: white;
                margin-right: 8px;
                min-width: 100px;
              }
              .footer {
                text-align: center;
                margin-top: 60px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                color: #64748b;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${selectedExam.exam_name}</h1>
              <p>Exam Result Summary</p>
            </div>
            
            <div class="summary">
              <div class="summary-card" style="border-color: #4338ca">
                <h3>Total Marks</h3>
                <div class="value">${result.totalMarksObtained.toFixed(1)}/${result.totalPossibleMarks}</div>
              </div>
              <div class="summary-card" style="border-color: #0d9488">
                <h3>Percentage</h3>
                <div class="value">${result.percentage.toFixed(1)}%</div>
              </div>
              <div class="summary-card" style="border-color: #8b5cf6">
                <h3>Correct Answers</h3>
                <div class="value">${result.correctAnswersCount}/${result.totalQuestions}</div>
              </div>
            </div>
            
            <h3 class="breakdown-title">Question-wise Breakdown</h3>
            
            ${result.answers.map((answer, index) => `
              <div class="question ${answer.marksObtained > 0 ? 'correct' : 'incorrect'}">
                <strong style="font-size: 18px; color: #0f172a;">${index + 1}. ${answer.question}</strong>
                <span class="indicator ${answer.marksObtained > 0 ? "correct" : "incorrect"}"></span>
                
                <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                  <div>
                    <span class="answer-label">Your Answer:</span>
                    <span style="font-weight: ${answer.marksObtained > 0 ? '600' : '400'}; color: ${answer.marksObtained > 0 ? 'white' : 'white'};">
                      ${answer.userAnswer || "Not answered"}
                    </span>
                  </div>
                  
                  <div>
                    <span class="answer-label">Correct Answer:</span>
                    <span style="font-weight: 600; color: white;">
                      ${answer.correctAnswer}
                    </span>
                  </div>
                  
                  <div>
                    <span class="answer-label">Marks Obtained:</span>
                    <span style="font-weight: 600; color: white;">
                      ${answer.marksObtained}
                    </span>
                  </div>
                  
                  ${answer.marksDeducted > 0 ? `
                    <div>
                      <span class="answer-label" style="color: white;">Marks Deducted:</span>
                      <span style="font-weight: 600; color: white;">
                        -${answer.marksDeducted}
                      </span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
            
            <div class="footer">
              <p>Generated on ${new Date().toLocaleString()}</p>
              <p>© 2025 Dragon Portal System</p>
            </div>
          </body>
          </html>
        `;

    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedExam.exam_name}_result.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (currentView === ExamView.QUESTIONS && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentView, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const calculateProgress = () => {
    if (!selectedExam) return 0;
    const totalDuration = selectedExam.duration * 60;
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  // Custom circular progress component with proper TypeScript typing
  const CircularProgress: React.FC<CircularProgressProps> = ({
    value = 0,
    maxValue = 100,
    radius = 50,
    strokeWidth = 10,
    color = "#4338ca",
    textColor = "#0f172a",
  }) => {
    const normalizedValue = Math.min(Math.max(value, 0), maxValue);
    const percentage = (normalizedValue / maxValue) * 100;

    // SVG parameters
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center group">
        <svg
          width={(radius + strokeWidth) * 2}
          height={(radius + strokeWidth) * 2}
          className="transform -rotate-90 transition-all duration-1000"
        >
          {/* Background Circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
          />

          {/* Progress Circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Percentage Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-xl font-bold transition-all duration-700"
            style={{ color: textColor }}
          >
            {percentage.toFixed(0)}%
          </span>
        </div>

        {/* Hover effect - subtle pulse animation */}
        <div className="absolute inset-0 rounded-full bg-transparent group-hover:bg-gray-50/30 transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
      </div>
    );
  };

  // Redesigned Exam Cards
  const renderExamCards = (exams: Exam[], isUpcoming: boolean = false) => {
    return exams.map((exam) => (
      <div
        key={exam._id}
        className="p-4 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-all duration-200"
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {exam.exam_name}
              {isUpcoming && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Upcoming
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500">{exam.title}</p>
          </div>
          <div className="text-indigo-600">
            <BookOpen className="h-4 w-4" />
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {exam.description}
        </p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-600">
              {exam.startDateTime}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-600">
              {exam.startDateTime}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-600">
              Total: {exam.total_marks}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Flag className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-600">
              Passing: {exam.pass_marks}
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => handleBeginExam(exam)}
            disabled={!exam.question_sheet_id || isUpcoming}
            className={
              !isUpcoming && exam.question_sheet_id
                ? "bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1.5"
                : "bg-gray-100 text-gray-500 text-sm px-3 py-1.5"
            }
          >
            {isUpcoming ? (
              <span className="flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Coming Soon
              </span>
            ) : exam.question_sheet_id ? (
              <span className="flex items-center">
                <Rocket className="h-3.5 w-3.5 mr-1.5" />
                Begin Exam
              </span>
            ) : (
              "Not Available"
            )}
          </Button>
        </div>
      </div>
    ));
  };

  // Enhanced skeletons for loading state with subtle animation
  const renderSkeletons = () => (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="border border-l-4 border-l-indigo-200 rounded-xl p-6 bg-white shadow-sm"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className="flex justify-between">
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-100 rounded-lg w-32 animate-pulse"></div>
            </div>
            <div className="h-10 w-10 bg-indigo-100 rounded-full animate-pulse"></div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="h-4 bg-gray-100 rounded-lg w-full animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded-lg w-full animate-pulse"></div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded-lg w-20 animate-pulse"></div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <div className="h-9 w-28 bg-indigo-100 rounded-lg animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Loading State with branded appearance
  if (
    loading &&
    currentView === ExamView.LIST &&
    !currentExams.length &&
    !upcomingExams.length
  ) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="mb-8">
          <div className="h-10 bg-indigo-100 rounded-lg w-1/4 animate-pulse"></div>
          <div className="h-5 mt-3 bg-gray-100 rounded-lg w-2/4 animate-pulse"></div>
        </div>
        {renderSkeletons()}

        {/* Enhanced loading indicator */}
        <div className="flex justify-center items-center mt-12">
          <div className="relative">
            <div className="w-12 h-12 rounded-full absolute border-4 border-gray-200"></div>
            <div className="w-12 h-12 rounded-full animate-spin absolute border-4 border-indigo-600 border-t-transparent"></div>
          </div>
          <span className="ml-4 text-gray-700 font-medium">Loading exam data...</span>
        </div>
      </div>
    );
  }

  // Error State with more appealing visualization
  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <Alert variant="destructive" className="mb-6 rounded-xl border-rose-200 bg-rose-50">
          <AlertCircle className="h-5 w-5 text-rose-600" />
          <AlertTitle className="text-rose-800 font-semibold">An error occurred</AlertTitle>
          <AlertDescription className="text-rose-700">{error}</AlertDescription>
        </Alert>
        <Button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg transition-all"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Results View with enhanced visuals and animations
  if (currentView === ExamView.RESULT && result && selectedExam) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 min-h-screen ">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-all hover:shadow-xl">
          {/* Header with enhanced gradient background */}
          <div className=" px-6 py-8 text-white relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-32 -translate-y-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full transform -translate-x-24 translate-y-24"></div>

            <div className="flex justify-between items-center relative z-10">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-black">Exam Results</h1>
                <p className="text-black mt-1">{selectedExam.exam_name}</p>
              </div>
              <Button
                onClick={downloadResult}
                variant="outline"
                className="bg-indigo-600 hover:bg-indigo-400 text-white border-white/20 transition-all hover:scale-105"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Result
              </Button>
            </div>
          </div>

          <div className="p-6">
            {/* Performance Summary with enhanced visuals */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl border border-indigo-100 hover:shadow-md transition-all hover:translate-y-[-2px]">
                <p className="text-sm text-indigo-700 font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-1.5" />
                  Total Marks
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {result.totalMarksObtained.toFixed(1)}{" "}
                  <span className="text-sm text-gray-500">
                    / {result.totalPossibleMarks}
                  </span>
                </p>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-5 rounded-xl border border-teal-100 hover:shadow-md transition-all hover:translate-y-[-2px]">
                <p className="text-sm text-teal-700 font-medium flex items-center">
                  <Award className="h-4 w-4 mr-1.5" />
                  Percentage
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {result.percentage.toFixed(1)}%
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-100 hover:shadow-md transition-all hover:translate-y-[-2px]">
                <p className="text-sm text-purple-700 font-medium flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Correct Answers
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {result.correctAnswersCount}{" "}
                  <span className="text-sm text-gray-500">
                    / {result.totalQuestions}
                  </span>
                </p>
              </div>

              <div
                className={`p-5 rounded-xl border transition-all hover:translate-y-[-2px] hover:shadow-md ${result.percentage >= selectedExam.pass_marks
                  ? "bg-gradient-to-br from-teal-50 to-teal-100 border-teal-100"
                  : "bg-gradient-to-br from-rose-50 to-rose-100 border-rose-100"
                  }`}
              >
                <p
                  className={`text-sm font-medium flex items-center ${result.percentage >= selectedExam.pass_marks
                    ? "text-teal-700"
                    : "text-rose-700"
                    }`}
                >
                  <Star className="h-4 w-4 mr-1.5" />
                  Status
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1 flex items-center">
                  {result.percentage >= selectedExam.pass_marks ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-teal-600 mr-2" />
                      Passed
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-rose-600 mr-2" />
                      Failed
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Visual performance summary with enhanced visuals */}
            <div className="mb-10 flex flex-col md:flex-row items-center justify-around bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="text-center mb-6 md:mb-0 transition-transform hover:scale-105">
                <CircularProgress
                  value={result.percentage}
                  color={
                    result.percentage >= selectedExam.pass_marks
                      ? "#0d9488"
                      : "#ef4444"
                  }
                  radius={55}
                />
                <p className="mt-4 text-gray-900 font-medium">Overall Score</p>
              </div>

              <div className="text-center mb-6 md:mb-0 transition-transform hover:scale-105">
                <CircularProgress
                  value={
                    (result.correctAnswersCount / result.totalQuestions) * 100
                  }
                  color="#8b5cf6"
                  radius={55}
                />
                <p className="mt-4 text-gray-900 font-medium">Accuracy</p>
              </div>

              <div className="text-center transition-transform hover:scale-105">
                <CircularProgress
                  value={
                    ((result.totalQuestions - result.unAnsweredQuestions) /
                      result.totalQuestions) *
                    100
                  }
                  color="#4338ca"
                  radius={55}
                />
                <p className="mt-4 text-gray-900 font-medium">Completion</p>
              </div>
            </div>

            {/* Results breakdown with enhanced styling */}
            <div className="bg-gradient-to-b from-gray-50 to-white p-6 rounded-xl border border-gray-100 mx-auto">
              <h2 className="text-xl font-semibold mb-6 text-gray-900 flex items-center">
                <ClipboardList className="h-5 w-5 mr-2 text-indigo-600" />
                Question-wise Breakdown
              </h2>
              <div className="space-y-4">
                {result.answers.map((answer, index) => (
                  <div
                    key={index}
                    className="bg-white border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md"
                  >
                    <button
                      className="w-full flex justify-between items-center p-4 hover:bg-gray-50 transition-colors"
                      onClick={() => toggleQuestionExpand(`question-${index}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-white ${answer.userAnswer === answer.correctAnswer
                            ? "bg-gradient-to-r from-teal-600 to-teal-500"
                            : "bg-gradient-to-r from-rose-600 to-rose-500"
                            }`}
                        >
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-900 line-clamp-1">
                          {answer.question}
                        </span>
                      </div>
                      {expandedQuestions[`question-${index}`] ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {expandedQuestions[`question-${index}`] && (
                      <div className="p-4 pt-0 border-t bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-white rounded-xl border border-gray-100 transition-all hover:shadow-sm">
                            <p className="text-sm text-gray-500 mb-1 flex items-center">
                              <span className="inline-block h-2 w-2 rounded-full bg-gray-300 mr-2"></span>
                              Your Answer
                            </p>
                            <p
                              className={`font-medium ${answer.userAnswer === answer.correctAnswer
                                ? "text-teal-600"
                                : "text-rose-600"
                                }`}
                            >
                              {answer.userAnswer !== "Not answered" ? (
                                answer.userAnswer
                              ) : (
                                <span className="italic text-gray-400">
                                  Not attempted
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border border-gray-100 transition-all hover:shadow-sm">
                            <p className="text-sm text-gray-500 mb-1 flex items-center">
                              <span className="inline-block h-2 w-2 rounded-full bg-teal-300 mr-2"></span>
                              Correct Answer
                            </p>
                            <p className="font-medium text-teal-600">
                              {answer.correctAnswer}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="p-4 bg-white rounded-xl border border-gray-100 transition-all hover:shadow-sm">
                            <p className="text-sm text-gray-500 mb-1 flex items-center">
                              <span className="inline-block h-2 w-2 rounded-full bg-indigo-300 mr-2"></span>
                              Marks Obtained
                            </p>
                            <p className="font-medium text-gray-900">
                              {answer.marksObtained}
                            </p>
                          </div>
                          {answer.marksDeducted > 0 && (
                            <div className="p-4 bg-white rounded-xl border border-gray-100 transition-all hover:shadow-sm">
                              <p className="text-sm text-gray-500 mb-1 flex items-center">
                                <span className="inline-block h-2 w-2 rounded-full bg-rose-300 mr-2"></span>
                                Marks Deducted
                              </p>
                              <p className="font-medium text-rose-600">
                                -{answer.marksDeducted}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 p-6 flex justify-end">
              <Button
                onClick={() => router.push("/dashboard/studentsCourse")}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg transition-all"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rules View with enhanced design
  if (currentView === ExamView.RULES && selectedExam) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 min-h-screen ">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-all hover:shadow-xl">
          {/* Header with enhanced gradient background */}
          <div className=" px-6 py-8 text-white relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-32 -translate-y-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full transform -translate-x-24 translate-y-24"></div>

            <div className="flex items-center space-x-3 relative z-10">
              <BookOpen className="h-6 w-6" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-black">{selectedExam.exam_name}</h1>
                <p className="text-black mt-1">{selectedExam.title}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2 mb-8">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl border border-indigo-100 flex items-start space-x-3 hover:shadow-md transition-all hover:translate-y-[-2px]">
                <Calendar className="h-5 w-5 mt-0.5 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Exam Schedule
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(
                      parseISO(selectedExam.startDateTime),
                      "MMMM d, yyyy"
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(parseISO(selectedExam.startDateTime), "h:mm a")} -{" "}
                    {format(parseISO(selectedExam.endDateTime), "h:mm a")}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-100 flex items-start space-x-3 hover:shadow-md transition-all hover:translate-y-[-2px]">
                <Award className="h-5 w-5 mt-0.5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Marks Distribution
                  </p>
                  <p className="text-sm text-gray-600">
                    Total: {selectedExam.total_marks} marks
                  </p>
                  <p className="text-sm text-gray-600">
                    Passing: {selectedExam.pass_marks} marks (
                    {Math.round(
                      (selectedExam.pass_marks / selectedExam.total_marks) * 100
                    )}
                    %)
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-5 rounded-xl border border-teal-100 flex items-start space-x-3 hover:shadow-md transition-all hover:translate-y-[-2px]">
                <Hourglass className="h-5 w-5 mt-0.5 text-teal-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Time Allocation
                  </p>
                  <p className="text-sm text-gray-600">
                    Duration: {Math.floor(selectedExam.duration)} minutes
                  </p>
                  <p className="text-sm text-gray-600">
                    Time per question: ~
                    {Math.round((selectedExam.duration * 60) / 20)} seconds
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-xl border border-amber-100 flex items-start space-x-3 hover:shadow-md transition-all hover:translate-y-[-2px]">
                <Info className="h-5 w-5 mt-0.5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Marking Scheme
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedExam.negativeMarking
                      ? `Negative marking applied (${selectedExam.negativeMarkingNumber}% penalty)`
                      : "No negative marking"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Unanswered questions: No marks deducted
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              <div className="border-l-4 border-indigo-600 bg-gradient-to-r from-indigo-50 to-white p-5 rounded-r-xl shadow-sm">
                <h3 className="font-medium text-gray-900 flex items-center space-x-2 mb-4">
                  <ClipboardList className="h-5 w-5 text-indigo-600" />
                  <span>Exam Rules & Instructions</span>
                </h3>

                <ul className="space-y-4 text-gray-700">
                  <li className="flex items-start space-x-3 group">
                    <CheckCircle className="h-5 w-5 mt-0.5 text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-gray-900 transition-colors">
                      All questions are mandatory. Answer as many as you can.
                    </span>
                  </li>
                  <li className="flex items-start space-x-3 group">
                    <CheckCircle className="h-5 w-5 mt-0.5 text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-gray-900 transition-colors">
                      The exam will auto-submit when the timer expires.
                    </span>
                  </li>
                  <li className="flex items-start space-x-3 group">
                    <CheckCircle className="h-5 w-5 mt-0.5 text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-gray-900 transition-colors">
                      Do not refresh the page or navigate away during the exam.
                    </span>
                  </li>
                  <li className="flex items-start space-x-3 group">
                    <CheckCircle className="h-5 w-5 mt-0.5 text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-gray-900 transition-colors">
                      Each question may carry different mark values.
                    </span>
                  </li>
                  {selectedExam.negativeMarking && (
                    <li className="flex items-start space-x-3 group">
                      <CheckCircle className="h-5 w-5 mt-0.5 text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="group-hover:text-gray-900 transition-colors">
                        Incorrect answers will result in 25% negative marking.
                      </span>
                    </li>
                  )}
                  <li className="flex items-start space-x-3 group">
                    <CheckCircle className="h-5 w-5 mt-0.5 text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="group-hover:text-gray-900 transition-colors">
                      Your results will be displayed immediately after
                      submission.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-white border-l-4 border-amber-500 p-5 rounded-r-xl shadow-sm">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Important Note</p>
                    <p className="text-gray-700">
                      Once you start the exam, the timer cannot be paused.
                      Ensure you have a stable internet connection and
                      sufficient time to complete the exam.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentView(ExamView.LIST)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Exams
              </Button>
              <Button
                onClick={startExam}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg transition-all px-6"
              >
                <Flag className="h-4 w-4 mr-2" />
                Start Exam
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Questions View with enhanced UI
  if (currentView === ExamView.QUESTIONS && questionSheet && selectedExam) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-6 pb-12">
        {/* Fixed header with timer and enhanced styling */}
        <div
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 shadow-md ${scrollPosition > 10
            ? "py-2 bg-white/95 backdrop-blur-md border-b border-gray-100"
            : "py-4 bg-white"
            }`}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-lg font-bold text-gray-900 truncate max-w-xs sm:max-w-sm">
                  {questionSheet.sheetName}
                </h1>
                <p className="text-sm text-gray-500 truncate max-w-xs sm:max-w-sm">
                  {selectedExam.title}
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="hidden md:block">
                  <Progress
                    value={calculateProgress()}
                    className="h-2 w-32 bg-gray-200"
                  />
                </div>
                <div
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${timeLeft < 300
                    ? "bg-gradient-to-r from-rose-50 to-rose-100 text-rose-600"
                    : "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-600"
                    } shadow-sm`}
                >
                  <Hourglass
                    className={`h-5 w-5 ${timeLeft < 300
                      ? "animate-pulse text-rose-600"
                      : "text-indigo-600"
                      }`}
                  />
                  <span className="font-bold">{formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>
            <div className="md:hidden mt-2">
              <Progress
                value={calculateProgress()}
                className="h-1.5 bg-gray-200"
              />
            </div>
          </div>
        </div>

        <div className="pt-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {questionSheet.questions.map((question, index) => (
              <div
                key={question._id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-indigo-100"
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white mr-3 shadow-sm">
                      {index + 1}
                    </span>
                    Question
                    <span className="ml-3 px-2.5 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-md font-medium">
                      {question.marks} {question.marks === 1 ? "mark" : "marks"}
                    </span>
                  </h2>
                  {answers[question._id] !== undefined ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-teal-100 to-teal-50 text-teal-800 border border-teal-200 shadow-sm">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Answered
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 shadow-sm">
                      Not answered
                    </span>
                  )}
                </div>

                <p className="mb-6 text-gray-800 text-lg leading-relaxed">
                  {question.question}
                </p>

                <RadioGroup
                  value={answers[question._id]?.toString() || ""}
                  onValueChange={(value) =>
                    handleAnswerChange(question._id, parseInt(value))
                  }
                >
                  <div className="space-y-3">
                    {question.answers.map((answer, ansIndex) => (
                      <div
                        key={ansIndex}
                        className={`flex items-center space-x-3 p-4 rounded-xl border transition-all duration-200 ${answers[question._id] === ansIndex
                          ? "border-indigo-200 bg-gradient-to-r from-indigo-50 to-white shadow-sm"
                          : "border-gray-200 hover:bg-gray-50"
                          }`}
                      >
                        <RadioGroupItem
                          value={ansIndex.toString()}
                          id={`${question._id}-${ansIndex}`}
                          className={`h-5 w-5 ${answers[question._id] === ansIndex
                            ? "text-indigo-600"
                            : ""
                            }`}
                        />
                        <Label
                          htmlFor={`${question._id}-${ansIndex}`}
                          className="text-base font-normal cursor-pointer flex-grow"
                        >
                          {answer}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            ))}
          </div>

          <div className="sticky bottom-0 bg-white shadow-lg border border-gray-100 mt-8 p-5 rounded-t-xl bg-gradient-to-r from-white to-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div className="mb-4 sm:mb-0 text-center sm:text-left">
                <div className="text-sm text-gray-500 mb-1">
                  Question Progress
                </div>
                <div className="flex items-center space-x-3">
                  <Progress
                    value={
                      (Object.keys(answers).length /
                        questionSheet.questions.length) *
                      100
                    }
                    className="h-2 w-32 bg-gray-200"
                  />
                  <span className="text-sm font-medium">
                    {Object.keys(answers).length} of{" "}
                    {questionSheet.questions.length}
                  </span>
                </div>
              </div>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to exit? Your progress will be lost."
                      )
                    ) {
                      setCurrentView(ExamView.LIST);
                      enableDashboard()
                    }
                  }}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  Exit Exam
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg transition-all min-w-[150px]"
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </div>
                  ) : (
                    "Submit Exam"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Exam List View with enhanced UI
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header section with semi-transparent effect on scroll */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollPosition > 50
          ? "py-3 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100"
          : "py-6 bg-transparent"
          }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1
              className={`font-bold tracking-tight ${scrollPosition > 50 ? "text-xl" : "text-3xl"
                } transition-all duration-300 bg-gradient-to-r from-indigo-700 to-purple-600 bg-clip-text text-transparent`}
            >

            </h1>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setActiveTab(ExamStatus.CURRENT)}
                className={`text-sm font-medium transition-all duration-200 ${activeTab === ExamStatus.CURRENT
                  ? "text-indigo-600 border-b-2 border-indigo-600 pb-1"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Current Exams
              </button>
              <button
                onClick={() => setActiveTab(ExamStatus.UPCOMING)}
                className={`text-sm font-medium transition-all duration-200 ${activeTab === ExamStatus.UPCOMING
                  ? "text-indigo-600 border-b-2 border-indigo-600 pb-1"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Upcoming Exams
              </button>
              <div className="rounded-full h-9 w-9 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-center font-medium text-sm shadow-sm hover:shadow-md transition-all">
                <User className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-32 pb-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          renderSkeletons()
        ) : (
          <>
            {/* Current Exams Section */}
            {activeTab === ExamStatus.CURRENT && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-indigo-600" />
                    Current Exams
                    <span className="ml-2 text-sm bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 shadow-sm">
                      {currentExams.length} available
                    </span>
                  </h2>
                </div>

                {currentExams.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full mb-4">
                      <BookOpen className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Active Exams
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                      There are currently no active exams for your batch. Check
                      back later or view upcoming exams.
                    </p>
                    <Button
                      onClick={() => setActiveTab(ExamStatus.UPCOMING)}
                      className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Rocket className="h-4 w-4 mr-2" />
                      View Upcoming Exams
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      {renderExamCards(currentExams)}
                    </div>

                    {currentPagination && currentPagination.totalPages > 1 && (
                      <div className="flex justify-center pt-8">
                        <div className="flex space-x-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                          <Button
                            variant="outline"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Previous
                          </Button>

                          {Array.from(
                            {
                              length: Math.min(5, currentPagination.totalPages),
                            },
                            (_, i) => {
                              let pageNum;
                              if (currentPagination.totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (
                                currentPage >=
                                currentPagination.totalPages - 2
                              ) {
                                pageNum = currentPagination.totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }

                              return (
                                <Button
                                  key={pageNum}
                                  variant={
                                    currentPage === pageNum
                                      ? "default"
                                      : "outline"
                                  }
                                  onClick={() => handlePageChange(pageNum)}
                                  className={
                                    currentPage === pageNum
                                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-sm"
                                      : "border-gray-300 hover:bg-gray-50"
                                  }
                                >
                                  {pageNum}
                                </Button>
                              );
                            }
                          )}

                          <Button
                            variant="outline"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={
                              currentPage === currentPagination.totalPages
                            }
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Upcoming Exams Section */}
            {activeTab === ExamStatus.UPCOMING && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-indigo-600" />
                    Upcoming Exams
                    <span className="ml-2 text-sm bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200 shadow-sm">
                      {upcomingExams.length} scheduled
                    </span>
                  </h2>
                </div>

                {upcomingExams.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full mb-4">
                      <Calendar className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No Upcoming Exams
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                      There are currently no upcoming exams scheduled
                      for your batch. Check back later.
                    </p>
                    <Button
                      onClick={() => setActiveTab(ExamStatus.CURRENT)}
                      className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      View Current Exams
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 gap-6">
                      {renderExamCards(upcomingExams, true)}
                    </div>

                    {upcomingPagination && upcomingPagination.totalPages > 1 && (
                      <div className="flex justify-center pt-8">
                        <div className="flex space-x-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                          <Button
                            variant="outline"
                            onClick={() => handlePageChange(upcomingPage - 1, true)}
                            disabled={upcomingPage === 1}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Previous
                          </Button>

                          {Array.from(
                            {
                              length: Math.min(5, upcomingPagination.totalPages),
                            },
                            (_, i) => {
                              let pageNum;
                              if (upcomingPagination.totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (upcomingPage <= 3) {
                                pageNum = i + 1;
                              } else if (
                                upcomingPage >= upcomingPagination.totalPages - 2
                              ) {
                                pageNum = upcomingPagination.totalPages - 4 + i;
                              } else {
                                pageNum = upcomingPage - 2 + i;
                              }

                              return (
                                <Button
                                  key={pageNum}
                                  variant={upcomingPage === pageNum ? "default" : "outline"}
                                  onClick={() => handlePageChange(pageNum, true)}
                                  className={
                                    upcomingPage === pageNum
                                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-sm"
                                      : "border-gray-300 hover:bg-gray-50"
                                  }
                                >
                                  {pageNum}
                                </Button>
                              );
                            }
                          )}

                          <Button
                            variant="outline"
                            onClick={() => handlePageChange(upcomingPage + 1, true)}
                            disabled={upcomingPage === upcomingPagination.totalPages}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Enhanced portal stats with more visually appealing design */}
            {!loading && activeTab === ExamStatus.CURRENT && currentExams.length > 0 && (
              <div className="mt-12 bg-white  p-6  border border-gray-100  transition-all duration-300">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                  Exam Portal Insights
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-5 flex items-center border border-indigo-100 hover:shadow-md transition-all hover:translate-y-[-2px] group">
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-3 rounded-full mr-4 text-white shadow-sm group-hover:scale-110 transition-transform">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Active Exams</p>
                      <p className="text-2xl font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {currentExams.length}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl p-5 flex items-center border border-teal-100 hover:shadow-md transition-all hover:translate-y-[-2px] group">
                    <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-3 rounded-full mr-4 text-white shadow-sm group-hover:scale-110 transition-transform">
                      <Rocket className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Upcoming Exams</p>
                      <p className="text-2xl font-bold text-gray-900 group-hover:text-teal-700 transition-colors">
                        {upcomingExams.length}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-5 flex items-center border border-purple-100 hover:shadow-md transition-all hover:translate-y-[-2px] group">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 rounded-full mr-4 text-white shadow-sm group-hover:scale-110 transition-transform">
                      <Star className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Highest Marks</p>
                      <p className="text-2xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                        {currentExams.length > 0
                          ? Math.max(...currentExams.map(exam => exam.total_marks))
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Last updated at {new Date().toLocaleTimeString()}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 transition-all"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Enhanced floating back-to-top button with animation */}
        {scrollPosition > 300 && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all hover:shadow-xl hover:scale-110"
            aria-label="Back to top"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            color: '#0F172A',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #E2E8F0',
            padding: '16px'
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
          }
        }}
      />
    </div>
  );
}