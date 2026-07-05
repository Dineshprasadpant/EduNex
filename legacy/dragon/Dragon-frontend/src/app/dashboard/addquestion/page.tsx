"use client";

import { useState} from "react";
import Cookies from "js-cookie";
import { motion, AnimatePresence,Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast, Toaster } from "react-hot-toast";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  Shuffle,
  FileText,
  HelpCircle,
  Info,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createQuestionSheet } from "../../../../apiCalls/addQuestions"

export default function QuestionSheetCreatorPage() {
  // Types
  interface Question {
    question: string;
    correctAnswer: string;
    answers: string[];
    marks?: number; // question points/marks
  }


  // State variables
  const [sheetName, setSheetName] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question: "",
    correctAnswer: "",
    answers: ["", "", "", ""],
    marks: 1,
  });

  const [loading, setLoading] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<"student" | "teacher">("student");
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);

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

  // Toggle question expansion
  const toggleQuestionExpand = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  // Function to handle adding a question from the dialog
  const handleAddQuestion = () => {
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

    if (editIndex !== null) {
      // Update existing question
      const updatedQuestions = [...questions];
      updatedQuestions[editIndex] = { ...currentQuestion };
      setQuestions(updatedQuestions);
      setEditIndex(null);
      toast.success("Question updated successfully!");
    } else {
      // Add new question
      setQuestions((prev) => [...prev, { ...currentQuestion }]);
      toast.success("Question added successfully!");
    }

    // Reset form
    setCurrentQuestion({
      question: "",
      correctAnswer: "",
      answers: ["", "", "", ""],
      marks: 1,
    });

    // Close dialog
    setIsQuestionDialogOpen(false);
  };

  // Edit an existing question
  const editQuestion = (index: number) => {
    setCurrentQuestion({ ...questions[index] });
    setEditIndex(index);
    setIsQuestionDialogOpen(true);
  };

  // Remove a question from the list
  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    toast.success("Question removed successfully!");
  };

  // Shuffle answers
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

  // Handle form submission (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!sheetName || questions.length === 0) {
      toast.error("Please provide a sheet name and at least one question.");
      setLoading(false);
      return;
    }


    try {
      const body = {
        sheetName,
        questions,
      }

      await createQuestionSheet(body);

      toast.success(
        `Question sheet created successfully!`
      );

      // Reset form
      setSheetName("");
      setQuestions([]);
      setShowPreview(false);
    } catch (error) {
      console.error(`Error creating question sheet:`, error);
      toast.error(
        `Failed to create question sheet. Please try again.`
      );
    } finally {
      setLoading(false);
    }
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

  // Toggle preview visibility
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className=" mx-auto py-10 w-full px-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-Urbanist">
              Create Question Sheet
            </h1>
            <p className="text-gray-600 max-w-3xl font-Urbanist">
              Build engaging multiple-choice questions with various options for your students. Questions can have different difficulty levels and point values.
            </p>
          </motion.div>

          {/* Preview section - only shown when preview button is clicked */}
          {questions.length > 0 && (
            <motion.div variants={itemVariants} className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <Button
                  onClick={togglePreview}
                  variant="outline"
                  className="flex items-center font-Urbanist"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" /> Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" /> Show Preview
                    </>
                  )}
                </Button>
                {showPreview && (
                  <Select value={previewMode} onValueChange={(val: "student" | "teacher") => setPreviewMode(val)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Preview Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student View</SelectItem>
                      <SelectItem value="teacher">Teacher View</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <AnimatePresence>
                {showPreview && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <h3 className="text-lg font-medium text-gray-800 mb-4 font-Urbanist">{sheetName || "Question Sheet Preview"}</h3>

                      <div className="space-y-6">
                        {questions.map((question, qIndex) => (
                          <div key={qIndex} className="border border-gray-200 rounded-lg p-6 bg-white">
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
                                  className={`p-4 rounded-lg border ${previewMode === "teacher" && answer === question.correctAnswer
                                    ? "bg-green-50 border-green-200"
                                    : "bg-white border-gray-200 hover:border-gray-300"
                                    } cursor-pointer transition-all`}
                                >
                                  <div className="flex items-center">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${previewMode === "teacher" && answer === question.correctAnswer
                                      ? "bg-green-100 text-green-800 border border-green-300"
                                      : "border border-gray-300 text-gray-600"
                                      }`}>
                                      {String.fromCharCode(65 + aIndex)}
                                    </div>
                                    <span className={`font-Urbanist ${previewMode === "teacher" && answer === question.correctAnswer
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
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          <motion.div variants={itemVariants}>
            <form onSubmit={handleSubmit} className="space-y-8 bg-white">
              <div className="space-y-4 border-b border-gray-200 pb-8">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sheetName" className="text-lg font-medium text-gray-800 font-Urbanist">
                    Sheet Name
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                          <Info size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-Urbanist">Give your question sheet a descriptive name that helps you identify its purpose or content.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="sheetName"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="Enter a descriptive name for your question sheet"
                  className="w-full text-base py-2 font-Urbanist"
                />
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <h2 className="text-xl font-medium text-gray-800 mr-2 font-Urbanist">Questions</h2>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                            <HelpCircle size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-Urbanist">Add multiple choice questions. Each question requires at least 2 answer options and one correct answer.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setEditIndex(null);
                      setCurrentQuestion({
                        question: "",
                        correctAnswer: "",
                        answers: ["", "", "", ""],
                        marks: 1,
                      });
                      setIsQuestionDialogOpen(true);
                    }}
                    className="bg-gray-800 hover:bg-gray-900 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Question
                  </Button>
                </div>

                {questions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2 font-Urbanist">No Questions Added Yet</h3>
                    <p className="text-gray-500 text-center max-w-md mb-6 font-Urbanist">
                      Start by adding questions to your sheet. You will need at least one question to create a question sheet.
                    </p>
                    <Button
                      type="button"
                      onClick={() => {
                        setEditIndex(null);
                        setCurrentQuestion({
                          question: "",
                          correctAnswer: "",
                          answers: ["", "", "", ""],
                          marks: 1,
                        });
                        setIsQuestionDialogOpen(true);
                      }}
                      className="bg-gray-800 hover:bg-gray-900 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Your First Question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <AnimatePresence>
                      {questions.map((question, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, height: 0 }}
                          layout
                          className="p-6 border border-gray-200 rounded-lg bg-white relative"
                        >
                          <div className="absolute -top-3 -left-3 bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                            {index + 1}
                          </div>

                          <div className="flex justify-between items-start mb-4 pl-6">
                            <div className="pr-20 w-full">
                              <div className="flex flex-wrap items-center mb-3 gap-2">
                                {question.marks && (
                                  <span className="px-3 py-1 bg-blue-50 text-blue-800 text-xs font-medium rounded-full">
                                    {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-base font-medium text-gray-800 mb-2 font-Urbanist">{question.question}</h3>
                            </div>

                            <div className="flex items-center space-x-1 absolute top-4 right-4">
                              <Button
                                type="button"
                                onClick={() => editQuestion(index)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-gray-700"
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                type="button"
                                onClick={() => removeQuestion(index)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-gray-700"
                              >
                                <Trash2 size={16} />
                              </Button>
                              <Button
                                type="button"
                                onClick={() => toggleQuestionExpand(index)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500"
                              >
                                {expandedQuestion === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </Button>
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedQuestion === index && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden pt-2 pl-6"
                              >
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {question.answers.map((answer, i) => (
                                    <div
                                      key={i}
                                      className={`p-3 rounded-lg border flex items-center ${answer === question.correctAnswer
                                        ? "bg-green-50 border-green-200"
                                        : "bg-gray-50 border-gray-200"
                                        }`}
                                    >
                                      {answer === question.correctAnswer ? (
                                        <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                                      ) : (
                                        <div className="w-5 h-5 rounded-full border border-gray-300 mr-3 flex-shrink-0 flex items-center justify-center">
                                          {String.fromCharCode(65 + i)}
                                        </div>
                                      )}
                                      <span className={`text-sm font-Urbanist ${answer === question.correctAnswer ? "text-green-800 font-medium" : "text-gray-700"}`}>
                                        {answer}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <div className="pt-8 border-t border-gray-200 flex flex-wrap justify-between gap-3">
                {questions.length > 0 && (
                  <Button
                    type="button"
                    onClick={togglePreview}
                    variant="outline"
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
                )}

                <Button
                  type="submit"
                  className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-2 text-sm font-medium ml-auto"
                  disabled={loading || questions.length === 0}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {"Creating..."}
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      {"Create Question Sheet"}
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </div>

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-Urbanist">{editIndex !== null ? "Edit Question" : "Add New Question"}</DialogTitle>
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
            <div className="grid grid-cols-1  gap-4">
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
                      className={`h-8 w-8 flex-shrink-0 ${answer === currentQuestion.correctAnswer
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
              onClick={handleAddQuestion}
              className="bg-gray-800 hover:bg-gray-900 text-white font-Urbanist"
              disabled={
                !currentQuestion.question ||
                !currentQuestion.correctAnswer ||
                currentQuestion.answers.some((answer) => !answer)
              }
            >
              {editIndex !== null ? "Update Question" : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" />
    </div>
  );
}