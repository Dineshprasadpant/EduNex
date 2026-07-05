"use client";

import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { motion, AnimatePresence, Variants} from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "react-hot-toast";
import {fetchQuestionSheet,  updateQuestionSheet,  deleteQuestionSheet} from "../../../../apiCalls/manageQuestions"
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  ArrowLeft,
  ArrowRight,
  FileText,
  Clock,
  ClipboardList,
  Filter,
  Settings,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Info,
  Save,
  CheckCircle,
  XCircle,
  Shuffle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function ManageQuestionSheetsPage() {
  // Types
  interface Question {
    question: string;
    correctAnswer: string;
    answers: string[];
    marks?: number;
  }

  interface QuestionSheet {
    _id: string;
    sheetName: string;
    questions: Question[];
    createdAt?: string;
    updatedAt?: string;
  }

  // State variables
  const [questionSheets, setQuestionSheets] = useState<QuestionSheet[]>([]);
  const [filteredSheets, setFilteredSheets] = useState<QuestionSheet[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Sheet management state
  const [activeTab, setActiveTab] = useState("library");
  const [selectedSheet, setSelectedSheet] = useState<QuestionSheet | null>(null);
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"student" | "teacher">("student");
  const [showPreview, setShowPreview] = useState(false);

  // Question management state
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question: "",
    correctAnswer: "",
    answers: ["", "", "", ""],
    marks: 1,
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  
  // Delete state
  const [isDeleteSheetDialogOpen, setIsDeleteSheetDialogOpen] = useState(false);
  const [isDeleteQuestionDialogOpen, setIsDeleteQuestionDialogOpen] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState<string | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<{sheetId: string, index: number} | null>(null);
  const [confirmDelete, setConfirmDelete] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);


  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

 const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100 } },
};

  // Fetch token from cookies
  const token = Cookies.get("token");

  // Fetch question sheets with pagination
  const fetchQuestionSheets = async (page: number = 1) => {
    try {
      setLoading(true);

      const data = await fetchQuestionSheet(page);
     
      setQuestionSheets(data.data.data); 
      setFilteredSheets(data.data.data); 
      setTotalPages(data.data.pagination.totalPages); 
      setCurrentPage(data.data.pagination.page); 
    } catch (error) {
      console.error("Error fetching question sheets:", error);
      toast.error("Failed to fetch question sheets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle search and filtering
  useEffect(() => {
    let result = [...questionSheets];
    setFilteredSheets(result);
  }, [questionSheets]);

  // Fetch question sheets on initial load
  useEffect(() => {
    fetchQuestionSheets(currentPage);
  }, [currentPage]);

  // Select a sheet for viewing/editing
  const selectSheet = (sheet: QuestionSheet) => {
    setSelectedSheet(sheet);
    setActiveTab("details");
  };

  // Toggle expansion of a sheet to show questions
  const toggleExpandSheet = (sheetId: string) => {
    setExpandedSheet(expandedSheet === sheetId ? null : sheetId);
  };

  // Toggle preview mode
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  // Edit a specific question from a sheet
  const editQuestion = (question: Question, index: number) => {
    setCurrentQuestion({ ...question });
    setEditingQuestionIndex(index);
    setIsQuestionDialogOpen(true);
  };

  // Add a new question to the selected sheet
  const addNewQuestion = () => {
    setCurrentQuestion({
      question: "",
      correctAnswer: "",
      answers: ["", "", "", ""],
      marks: 1,
    });
    setEditingQuestionIndex(null);
    setIsQuestionDialogOpen(true);
  };

  // Shuffle answers when creating/editing a question
  const shuffleAnswers = () => {
    setCurrentQuestion(prev => {
      const shuffled = [...prev.answers];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return { ...prev, answers: shuffled };
    });
  };

  // Add answer option
  const addAnswerOption = () => {
    if (currentQuestion.answers.length >= 6) {
      toast.error("Maximum 6 answer options are allowed");
      return;
    }
    
    setCurrentQuestion(prev => ({
      ...prev,
      answers: [...prev.answers, ""]
    }));
  };

  // Remove answer option
  const removeAnswerOption = (index: number) => {
    if (currentQuestion.answers.length <= 2) {
      toast.error("At least 2 answer options are required");
      return;
    }

    // Check if we're removing the correct answer
    if (currentQuestion.answers[index] === currentQuestion.correctAnswer) {
      setCurrentQuestion(prev => ({
        ...prev,
        correctAnswer: "",
        answers: prev.answers.filter((_, i) => i !== index)
      }));
    } else {
      setCurrentQuestion(prev => ({
        ...prev,
        answers: prev.answers.filter((_, i) => i !== index)
      }));
    }
  };

  // Set an answer as correct
  const setCorrectAnswer = (answer: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      correctAnswer: answer
    }));
  };

  // Save a question (new or edited)
  const saveQuestion = () => {
    if (!selectedSheet) return;
    
    if (
      !currentQuestion.question ||
      !currentQuestion.correctAnswer ||
      currentQuestion.answers.some((answer) => !answer)
    ) {
      toast.error("Please fill out all fields for the question.");
      return;
    }

    // Make sure the correct answer is in the answers list
    if (!currentQuestion.answers.includes(currentQuestion.correctAnswer)) {
      toast.error("The correct answer must be one of the answer options.");
      return;
    }

    const updatedSheet = { ...selectedSheet };
    
    if (editingQuestionIndex !== null) {
      // Update existing question
      updatedSheet.questions[editingQuestionIndex] = { ...currentQuestion };
      toast.success("Question updated!");
    } else {
      // Add new question
      updatedSheet.questions.push({ ...currentQuestion });
      toast.success("Question added!");
    }
    
    setSelectedSheet(updatedSheet);
    setIsQuestionDialogOpen(false);
    
    // Update the sheet on the server
    updateSheetOnServer(updatedSheet);
  };

  // Remove a question from the selected sheet
  const removeQuestion = () => {
    if (!selectedSheet || !questionToDelete) return;
    
    const updatedSheet = { ...selectedSheet };
    updatedSheet.questions = updatedSheet.questions.filter((_, i) => i !== questionToDelete.index);
    
    setSelectedSheet(updatedSheet);
    setIsDeleteQuestionDialogOpen(false);
    setQuestionToDelete(null);
    toast.success("Question removed successfully!");
    
    // Update the sheet on the server
    updateSheetOnServer(updatedSheet);
  };

  // Update sheet data on the server
  const updateSheetOnServer = async (sheet: QuestionSheet) => {
    try {
      setLoading(true);
      const body = {
        sheetName: sheet.sheetName,
        questions: sheet.questions,
      }
      await updateQuestionSheet(sheet._id, body)
      // Refresh the list
      fetchQuestionSheets(currentPage);
    } catch (error) {
      console.error("Error updating question sheet:", error);
      toast.error("Failed to update question sheet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Delete a question sheet
  const deleteSheet = async () => {
    if (!sheetToDelete) return;
    
    try {
      setLoading(true);
      await deleteQuestionSheet(sheetToDelete)

      toast.success("Question sheet deleted successfully!");
      if (selectedSheet && selectedSheet._id === sheetToDelete) {
        setSelectedSheet(null);
        setActiveTab("library");
      }
      
      fetchQuestionSheets(currentPage); // Refresh the list
      setIsDeleteSheetDialogOpen(false);
      setSheetToDelete(null);
      setConfirmDelete("");
    } catch (error) {
      console.error("Error deleting question sheet:", error);
      toast.error("Failed to delete question sheet. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format the date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className=" mx-auto py-10 px-10 W-full">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 font-Urbanist">
                  Manage Question Sheets
                </h1>
                <p className="text-gray-600 max-w-2xl font-Urbanist">
                  View, edit, and organize your collection of question sheets. Manage individual questions and preview sheets before using them.
                </p>
              </div>
              <Link href="/dashboard/addquestion">
                <Button className="bg-gray-800 hover:bg-gray-900 text-white">
                  <Plus className="h-4 w-4 mr-2" /> Create New Sheet
                </Button>
              </Link>
            </div>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-8 w-60">
              <TabsTrigger value="library" className="text-sm font-Urbanist">
                <ClipboardList className="h-4 w-4 mr-2" />
                Sheet Library
              </TabsTrigger>
              <TabsTrigger value="details" className="text-sm font-Urbanist" disabled={!selectedSheet}>
                <FileText className="h-4 w-4 mr-2" />
                Sheet Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="library">

              {loading && filteredSheets.length === 0 ? (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800"></div>
                </div>
              ) : filteredSheets.length === 0 ? (
                <motion.div 
                  variants={itemVariants}
                  className="border border-gray-200 rounded-lg p-8 text-center"
                >
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2 font-Urbanist">No Question Sheets Found</h3>
                    <Link href="/dashboard/addquestion">
                      <Button className="bg-gray-800 hover:bg-gray-900 text-white font-Urbanist">
                        <Plus className="h-4 w-4 mr-2" /> Create Your First Sheet
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  <AnimatePresence>
                    {filteredSheets.map((sheet) => {
                      const isExpanded = expandedSheet === sheet._id;
                      
                      return (
                        <motion.div
                          key={sheet._id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0 }}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <div className="p-6 bg-white hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div 
                                className="space-y-1 cursor-pointer"
                                onClick={() => selectSheet(sheet)}
                              >
                                <h3 className="text-lg font-semibold text-gray-800 font-Urbanist hover:text-gray-600">{sheet.sheetName}</h3>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-Urbanist">
                                  <span className="flex items-center">
                                    <Clock className="h-3.5 w-3.5 mr-1 opacity-70" />
                                    {formatDate(sheet.createdAt || "")}
                                  </span>
                                  <span className="flex items-center">
                                    <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                                    <span className="font-medium text-gray-700">{sheet.questions?.length || 0}</span>
                                    <span className="ml-1">{sheet.questions?.length === 1 ? 'question' : 'questions'}</span>
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleExpandSheet(sheet._id)}
                                  className="h-8 w-8 text-gray-500"
                                >
                                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal size={16} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => selectSheet(sheet)}>
                                      <Eye className="h-4 w-4 mr-2" /> View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => selectSheet(sheet)}>
                                      <Edit className="h-4 w-4 mr-2" /> Edit Sheet
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setSheetToDelete(sheet._id);
                                        setIsDeleteSheetDialogOpen(true);
                                      }} 
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" /> Delete Sheet
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            {/* Action buttons */}
                            <div className="mt-5 flex gap-2">
                              <Button 
                                variant="outline" 
                                className="flex-1 font-Urbanist"
                                onClick={() => selectSheet(sheet)}
                              >
                                <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                              </Button>
                              <Button 
                                className="flex-1 bg-gray-800 hover:bg-gray-900 text-white font-Urbanist"
                                onClick={() => {
                                  selectSheet(sheet);
                                  setShowPreview(true);
                                }}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview
                              </Button>
                            </div>
                          </div>

                          {/* Expandable question list */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border-t border-gray-200 overflow-hidden bg-gray-50"
                              >
                                <div className="p-4 border-b border-gray-200">
                                  <h4 className="text-sm font-medium text-gray-700 font-Urbanist">Questions in this sheet</h4>
                                </div>
                                <div className="divide-y divide-gray-200">
                                  {sheet.questions.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-500 font-Urbanist text-center">
                                      This sheet has no questions yet.
                                    </div>
                                  ) : (
                                    sheet.questions.map((question, index) => (
                                      <div key={index} className="p-4 hover:bg-gray-100 transition-colors">
                                        <div className="flex items-start justify-between">
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                              <span className="inline-flex items-center justify-center bg-gray-200 text-gray-800 w-6 h-6 rounded-full text-xs font-medium">
                                                {index + 1}
                                              </span>
                                              <div className="flex items-center gap-2">                                              
                                            {question.marks && (
                                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                                                    {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            <p className="text-sm text-gray-800 font-Urbanist">{question.question}</p>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => {
                                                selectSheet(sheet);
                                                editQuestion(question, index);
                                              }}
                                              className="h-7 w-7 text-gray-500"
                                            >
                                              <Edit size={14} />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => {
                                                setQuestionToDelete({ sheetId: sheet._id, index });
                                                setIsDeleteQuestionDialogOpen(true);
                                              }}
                                              className="h-7 w-7 text-gray-500"
                                            >
                                              <Trash2 size={14} />
                                            </Button>
                                          </div>
                                        </div>
                                        <div className="mt-2 pl-8">
                                          <p className="text-xs text-gray-500 font-Urbanist">
                                            Correct Answer: <span className="text-green-600 font-medium">{question.correctAnswer}</span>
                                          </p>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && !loading && (
                <div className="flex justify-center items-center mt-10 space-x-4">
                  <Button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="flex items-center font-Urbanist"
                  >
                    <ArrowLeft size={16} className="mr-1" /> Previous
                  </Button>
                  <span className="text-sm text-gray-600 font-Urbanist">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    className="flex items-center font-Urbanist"
                  >
                    Next <ArrowRight size={16} className="ml-1" />
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="details">
              {selectedSheet ? (
                <motion.div
                  variants={containerVariants}
                  className="space-y-8"
                >
                  <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 font-Urbanist mb-1">{selectedSheet.sheetName}</h2>
                      <div className="flex items-center gap-4 text-sm text-gray-500 font-Urbanist">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1.5" />
                          Created: {formatDate(selectedSheet.createdAt || "")}
                        </span>
                        <span className="flex items-center">
                          <ClipboardList className="h-4 w-4 mr-1.5" />
                          {selectedSheet.questions.length} {selectedSheet.questions.length === 1 ? 'question' : 'questions'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={togglePreview}
                        className="font-Urbanist"
                      >
                        {showPreview ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" /> Hide Preview
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" /> Preview Sheet
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={addNewQuestion}
                        className="bg-gray-800 hover:bg-gray-900 text-white font-Urbanist"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Question
                      </Button>
                    </div>
                  </motion.div>

                  {/* Preview section */}
                  <AnimatePresence>
                    {showPreview && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-lg border border-gray-200 overflow-hidden mb-8">
                          <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-base font-medium text-gray-800 font-Urbanist">Sheet Preview</h3>
                            <Select value={previewMode} onValueChange={(val: "student" | "teacher") => setPreviewMode(val)}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Preview Mode" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student View</SelectItem>
                                <SelectItem value="teacher">Teacher View</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="p-6 bg-white">
                            <div className="space-y-6">
                              {selectedSheet.questions.map((question, qIndex) => (
                                <div key={qIndex} className="border border-gray-200 rounded-lg p-6">
                                  <div className="flex items-start mb-4">
                                    <div className="bg-gray-200 text-gray-800 w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                      {qIndex + 1}
                                    </div>
                                    <div className="flex-grow">
                                      <div className="flex justify-between items-center mb-1">
                                        {previewMode === "teacher" && (
                                          <div className="flex items-center gap-2"> 
                                            {question.marks && (
                                              <span className="px-2 py-1 bg-blue-50 text-blue-800 text-xs rounded-full flex items-center">
                                                {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      <h3 className="text-base font-medium text-gray-800 font-Urbanist">{question.question}</h3>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                    {question.answers.map((answer, aIndex) => (
                                      <div
                                        key={aIndex}
                                        className={`p-4 rounded-lg border ${
                                          previewMode === "teacher" && answer === question.correctAnswer
                                            ? "bg-green-50 border-green-200"
                                            : "bg-white border-gray-200 hover:border-gray-300"
                                        } cursor-pointer transition-all`}
                                      >
                                        <div className="flex items-center">
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                                            previewMode === "teacher" && answer === question.correctAnswer
                                              ? "bg-green-100 text-green-800 border border-green-300"
                                              : "border border-gray-300 text-gray-600"
                                          }`}>
                                            {String.fromCharCode(65 + aIndex)}
                                          </div>
                                          <span className={`font-Urbanist ${
                                            previewMode === "teacher" && answer === question.correctAnswer
                                              ? "text-green-800"
                                              : "text-gray-700"
                                          }`}>
                                            {answer}
                                          </span>
                                          {previewMode === "teacher" && answer === question.correctAnswer && (
                                            <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Questions list */}
                  <motion.div variants={itemVariants} className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-base font-medium text-gray-800 font-Urbanist">Questions</h3>
                      <Button 
                        onClick={addNewQuestion}
                        variant="outline" 
                        size="sm" 
                        className="text-xs font-Urbanist"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Question
                      </Button>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {selectedSheet.questions.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ClipboardList className="h-6 w-6 text-gray-400" />
                          </div>
                          <h3 className="text-base font-medium text-gray-700 mb-1 font-Urbanist">No Questions Yet</h3>
                          <p className="text-sm text-gray-500 mb-4 font-Urbanist">
                            This sheet doesn't have any questions. Add your first question to get started.
                          </p>
                          <Button 
                            onClick={addNewQuestion}
                            className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-Urbanist"
                          >
                            <Plus className="h-4 w-4 mr-2" /> Add First Question
                          </Button>
                        </div>
                      ) : (
                        selectedSheet.questions.map((question, index) => (
                          <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start">
                                <div className="bg-gray-200 text-gray-800 w-7 h-7 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                                  {index + 1}
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">                                  
                                    {question.marks && (
                                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                                        {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-base text-gray-800 font-Urbanist">{question.question}</p>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                                    {question.answers.map((answer, i) => (
                                      <div
                                        key={i}
                                        className={`p-2 rounded text-sm flex items-center ${
                                          answer === question.correctAnswer
                                            ? "bg-green-50 text-green-800"
                                            : "bg-gray-50 text-gray-700"
                                        }`}
                                      >
                                        {answer === question.correctAnswer ? (
                                          <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                                        ) : (
                                          <div className="w-4 h-4 rounded-full border border-gray-300 mr-2 flex-shrink-0 flex items-center justify-center text-xs">
                                            {String.fromCharCode(65 + i)}
                                          </div>
                                        )}
                                        <span className="font-Urbanist">{answer}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="flex ml-4">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => editQuestion(question, index)}
                                  className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                                >
                                  <Edit size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setQuestionToDelete({ sheetId: selectedSheet._id, index });
                                    setIsDeleteQuestionDialogOpen(true);
                                  }}
                                  className="h-8 w-8 text-gray-500 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>

                  <div className="pt-4 flex justify-between border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedSheet(null);
                        setActiveTab("library");
                        setShowPreview(false);
                      }}
                      className="font-Urbanist"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back to Library
                    </Button>
                    <Button
                      onClick={() => {
                        setSheetToDelete(selectedSheet._id);
                        setIsDeleteSheetDialogOpen(true);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-Urbanist"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Sheet
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4 font-Urbanist">No sheet selected. Please select a sheet from the library to view its details.</p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("library")}
                    className="font-Urbanist"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Go to Library
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-Urbanist">{editingQuestionIndex !== null ? "Edit Question" : "Add New Question"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Question Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="questionText" className="text-base font-medium font-Urbanist">
                  Question Text
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400">
                        <Info size={14} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-Urbanist">Enter the question you want to ask. Be clear and concise.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="questionText"
                value={currentQuestion.question}
                onChange={(e) =>
                  setCurrentQuestion((prev) => ({
                    ...prev,
                    question: e.target.value,
                  }))
                }
                placeholder="Enter your question here..."
                rows={3}
                className="w-full resize-none font-Urbanist"
              />
            </div>

            {/* Question Settings */}
            <div className="grid grid-cols-1 gap-4">
          
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="marks" className="text-sm font-medium font-Urbanist">
                    Question Marks
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400">
                          <Info size={14} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-Urbanist">Set how many points this question is worth for grading.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="marks"
                  type="number"
                  min="1"
                  max="100"
                  value={currentQuestion.marks}
                  onChange={(e) =>
                    setCurrentQuestion((prev) => ({
                      ...prev,
                      marks: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-full font-Urbanist"
                />
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Label className="text-base font-medium font-Urbanist">Answer Options</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400">
                          <Info size={14} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-Urbanist">Add 2-6 answer options. Select one as the correct answer by clicking the circular button to the left of each option.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={shuffleAnswers}
                    className="text-xs font-Urbanist"
                  >
                    <Shuffle className="h-3 w-3 mr-1" /> Shuffle
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addAnswerOption}
                    className="text-xs font-Urbanist"
                    disabled={currentQuestion.answers.length >= 6}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Option
                  </Button>
                </div>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto p-1">
                {currentQuestion.answers.map((answer, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant={answer === currentQuestion.correctAnswer ? "default" : "outline"}
                      size="icon"
                      onClick={() => setCorrectAnswer(answer)}
                      className={`h-8 w-8 flex-shrink-0 ${
                        answer === currentQuestion.correctAnswer
                          ? "bg-green-600 hover:bg-green-700"
                          : "hover:border-green-300 hover:bg-green-50"
                      }`}
                    >
                      {answer === currentQuestion.correctAnswer ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <span>{String.fromCharCode(65 + index)}</span>
                      )}
                    </Button>
                    <div className="flex-grow">
                      <Input
                        value={answer}
                        onChange={(e) =>
                          setCurrentQuestion((prev) => ({
                            ...prev,
                            answers: prev.answers.map((a, i) =>
                              i === index ? e.target.value : a
                            ),
                          }))
                        }
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        className="w-full font-Urbanist"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAnswerOption(index)}
                      disabled={currentQuestion.answers.length <= 2}
                      className="h-8 w-8 text-gray-500 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="mt-2 text-sm text-gray-500 font-Urbanist">
                <p>* Click the circular button next to an option to set it as the correct answer</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsQuestionDialogOpen(false)}
              className="font-Urbanist"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveQuestion}
              className="bg-gray-800 hover:bg-gray-900 text-white font-Urbanist"
              disabled={
                !currentQuestion.question ||
                !currentQuestion.correctAnswer ||
                currentQuestion.answers.some((answer) => !answer)
              }
            >
              {editingQuestionIndex !== null ? "Update Question" : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Sheet Dialog */}
      <Dialog open={isDeleteSheetDialogOpen} onOpenChange={setIsDeleteSheetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 font-Urbanist">Delete Question Sheet</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4 font-Urbanist">
              Are you sure you want to delete this question sheet? This action cannot be undone.
            </p>
            <div className="space-y-4">
              <p className="text-sm text-gray-500 font-Urbanist">
                Type <span className="font-medium text-red-600">delete</span> to confirm:
              </p>
              <Input
                value={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.value)}
                placeholder="Type 'delete' to confirm"
                className="font-Urbanist"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteSheetDialogOpen(false);
                setSheetToDelete(null);
                setConfirmDelete("");
              }}
              className="font-Urbanist"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={deleteSheet}
              className="bg-red-600 hover:bg-red-700 text-white font-Urbanist"
              disabled={confirmDelete !== "delete" || loading}
            >
              {loading ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Question Dialog */}
      <Dialog open={isDeleteQuestionDialogOpen} onOpenChange={setIsDeleteQuestionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 font-Urbanist">Delete Question</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4 font-Urbanist">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteQuestionDialogOpen(false);
                setQuestionToDelete(null);
              }}
              className="font-Urbanist"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={removeQuestion}
              className="bg-red-600 hover:bg-red-700 text-white font-Urbanist"
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster  />
    </div>
  );
}