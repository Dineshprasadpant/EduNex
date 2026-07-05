"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getExams, updateExam, deleteExam, getQuestionSheets, Exam } from '../../../../apiCalls/manageExams';
import { fetchBatches } from '../../../../apiCalls/manageBatch'; // Import the fetchBatches function
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import {
    Edit as EditIcon,
    Trash2 as DeleteIcon,
    RefreshCw as RefreshIcon,
    CheckCircle2 as CheckCircleIcon,
    XCircle as CancelIcon,
    Calendar as ScheduleIcon,
    FileText as AssignmentIcon,
    Users as GroupIcon,
    GraduationCap as SchoolIcon,
    Loader2 as LoaderIcon,
    ChevronLeft,
    ChevronRight,
    Menu as MenuIcon
} from 'lucide-react';

// Define interfaces for the API response types
interface Batch {
    _id: string;
    batch_name: string;
}

interface BatchesResponse {
    batches: Batch[];
    pagination: {
        totalPages: number;
        totalObjects: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

interface QuestionSheet {
    _id: string;
    sheetName: string;
}

interface FormData {
    exam_id: string;
    title: string;
    description: string;
    exam_name: string;
    startDateTime: string;
    endDateTime: string;
    total_marks: number;
    pass_marks: number;
    question_sheet_id: string;
    batches: string[];
}

interface FormErrors {
    exam_id: string;
    title: string;
    exam_name: string;
    startDateTime: string;
    endDateTime: string;
    total_marks: string;
    pass_marks: string;
    question_sheet_id: string;
    batches: string;
}

interface PaginationState {
    page: number;
    limit: number;
    totalPages: number;
    totalObjects: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

interface BatchPaginationState {
    page: number;
    limit: number;
    totalPages: number;
    totalObjects: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

// Extended Exam interface to ensure type safety with batches
interface ExamWithBatches extends Exam {
    batches: Batch[];
    question_sheet_id: {
        _id: string;
        sheetName: string;
    };
}

const ExamsManagement = () => {
    const router = useRouter();
    const [exams, setExams] = useState<ExamWithBatches[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        limit: 10,
        totalPages: 1,
        totalObjects: 0,
        hasNext: false,
        hasPrevious: false
    });
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [currentExam, setCurrentExam] = useState<ExamWithBatches | null>(null);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [questionSheets, setQuestionSheets] = useState<QuestionSheet[]>([]);
    
    // State for batch dropdown
    const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState<boolean>(false);
    const [batchLoading, setBatchLoading] = useState<boolean>(false);
    const [batchPagination, setBatchPagination] = useState<BatchPaginationState>({
        page: 1,
        limit: 5, // Show 5 batches per page
        totalPages: 1,
        totalObjects: 0,
        hasNext: false,
        hasPrevious: false
    });
    
    const [formData, setFormData] = useState<FormData>({
        exam_id: '',
        title: '',
        description: '',
        exam_name: '',
        startDateTime: '',
        endDateTime: '',
        total_marks: 0,
        pass_marks: 0,
        question_sheet_id: '',
        batches: []
    });
    const [formErrors, setFormErrors] = useState<FormErrors>({
        exam_id: '',
        title: '',
        exam_name: '',
        startDateTime: '',
        endDateTime: '',
        total_marks: '',
        pass_marks: '',
        question_sheet_id: '',
        batches: ''
    });

    useEffect(() => {
        fetchExams();
        fetchQuestionSheets();
    }, [pagination.page]);

    // Fetch batches when batch pagination changes or dropdown opens
    useEffect(() => {
        if (isBatchDropdownOpen) {
            fetchBatchesWithPagination();
        }
    }, [batchPagination.page, isBatchDropdownOpen]);

    // Click outside handler for batch dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (isBatchDropdownOpen && !target.closest('.batch-dropdown')) {
                setIsBatchDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isBatchDropdownOpen]);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const { success, data, error } = await getExams(pagination.page, pagination.limit);
            if (success && data) {
                // Type assertion to ensure we have the correct structure
                const typedExams = data.data as ExamWithBatches[];
                setExams(typedExams);
                setPagination({
                    ...pagination,
                    totalPages: data.pagination.totalPages,
                    totalObjects: data.pagination.totalObjects,
                    hasNext: data.pagination.hasNext,
                    hasPrevious: data.pagination.hasPrevious
                });
            } else {
                toast.error(error || 'Failed to fetch exams');
            }
        } catch (err) {
            toast.error('An error occurred while fetching exams');
        } finally {
            setLoading(false);
        }
    };

    // Function to fetch batches with pagination from API
    const fetchBatchesWithPagination = async () => {
        setBatchLoading(true);
        try {
            const response = await fetchBatches(batchPagination.page, batchPagination.limit);
            
            // TypeScript safety: ensure response has the expected shape
            if (response && 'batches' in response && 'pagination' in response) {
                const typedResponse = response as unknown as BatchesResponse;
                
                setBatches(typedResponse.batches || []);
                setBatchPagination({
                    ...batchPagination,
                    totalPages: typedResponse.pagination.totalPages || 1,
                    totalObjects: typedResponse.pagination.totalObjects || 0,
                    hasNext: typedResponse.pagination.hasNext || false,
                    hasPrevious: typedResponse.pagination.hasPrevious || false
                });
            } else {
                toast.error('Invalid response format from batch API');
                setBatches([]);
            }
        } catch (error) {
            console.error('Error fetching batches:', error);
            setBatches([]);
            // Error is already handled by toast in the API function
        } finally {
            setBatchLoading(false);
        }
    };

    const fetchQuestionSheets = async () => {
        try {
            const { success, data, error } = await getQuestionSheets();
            if (success && data) {
                setQuestionSheets(data);
            } else {
                toast.error(error || 'Failed to fetch question sheets');
            }
        } catch (err) {
            toast.error('An error occurred while fetching question sheets');
        }
    };

    // Get filtered batches (exclude already selected ones)
    const getFilteredBatches = () => {
        return batches.filter(batch => !formData.batches.includes(batch._id));
    };

    // Handle batch pagination
    const handleBatchPageChange = (newPage: number) => {
        if (newPage > 0 && (batchPagination.totalPages === 0 || newPage <= batchPagination.totalPages)) {
            setBatchPagination({ ...batchPagination, page: newPage });
        }
    };

    const handlePageChange = (newPage: number) => {
        setPagination({ ...pagination, page: newPage });
    };

    const openEditModal = (exam: ExamWithBatches) => {
        setCurrentExam(exam);
        
        // Format dates safely
        let startDateTime = '';
        let endDateTime = '';
        
        try {
            startDateTime = format(new Date(exam.startDateTime), "yyyy-MM-dd'T'HH:mm");
        } catch (error) {
            console.error('Error formatting start date:', error);
            startDateTime = ''; // Fallback
        }
        
        try {
            endDateTime = format(new Date(exam.endDateTime), "yyyy-MM-dd'T'HH:mm");
        } catch (error) {
            console.error('Error formatting end date:', error);
            endDateTime = ''; // Fallback
        }
        
        setFormData({
            exam_id: exam.exam_id,
            title: exam.title,
            description: exam.description || '',
            exam_name: exam.exam_name,
            startDateTime,
            endDateTime,
            total_marks: exam.total_marks,
            pass_marks: exam.pass_marks,
            question_sheet_id: exam.question_sheet_id?._id || '',
            batches: exam.batches.map(batch => batch._id)
        });
        
        setEditModalOpen(true);
        
        // Reset batch dropdown state when opening the modal
        setBatchPagination({...batchPagination, page: 1});
        setIsBatchDropdownOpen(false);
    };

    const openDeleteModal = (exam: ExamWithBatches) => {
        setCurrentExam(exam);
        setDeleteModalOpen(true);
    };

    const closeEditModal = () => {
        setEditModalOpen(false);
        setCurrentExam(null);
        setFormErrors({
            exam_id: '',
            title: '',
            exam_name: '',
            startDateTime: '',
            endDateTime: '',
            total_marks: '',
            pass_marks: '',
            question_sheet_id: '',
            batches: ''
        });
        setIsBatchDropdownOpen(false);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setCurrentExam(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numValue = value === '' ? 0 : Number(value);
        
        setFormData(prev => ({ ...prev, [name]: numValue }));

        // Clear error when user starts typing
        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user makes a selection
        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleMultiSelectChange = (name: string, values: string[]) => {
        setFormData(prev => ({ ...prev, [name]: values }));

        // Clear error when user makes a selection
        if (formErrors[name as keyof FormErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = (): boolean => {
        let valid = true;
        const newErrors: FormErrors = {
            exam_id: '',
            title: '',
            exam_name: '',
            startDateTime: '',
            endDateTime: '',
            total_marks: '',
            pass_marks: '',
            question_sheet_id: '',
            batches: ''
        };

        if (!formData.exam_id) {
            newErrors.exam_id = 'Exam ID is required';
            valid = false;
        }
        if (!formData.title) {
            newErrors.title = 'Title is required';
            valid = false;
        }
        if (!formData.exam_name) {
            newErrors.exam_name = 'Exam name is required';
            valid = false;
        }
        if (!formData.startDateTime) {
            newErrors.startDateTime = 'Start date/time is required';
            valid = false;
        }
        if (!formData.endDateTime) {
            newErrors.endDateTime = 'End date/time is required';
            valid = false;
        } else if (new Date(formData.endDateTime) <= new Date(formData.startDateTime)) {
            newErrors.endDateTime = 'End date/time must be after start date/time';
            valid = false;
        }
        if (formData.total_marks <= 0) {
            newErrors.total_marks = 'Total marks must be greater than 0';
            valid = false;
        }
        if (formData.pass_marks <= 0) {
            newErrors.pass_marks = 'Pass marks must be greater than 0';
            valid = false;
        } else if (formData.pass_marks > formData.total_marks) {
            newErrors.pass_marks = 'Pass marks cannot exceed total marks';
            valid = false;
        }
        if (!formData.question_sheet_id) {
            newErrors.question_sheet_id = 'Question sheet is required';
            valid = false;
        }
        if (formData.batches.length === 0) {
            newErrors.batches = 'At least one batch must be selected';
            valid = false;
        }

        setFormErrors(newErrors);
        return valid;
    };

    const handleSubmit = async () => {
        if (!validateForm() || !currentExam) return;

        try {
            // Convert dates to ISO format for API
            const startDateTime = new Date(formData.startDateTime).toISOString();
            const endDateTime = new Date(formData.endDateTime).toISOString();
            
            const { success, data, error } = await updateExam(currentExam.exam_id, {
                ...formData,
                startDateTime,
                endDateTime
            });

            if (success && data) {
                toast.success('Exam updated successfully');
                fetchExams();
                closeEditModal();
            } else {
                toast.error(error || 'Failed to update exam');
            }
        } catch (err) {
            toast.error('An error occurred while updating the exam');
        }
    };

    const handleDelete = async () => {
        if (!currentExam) return;

        try {
            const { success, data, error } = await deleteExam(currentExam._id);

            if (success && data) {
                toast.success('Exam deleted successfully');
                fetchExams();
                closeDeleteModal();
            } else {
                toast.error(error || 'Failed to delete exam');
            }
        } catch (err) {
            toast.error('An error occurred while deleting the exam');
        }
    };

    const formatDateTime = (dateString: string) => {
        try {
            return format(new Date(dateString), 'PPpp');
        } catch (error) {
            return 'Invalid date';
        }
    };

    // Render a responsive card for mobile view
    const renderExamMobileCard = (exam: ExamWithBatches) => (
        <Card key={exam._id} className="mb-4">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{exam.exam_name}</CardTitle>
                        <Badge variant="outline" className="mt-1">{exam.exam_id}</Badge>
                    </div>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(exam)}
                            title="Edit Exam"
                        >
                            <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteModal(exam)}
                            title="Delete Exam"
                            className="text-destructive hover:text-destructive"
                        >
                            <DeleteIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0 pb-3">
                <div className="space-y-3">
                    <div>
                        <p className="font-medium text-sm">{exam.title}</p>
                        {exam.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {exam.description.length > 50
                                    ? `${exam.description.substring(0, 50)}...`
                                    : exam.description}
                            </p>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <p className="font-medium flex items-center gap-1">
                                <ScheduleIcon className="h-3 w-3 text-primary" /> Schedule
                            </p>
                            <p className="text-xs mt-1">Start: {formatDateTime(exam.startDateTime)}</p>
                            <p className="text-xs">End: {formatDateTime(exam.endDateTime)}</p>
                        </div>
                        
                        <div>
                            <p className="font-medium flex items-center gap-1">
                                <AssignmentIcon className="h-3 w-3 text-primary" /> Marks
                            </p>
                            <p className="text-xs mt-1">Total: {exam.total_marks}</p>
                            <p className="text-xs">Pass: {exam.pass_marks}</p>
                        </div>
                    </div>
                    
                    <div>
                        <p className="font-medium text-sm flex items-center gap-1">
                            <AssignmentIcon className="h-3 w-3 text-primary" /> Question Sheet
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">
                            {exam.question_sheet_id?.sheetName || 'No sheet assigned'}
                        </Badge>
                    </div>
                    
                    <div>
                        <p className="font-medium text-sm flex items-center gap-1">
                            <GroupIcon className="h-3 w-3 text-primary" /> Batches
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {exam.batches.map((batch) => (
                                <Badge key={batch._id} variant="secondary" className="text-xs">
                                    {batch.batch_name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="container mx-auto py-4 sm:py-8 font-Urbanist px-4 sm:px-10">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Exam Management</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">Manage and update scheduled examinations</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={fetchExams}
                        disabled={loading}
                        size="sm"
                        className="sm:size-default"
                    >
                        <RefreshIcon className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoaderIcon className="h-8 w-8 animate-spin" />
                    </div>
                ) : exams.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>No exams found</CardTitle>
                        </CardHeader>
                    </Card>
                ) : (
                    <>
                        {/* Mobile view - cards */}
                        <div className="sm:hidden">
                            {exams.map(renderExamMobileCard)}
                        </div>

                        {/* Desktop view - table */}
                        <div className="hidden sm:block">
                            <Card>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Exam ID</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Title</TableHead>
                                            <TableHead>Schedule</TableHead>
                                            <TableHead>Marks</TableHead>
                                            <TableHead>Question Sheet</TableHead>
                                            <TableHead>Batches</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {exams.map((exam) => (
                                            <TableRow key={exam._id}>
                                                <TableCell>
                                                    <Badge variant="outline">{exam.exam_id}</Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">{exam.exam_name}</TableCell>
                                                <TableCell>
                                                    <div>{exam.title}</div>
                                                    {exam.description && (
                                                        <div className="text-sm text-muted-foreground">
                                                            {exam.description.length > 20
                                                                ? `${exam.description.substring(0, 20)}...`
                                                                : exam.description}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <ScheduleIcon className="h-4 w-4 text-primary" />
                                                        <div>
                                                            <div className="text-sm">
                                                                <span className="font-medium">Start:</span> {formatDateTime(exam.startDateTime)}
                                                            </div>
                                                            <div className="text-sm">
                                                                <span className="font-medium">End:</span> {formatDateTime(exam.endDateTime)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <AssignmentIcon className="h-4 w-4 text-primary" />
                                                        <div>
                                                            <div className="text-sm">
                                                                <span className="font-medium">Total:</span> {exam.total_marks}
                                                            </div>
                                                            <div className="text-sm">
                                                                <span className="font-medium">Pass:</span> {exam.pass_marks}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="flex items-center gap-1">
                                                        <AssignmentIcon className="h-3 w-3" />
                                                        {exam.question_sheet_id?.sheetName || 'No sheet assigned'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {exam.batches.map((batch) => (
                                                            <Badge key={batch._id} variant="secondary" className="flex items-center gap-1">
                                                                <GroupIcon className="h-3 w-3" />
                                                                {batch.batch_name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEditModal(exam)}
                                                            title="Edit Exam"
                                                        >
                                                            <EditIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openDeleteModal(exam)}
                                                            title="Delete Exam"
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <DeleteIcon className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>

                        {/* Pagination - works for both mobile and desktop */}
                        <div className="flex justify-center mt-4">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            disabled={pagination.page === 1}
                                            className="sm:size-default"
                                        >
                                            <ChevronLeft className="h-4 w-4 sm:mr-1" />
                                            <span className="hidden sm:inline">Previous</span>
                                        </Button>
                                    </PaginationItem>
                                    
                                    {/* Show page numbers on desktop, just current page on mobile */}
                                    <div className="hidden sm:flex">
                                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                                            <PaginationItem key={page}>
                                                <Button
                                                    variant={page === pagination.page ? "default" : "ghost"}
                                                    size="sm"
                                                    onClick={() => handlePageChange(page)}
                                                    className="sm:size-default"
                                                >
                                                    {page}
                                                </Button>
                                            </PaginationItem>
                                        ))}
                                    </div>
                                    <PaginationItem className="sm:hidden">
                                        <span className="text-sm">
                                            Page {pagination.page} of {pagination.totalPages}
                                        </span>
                                    </PaginationItem>
                                    
                                    <PaginationItem>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            disabled={pagination.page === pagination.totalPages}
                                            className="sm:size-default"
                                        >
                                            <span className="hidden sm:inline">Next</span>
                                            <ChevronRight className="h-4 w-4 sm:ml-1" />
                                        </Button>
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </>
                )}

                {/* Edit Exam Modal - Made responsive */}
                <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                    <DialogContent className="sm:max-w-3xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <SchoolIcon className="h-5 w-5 text-primary" />
                                Edit Exam: {currentExam?.exam_name}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4 font-Urbanist">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="exam_id">Exam ID</Label>
                                    <Input
                                        id="exam_id"
                                        name="exam_id"
                                        value={formData.exam_id}
                                        onChange={handleInputChange}
                                        disabled
                                    />
                                    {formErrors.exam_id && (
                                        <p className="text-sm text-destructive">{formErrors.exam_id}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="exam_name">Exam Name *</Label>
                                    <Input
                                        id="exam_name"
                                        name="exam_name"
                                        value={formData.exam_name}
                                        onChange={handleInputChange}
                                    />
                                    {formErrors.exam_name && (
                                        <p className="text-sm text-destructive">{formErrors.exam_name}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                    />
                                    {formErrors.title && (
                                        <p className="text-sm text-destructive">{formErrors.title}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="startDateTime">Start Date & Time *</Label>
                                    <Input
                                        id="startDateTime"
                                        name="startDateTime"
                                        type="datetime-local"
                                        value={formData.startDateTime}
                                        onChange={handleInputChange}
                                    />
                                    {formErrors.startDateTime && (
                                        <p className="text-sm text-destructive">{formErrors.startDateTime}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDateTime">End Date & Time *</Label>
                                    <Input
                                        id="endDateTime"
                                        name="endDateTime"
                                        type="datetime-local"
                                        value={formData.endDateTime}
                                        onChange={handleInputChange}
                                    />
                                    {formErrors.endDateTime && (
                                        <p className="text-sm text-destructive">{formErrors.endDateTime}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="total_marks">Total Marks *</Label>
                                    <Input
                                        id="total_marks"
                                        name="total_marks"
                                        type="number"
                                        value={formData.total_marks || ''}
                                        onChange={handleNumberInputChange}
                                    />
                                    {formErrors.total_marks && (
                                        <p className="text-sm text-destructive">{formErrors.total_marks}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pass_marks">Pass Marks *</Label>
                                    <Input
                                        id="pass_marks"
                                        name="pass_marks"
                                        type="number"
                                        value={formData.pass_marks || ''}
                                        onChange={handleNumberInputChange}
                                    />
                                    {formErrors.pass_marks && (
                                        <p className="text-sm text-destructive">{formErrors.pass_marks}</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Question Sheet *</Label>
                                <Select
                                    value={formData.question_sheet_id}
                                    onValueChange={(value) => handleSelectChange('question_sheet_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a question sheet" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {questionSheets.map((sheet) => (
                                            <SelectItem key={sheet._id} value={sheet._id}>
                                                {sheet?.sheetName || 'No sheet'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {formErrors.question_sheet_id && (
                                    <p className="text-sm text-destructive">{formErrors.question_sheet_id}</p>
                                )}
                            </div>
                            
                            {/* Updated Responsive Batch Dropdown UI with API Pagination */}
                            <div className="space-y-2 font-Urbanist batch-dropdown">
                                <Label>Batches *</Label>
                                
                                {/* Selected Batches Display - Responsive */}
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {formData.batches.map(batchId => {
                                        // Find the batch in our current batches array
                                        const batch = batches.find(b => b._id === batchId);
                                        
                                        // If not found in current batch list (which is paginated)
                                        // Create a placeholder for the selected batch
                                        const batchName = batch ? batch.batch_name : `Batch ${batchId.substring(0, 6)}...`;
                                        
                                        return (
                                            <Badge key={batchId} variant="secondary" className="flex items-center gap-1 text-sm">
                                                <GroupIcon className="h-3 w-3" />
                                                <span className="max-w-[150px] truncate">{batchName}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleMultiSelectChange('batches', formData.batches.filter(id => id !== batchId))}
                                                    className="ml-1 hover:bg-slate-200 rounded-full p-1"
                                                    aria-label={`Remove ${batchName}`}
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        );
                                    })}
                                    {formData.batches.length === 0 && (
                                        <p className="text-sm text-muted-foreground">No batches selected</p>
                                    )}
                                </div>
                                
                                {/* Batch Dropdown - Responsive */}
                                <div className="relative">
                                    <div 
                                        className="relative w-full border rounded-md cursor-pointer"
                                        onClick={() => {
                                            const willOpen = !isBatchDropdownOpen;
                                            setIsBatchDropdownOpen(willOpen);
                                            if (willOpen) {
                                                fetchBatchesWithPagination();
                                            }
                                        }}
                                    >
                                        <div className="flex items-center justify-between p-2">
                                            <span className="text-sm text-gray-700">
                                                Click to select batches
                                            </span>
                                            <svg 
                                                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isBatchDropdownOpen ? 'transform rotate-180' : ''}`}
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24" 
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Dropdown Content - Responsive */}
                                    {isBatchDropdownOpen && (
                                        <div className="absolute z-50 left-0 right-0 mt-1 border rounded-md bg-white shadow-lg max-h-[60vh] sm:max-h-[300px] overflow-hidden flex flex-col">
                                            {/* Batch list with fixed height and scrollable */}
                                            <div className="flex-grow overflow-y-auto">
                                                {batchLoading ? (
                                                    <div className="py-4 text-center">
                                                        <LoaderIcon className="h-5 w-5 animate-spin mx-auto" />
                                                        <p className="text-sm text-gray-500 mt-2">Loading batches...</p>
                                                    </div>
                                                ) : getFilteredBatches().length > 0 ? (
                                                    getFilteredBatches().map(batch => (
                                                        <div 
                                                            key={batch._id}
                                                            className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMultiSelectChange('batches', [...formData.batches, batch._id]);
                                                            }}
                                                        >
                                                            <div className="flex-1 text-sm font-Urbanist">
                                                                <GroupIcon className="h-3 w-3 inline-block mr-2" />
                                                                <span className="truncate">{batch.batch_name}</span>
                                                            </div>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                className="h-6 px-2 text-xs"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleMultiSelectChange('batches', [...formData.batches, batch._id]);
                                                                }}
                                                                type="button"
                                                            >
                                                                Add
                                                            </Button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="py-3 px-3 text-center text-sm text-gray-500">
                                                        No more batches available
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Pagination Controls - Fixed at bottom */}
                                            <div className="border-t p-2 bg-gray-50 flex items-center justify-between">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleBatchPageChange(batchPagination.page - 1);
                                                    }}
                                                    disabled={!batchPagination.hasPrevious}
                                                    className="h-7 px-2 text-xs"
                                                    type="button"
                                                >
                                                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                                                    <span className="hidden sm:inline">Previous</span>
                                                </Button>
                                                
                                                <span className="text-xs text-gray-500 font-Urbanist">
                                                    Page {batchPagination.page} of {batchPagination.totalPages || 1}
                                                </span>
                                                
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleBatchPageChange(batchPagination.page + 1);
                                                    }}
                                                    disabled={!batchPagination.hasNext}
                                                    className="h-7 px-2 text-xs"
                                                    type="button"
                                                >
                                                    <span className="hidden sm:inline">Next</span>
                                                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {formErrors.batches && (
                                    <p className="text-sm text-destructive">{formErrors.batches}</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter className='font-Urbanist flex-col sm:flex-row gap-2 sm:gap-0'>
                            <Button 
                                variant="outline" 
                                onClick={closeEditModal} 
                                className="w-full sm:w-auto"
                                type="button"
                            >
                                <CancelIcon className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSubmit} 
                                className="w-full sm:w-auto"
                                type="button"
                            >
                                <CheckCircleIcon className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Modal - Made responsive */}
                <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen} >
                    <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="font-Urbanist">Confirm Exam Deletion</AlertDialogTitle>
                            <AlertDialogDescription className="font-Urbanist">
                                Are you sure you want to delete the exam <strong>{currentExam?.exam_name}</strong> (ID: {currentExam?.exam_id})?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2 font-Urbanist">
                            <p className="text-sm text-destructive">
                                Warning: This action cannot be undone. All data related to this exam will be permanently removed.
                            </p>
                            {currentExam && (
                                <>
                                    <div className="border-t pt-2">
                                        <p className="font-medium">Exam Details:</p>
                                        <p className="text-sm">Title: {currentExam.title}</p>
                                        <p className="text-sm">Schedule: {formatDateTime(currentExam.startDateTime)} to {formatDateTime(currentExam.endDateTime)}</p>
                                        <p className="text-sm">Total Marks: {currentExam.total_marks}</p>
                                    </div>
                                </>
                            )}
                        </div>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                            <AlertDialogCancel 
                                onClick={closeDeleteModal} 
                                className="w-full sm:w-auto"
                            >
                                <CancelIcon className="mr-2 h-4 w-4" />
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-destructive hover:bg-destructive/90 w-full sm:w-auto"
                            >
                                <DeleteIcon className="mr-2 h-4 w-4" />
                                Delete Exam
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
};

export default ExamsManagement;