"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Batch, QuestionSheet } from "../../../../apiCalls/addExam";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, Clock, BookOpen, Check, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import {
    createExam,
    getBatches,
    getQuestionSheets
} from "../../../../apiCalls/addExam";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from '@/components/ui/switch';

export default function CreateExamPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [examData, setExamData] = useState({
        exam_id: "",
        title: "",
        description: "",
        exam_name: "",
        startDateTime: "",
        endDateTime: "",
        total_marks: 100,
        pass_marks: 60,
        question_sheet_id: "",
        batches: [],
        negativeMarking: false,
        duration: 60,
        negativeMarkingNumber: 0
    });

    // Batch selection state
    const [batches, setBatches] = useState<Batch[]>([]);
    const [batchPage, setBatchPage] = useState(1);
    const [batchTotalPages, setBatchTotalPages] = useState(1);
    const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
    const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);

    // Question sheet selection state
    const [questionSheets, setQuestionSheets] = useState<QuestionSheet[]>([]);
    const [questionSheetPage, setQuestionSheetPage] = useState(1);
    const [questionSheetTotalPages, setQuestionSheetTotalPages] = useState(1);
    const [isQuestionSheetDropdownOpen, setIsQuestionSheetDropdownOpen] = useState(false);

    // Fetch data on component mount
    useEffect(() => {
        fetchBatches();
        fetchQuestionSheets();
    }, []);

    const fetchBatches = async (page = 1) => {
        try {
            const result = await getBatches(page);
            if (result.success && result.data) {
                setBatches(result.data.data);
                setBatchTotalPages(result.data.meta?.totalPages || 1);
                setBatchPage(page);
            }
        } catch (error) {
            toast.error("Failed to load batches");
            console.error(error);
        }
    };

    const fetchQuestionSheets = async (page = 1) => {
        try {
            const result = await getQuestionSheets(page);
            if (result.success && result.data) {
                setQuestionSheets(result.data.data);
                setQuestionSheetTotalPages(result.data.pagination?.totalPages || 1);
                setQuestionSheetPage(page);
            }
        } catch (error) {
            toast.error("Failed to load question sheets");
            console.error(error);
        }
    };

    const handleChange = (e: { target: { name: any; value: any; }; }) => {
        const { name, value } = e.target;
        setExamData(prev => ({
            ...prev,
            [name]: name === 'total_marks' || name === 'pass_marks'
                ? Number(value)
                : value
        }));
    };

    // Store datetime values directly as entered by the user
    const handleDateTimeChange = (field: string, value: string) => {
        setExamData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const toggleBatchSelection = (batchId: string) => {
        setSelectedBatches(prev =>
            prev.includes(batchId)
                ? prev.filter(id => id !== batchId)
                : [...prev, batchId]
        );
    };

    const handleQuestionSheetSelect = (sheetId: any) => {
        setExamData(prev => ({
            ...prev,
            question_sheet_id: sheetId
        }));
        setIsQuestionSheetDropdownOpen(false);
    };

    // Convert datetime-local value to the format backend needs
    // This will now format the date in the ISO format but preserve the EXACT time selected
    const formatDateForBackend = (dateString: string) => {
        if (!dateString) return "";

        // Create a date object from the input value 
        // (datetime-local returns in format YYYY-MM-DDTHH:MM)
        const parts = dateString.split('T');
        const datePart = parts[0]; // YYYY-MM-DD
        const timePart = parts[1]; // HH:MM

        // Format to exact ISO format expected by backend: YYYY-MM-DDTHH:MM:00.000Z
        return `${datePart}T${timePart}:00.000Z`;
    };
    const handleSwitchChange = (checked: boolean) => {
        setExamData(prev => ({
            ...prev,
            negativeMarking: checked
        }));
    };
    const handleSubmit = async (e: { preventDefault: () => void; }) => {
        e.preventDefault();

        if (!validateExamData()) return;

        setIsSubmitting(true);
        try {
            // Prepare the data for submission with direct date strings
            const dataToSubmit = {
                ...examData,
                startDateTime: formatDateForBackend(examData.startDateTime),
                endDateTime: formatDateForBackend(examData.endDateTime),
                batches: selectedBatches
            };

            // Debug log to verify the dates being sent
            console.log("Submitting exam data:", {
                originalStart: examData.startDateTime, // Original input format: YYYY-MM-DDTHH:MM
                formattedStart: dataToSubmit.startDateTime, // Formatted for API: YYYY-MM-DDTHH:MM:00.000Z
                originalEnd: examData.endDateTime,
                formattedEnd: dataToSubmit.endDateTime
            });

            const result = await createExam(dataToSubmit);

            if (result.success) {
                toast.success("Exam created successfully!");
                setExamData({
                    exam_id: "",
                    title: "",
                    description: "",
                    exam_name: "",
                    startDateTime: "",
                    endDateTime: "",
                    total_marks: 100,
                    pass_marks: 60,
                    question_sheet_id: "",
                    batches: [],
                    negativeMarking: false,
                    duration: 60,
                    negativeMarkingNumber: 0
                });
                setSelectedBatches([]);
            } else {
                toast.error(result.error || "Failed to create exam");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const validateExamData = () => {
        if (!examData.exam_id) {
            toast.error("Exam ID is required");
            return false;
        }
        if (!examData.title) {
            toast.error("Exam title is required");
            return false;
        }
        if (!examData.exam_name) {
            toast.error("Exam name is required");
            return false;
        }
        if (!examData.startDateTime || !examData.endDateTime) {
            toast.error("Start and end date/time are required");
            return false;
        }

        // Create Date objects to compare times
        const startParts = examData.startDateTime.split('T');
        const endParts = examData.endDateTime.split('T');

        if (startParts.length !== 2 || endParts.length !== 2) {
            toast.error("Invalid date format");
            return false;
        }

        // Compare dates as strings - this works because of the YYYY-MM-DDTHH:MM format
        if (examData.startDateTime >= examData.endDateTime) {
            toast.error("End date/time must be after start date/time");
            return false;
        }

        if (examData.pass_marks > examData.total_marks) {
            toast.error("Pass marks cannot be greater than total marks");
            return false;
        }
        if (!examData.question_sheet_id) {
            toast.error("Please select a question sheet");
            return false;
        }
        if (selectedBatches.length === 0) {
            toast.error("Please select at least one batch");
            return false;
        }
        return true;
    };

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="mx-auto py-8 px-10 font-Urbanist bg-white">
                <Toaster />

                <div className="w-full mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <BookOpen className="text-[#082c34]" />
                                Create New Exam
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                                Fill in the details below to schedule a new examination
                            </p>
                        </CardHeader>

                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-6">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                                        Basic Information
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="exam_id" className="flex items-center gap-1">
                                                Exam ID <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="exam_id"
                                                name="exam_id"
                                                value={examData.exam_id}
                                                onChange={handleChange}
                                                required
                                                placeholder="e.g., EX001, MIDTERM2025"
                                            />
                                            <p className="text-xs text-gray-500">
                                                Unique identifier for the exam
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="exam_name" className="flex items-center gap-1">
                                                Exam Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="exam_name"
                                                name="exam_name"
                                                value={examData.exam_name}
                                                onChange={handleChange}
                                                required
                                                placeholder="e.g., Midterm Examination 2025"
                                            />
                                            <p className="text-xs text-gray-500">
                                                Official name that will be displayed
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="flex items-center gap-1">
                                            Exam Title <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            name="title"
                                            value={examData.title}
                                            onChange={handleChange}
                                            required
                                            placeholder="e.g., Comprehensive Midterm Exam"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Descriptive title for the exam
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={examData.description}
                                            onChange={handleChange}
                                            placeholder="Describe the exam scope, topics covered, etc."
                                            rows={3}
                                        />
                                        <p className="text-xs text-gray-500">
                                            Provide details about what the exam will cover
                                        </p>
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                                        Schedule
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="startDateTime" className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                Start Date & Time <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="startDateTime"
                                                name="startDateTime"
                                                type="datetime-local"
                                                value={examData.startDateTime || ""}
                                                onChange={(e) => handleDateTimeChange('startDateTime', e.target.value)}
                                                required
                                            />
                                            <p className="text-xs text-gray-500">
                                                When the exam will become available
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="endDateTime" className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                End Date & Time <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="endDateTime"
                                                name="endDateTime"
                                                type="datetime-local"
                                                value={examData.endDateTime || ""}
                                                onChange={(e) => handleDateTimeChange('endDateTime', e.target.value)}
                                                required
                                            />
                                            <p className="text-xs text-gray-500">
                                                When the exam will close for submissions
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {/* Duration Input */}

                                    <div>
                                        <Label htmlFor="duration" className="mb-2">Duration (minutes)</Label>
                                        <Input
                                            id="duration"
                                            name="duration"
                                            type="number"
                                            min="1"
                                            value={examData.duration}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    {/* Boolean Switch */}
                                    <div className="flex items-center space-x-2 mt-5">
                                        <Switch
                                            id="negativeMarking"
                                            checked={examData.negativeMarking}
                                            onCheckedChange={handleSwitchChange}
                                        />
                                        <Label htmlFor="negativeMarking">Enable Negative Marking</Label>
                                    </div>



                                    {examData.negativeMarking && (
                                        <div className="text-sm text-muted-foreground mt-5">
                                            Negative marking will deduct certain percentage of the question's marks for incorrect answers.
                                        </div>
                                    )}

                                    <div>
                                        <Label htmlFor="negativeMarkingNumber" className="mb-2">Negative Marking</Label>
                                        <Input
                                            id="negativeMarkingNumber"
                                            name="negativeMarkingNumber"
                                            type="number"
                                            step="0.01"
                                            value={examData.negativeMarkingNumber}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                {/* Marks & Question Sheet */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                                        Exam Details
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="total_marks" className="flex items-center gap-1">
                                                Total Marks <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="total_marks"
                                                name="total_marks"
                                                type="number"
                                                value={examData.total_marks}
                                                onChange={handleChange}
                                                required
                                                min="1"
                                            />
                                            <p className="text-xs text-gray-500">
                                                Maximum possible score
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="pass_marks" className="flex items-center gap-1">
                                                Passing Marks <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="pass_marks"
                                                name="pass_marks"
                                                type="number"
                                                value={examData.pass_marks}
                                                onChange={handleChange}
                                                required
                                                min="0"
                                                max={examData.total_marks}
                                            />
                                            <p className="text-xs text-gray-500">
                                                Minimum score required to pass
                                            </p>
                                        </div>


                                        <div className="space-y-2">
                                            <Label htmlFor="question_sheet_id">
                                                Question Sheet <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    className="flex items-center justify-between w-full p-2 border rounded-md bg-white text-left"
                                                    onClick={() => setIsQuestionSheetDropdownOpen(!isQuestionSheetDropdownOpen)}
                                                >
                                                    <span>
                                                        {examData.question_sheet_id
                                                            ? questionSheets.find(q => q._id === examData.question_sheet_id)?.sheetName || "Select question sheet"
                                                            : "Select question sheet"}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4" />
                                                </button>

                                                {isQuestionSheetDropdownOpen && (
                                                    <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto border rounded-md bg-white shadow-lg">
                                                        <div className="p-2 space-y-2">
                                                            {questionSheets.map(sheet => (
                                                                <div
                                                                    key={sheet._id}
                                                                    className={`p-2 rounded-md cursor-pointer hover:bg-gray-100 ${examData.question_sheet_id === sheet._id ? 'bg-blue-50' : ''}`}
                                                                    onClick={() => handleQuestionSheetSelect(sheet._id)}
                                                                >
                                                                    {sheet.sheetName}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="flex justify-between p-2 border-t">
                                                            <button
                                                                type="button"
                                                                disabled={questionSheetPage === 1}
                                                                onClick={() => fetchQuestionSheets(questionSheetPage - 1)}
                                                                className="flex items-center gap-1 text-sm disabled:opacity-50"
                                                            >
                                                                <ChevronLeft className="h-4 w-4" />
                                                                Previous
                                                            </button>
                                                            <span className="text-sm text-gray-500">
                                                                Page {questionSheetPage} of {questionSheetTotalPages}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                disabled={questionSheetPage >= questionSheetTotalPages}
                                                                onClick={() => fetchQuestionSheets(questionSheetPage + 1)}
                                                                className="flex items-center gap-1 text-sm disabled:opacity-50"
                                                            >
                                                                Next
                                                                <ChevronRight className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                Select the question sheet for this exam
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Batch Selection */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                                        Batch Assignment
                                    </h3>

                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-1">
                                            Assign to Batches <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                className="flex items-center justify-between w-full p-2 border rounded-md bg-white"
                                                onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
                                            >
                                                <span>
                                                    {selectedBatches.length > 0
                                                        ? `${selectedBatches.length} selected`
                                                        : "Select batches"}
                                                </span>
                                                <ChevronDown className="h-4 w-4" />
                                            </button>

                                            {isBatchDropdownOpen && (
                                                <div className="absolute z-10 mt-1 w-full max-h-60 overflow-auto border rounded-md bg-white shadow-lg">
                                                    <div className="p-2 space-y-2">
                                                        {batches.map(batch => (
                                                            <div key={batch._id} className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`batch-${batch._id}`}
                                                                    checked={selectedBatches.includes(batch._id)}
                                                                    onCheckedChange={() => toggleBatchSelection(batch._id)}
                                                                />
                                                                <Label htmlFor={`batch-${batch._id}`}>
                                                                    {batch.batch_name}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="flex justify-between p-2 border-t">
                                                        <button
                                                            type="button"
                                                            disabled={batchPage === 1}
                                                            onClick={() => fetchBatches(batchPage - 1)}
                                                            className="flex items-center gap-1 text-sm disabled:opacity-50"
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                            Previous
                                                        </button>
                                                        <span className="text-sm text-gray-500">
                                                            Page {batchPage} of {batchTotalPages}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            disabled={batchPage >= batchTotalPages}
                                                            onClick={() => fetchBatches(batchPage + 1)}
                                                            className="flex items-center gap-1 text-sm disabled:opacity-50"
                                                        >
                                                            Next
                                                            <ChevronRight className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Select which batches should take this exam
                                        </p>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="flex justify-between border-t pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push("/dashboard/scheduleExam")}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-[#082c34] hover:bg-[#283f44]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Create Exam
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </Suspense>
    );
}