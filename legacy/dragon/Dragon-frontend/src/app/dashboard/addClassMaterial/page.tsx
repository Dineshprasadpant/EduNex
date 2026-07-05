"use client";
import { useState, useEffect, ChangeEvent } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getBatches, createClassMaterial, handleApiError } from "../../../../apiCalls/addClassMaterial";
import { deleteUploadedFile, uploadFilev2 } from "../../../../apiCalls/fileUpload";
import { Badge } from "@/components/ui/badge";
import { X, Link as LinkIcon, Upload, Loader, File, Info, ChevronLeft, ChevronRight } from "lucide-react";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Define types
interface Batch {
    _id: string;
    batch_name: string;
}

interface FormDataType {
    material_id: string;
    title: string;
    description: string;
    file_url: string; // Will contain S3 file key (e.g., "user-uploads/filename.pdf") for uploaded files, or URL for external links
    batches: string[];
}

export default function ClassMaterialForm() {
    const router = useRouter();
    const pathname = usePathname();

    const [formData, setFormData] = useState<FormDataType>({
        material_id: "",
        title: "",
        description: "",
        file_url: "",
        batches: [],
    });
    const [allBatches, setAllBatches] = useState<Batch[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [step, setStep] = useState<number>(1);
    const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState<boolean>(false);

    // Batch pagination state
    const [batchPage, setBatchPage] = useState<number>(1);
    const [batchTotalPages, setBatchTotalPages] = useState<number>(1);
    const [batchesPerPage] = useState<number>(5);

    // File upload states
    const [uploadingFile, setUploadingFile] = useState<boolean>(false);
    const [uploadedFileName, setUploadedFileName] = useState<string>("");
    const [uploadMode, setUploadMode] = useState<"url" | "file">("url");

    // Handle undefined route parameters
    useEffect(() => {
        if (pathname && pathname.includes('/undefined/')) {
            router.replace('/dashboard/addClassMaterial');
        }
    }, [pathname, router]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (isBatchDropdownOpen && !target.closest('.batch-dropdown-container')) {
                setIsBatchDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isBatchDropdownOpen]);

    useEffect(() => {
        const fetchBatches = async () => {
            setIsLoading(true);
            try {
                const response = await getBatches();
                setAllBatches(response.data);

                const totalPages = Math.ceil(response.data.length / batchesPerPage);
                setBatchTotalPages(Math.max(1, totalPages));
            } catch (error) {
                handleApiError(error, "Failed to load batches");
            } finally {
                setIsLoading(false);
            }
        };

        fetchBatches();
    }, [batchesPerPage]);

    const getCurrentPageBatches = (): Batch[] => {
        const filteredBatches = allBatches.filter(batch => !formData.batches.includes(batch._id));
        const startIndex = (batchPage - 1) * batchesPerPage;
        const endIndex = startIndex + batchesPerPage;
        return filteredBatches.slice(startIndex, endIndex);
    };

    const handleBatchPageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= batchTotalPages) {
            setBatchPage(newPage);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBatchSelect = (batchId: string) => {
        if (!formData.batches.includes(batchId)) {
            setFormData(prev => ({
                ...prev,
                batches: [...prev.batches, batchId],
            }));

            const remainingBatches = allBatches.filter(batch =>
                !formData.batches.includes(batch._id) && batch._id !== batchId
            );
            const newTotalPages = Math.ceil(remainingBatches.length / batchesPerPage);
            setBatchTotalPages(Math.max(1, newTotalPages));

            if (batchPage > newTotalPages) {
                setBatchPage(Math.max(1, newTotalPages));
            }
        }
    };

    const removeBatch = (batchId: string) => {
        setFormData(prev => ({
            ...prev,
            batches: prev.batches.filter(id => id !== batchId),
        }));

        const availableBatches = allBatches.filter(batch =>
            !formData.batches.includes(batch._id) || batch._id === batchId
        );
        const newTotalPages = Math.ceil(availableBatches.length / batchesPerPage);
        setBatchTotalPages(Math.max(1, newTotalPages));
    };

    // Handle file removal with AWS S3 deletion
    const handleRemoveFile = async () => {
        if (formData.file_url && uploadMode === "file") {
            try {
                toast.loading("Deleting file from S3...", { id: "delete-progress" });
                await deleteUploadedFile(formData.file_url);
                toast.success("File deleted successfully from S3", { id: "delete-progress" });
            } catch (error) {
                console.error("Error deleting file:", error);
                toast.error("Failed to delete file from S3. It may still exist in storage.", { id: "delete-progress" });
            }
        }

        setFormData(prev => ({ ...prev, file_url: "" }));
        setUploadedFileName("");
    };

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingFile(true);
            setUploadedFileName(file.name);

            // Show initial upload progress
            toast.loading("Generating upload URL...", { id: "upload-progress" });

            const result = await uploadFilev2(file);

            if (result.success) {
                setFormData(prev => ({
                    ...prev,
                    file_url: result.data.url
                }));
                toast.success("File uploaded successfully to S3!", { id: "upload-progress" });
            } else {
                toast.error(result.message || "Failed to upload file", { id: "upload-progress" });
                setUploadedFileName("");
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to upload file. Please try again.";
            toast.error(errorMessage, { id: "upload-progress" });
            setUploadedFileName("");
        } finally {
            setUploadingFile(false);
            e.target.value = '';
        }
    };

    const FileUploadInput = ({
        id,
        onChange,
        isUploading,
        accept = '*/*'
    }: {
        id: string;
        onChange: (e: ChangeEvent<HTMLInputElement>) => void;
        isUploading: boolean;
        accept?: string;
    }) => (
        <div className="w-full">
            {isUploading ? (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-blue-700">
                        <Loader className="h-5 w-5 animate-spin" />
                        <span className="font-medium">Uploading file...</span>
                    </div>
                </div>
            ) : (
                <Label htmlFor={id} className="cursor-pointer block w-full">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors flex flex-col items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-gray-700 mb-2">
                            <div className="bg-gray-100 h-12 w-12 rounded-full flex items-center justify-center">
                                <Upload className="h-6 w-6 text-gray-600" />
                            </div>
                            <span className="font-medium text-center">Drag files here or click to browse</span>
                            <p className="text-xs text-gray-500 text-center mt-1 max-w-xs">
                                Upload your learning material file (PDF, DOCX, PPTX, etc). Max size varies by file type
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await createClassMaterial(formData);
            setFormData({
                material_id: "",
                title: "",
                description: "",
                file_url: "",
                batches: [],
            });
            setUploadedFileName("");
            setUploadMode("url");
            setStep(1);
            toast.success("Material created successfully!");
        } catch (error) {
            handleApiError(error, "Failed to create material");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getBatchName = (batchId: string): string => {
        const batch = allBatches.find(b => b._id === batchId);
        return batch ? batch.batch_name : "Unknown Batch";
    };

    const handleReset = async () => {
        // Delete any uploaded file first
        if (formData.file_url && uploadMode === "file") {
            try {
                toast.loading("Cleaning up uploaded files...", { id: "reset-progress" });
                await deleteUploadedFile(formData.file_url);
                toast.success("Files cleaned up successfully", { id: "reset-progress" });
            } catch (error) {
                console.error("Error deleting file during reset:", error);
                toast.error("Some files may not have been cleaned up", { id: "reset-progress" });
            }
        }

        // Reset the form
        setFormData({
            material_id: "",
            title: "",
            description: "",
            file_url: "",
            batches: [],
        });
        setUploadedFileName("");
        setUploadMode("url");
        setStep(1);
    };

    const goToNextStep = () => {
        if (step === 1 && !formData.material_id.trim()) {
            handleApiError(null, "Material ID is required");
            return;
        }
        if (step === 1 && !formData.title.trim()) {
            handleApiError(null, "Title is required");
            return;
        }
        if (step === 1 && !formData.description.trim()) {
            handleApiError(null, "Description is required");
            return;
        }
        if (step === 1 && !formData.file_url.trim()) {
            handleApiError(null, "File URL or uploaded file is required");
            return;
        }
        setStep(2);
    };

    const goToPreviousStep = () => {
        setStep(1);
    };

    return (
        <div className="w-full px-10 py-6 mx-auto bg-white rounded-lg shadow-md">
            <Toaster position="top-right" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 font-Urbanist">Add Learning Material</h1>
                <p className="text-gray-600 mt-1 font-Urbanist">Create new material and assign it to batches</p>
            </div>

            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 1 ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'}`}>
                            1
                        </div>
                        <div className="ml-3">
                            <p className={`font-medium font-Urbanist ${step === 1 ? 'text-gray-800' : 'text-gray-500'}`}>Material Details</p>
                        </div>
                    </div>
                    <div className="w-16 h-0.5 bg-gray-200"></div>
                    <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 2 ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'}`}>
                            2
                        </div>
                        <div className="ml-3">
                            <p className={`font-medium font-Urbanist ${step === 2 ? 'text-gray-800' : 'text-gray-500'}`}>Batch Assignment</p>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {step === 1 && (
                    <Card className="border border-gray-200">
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <Label htmlFor="material_id" className="text-base font-medium text-gray-700 block mb-1.5 font-Urbanist">
                                        Material ID <span className="text-red-500">*</span>
                                    </Label>
                                    <p className="text-sm text-gray-500 mb-2 font-Urbanist">A unique identifier for this material (e.g., math101, cs202)</p>
                                    <Input
                                        id="material_id"
                                        name="material_id"
                                        value={formData.material_id}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter a unique ID"
                                        className="w-full"
                                    />
                                </div>

                                <Separator className="my-4" />

                                <div>
                                    <Label htmlFor="title" className="text-base font-medium text-gray-700 block mb-1.5 font-Urbanist">
                                        Title <span className="text-red-500">*</span>
                                    </Label>
                                    <p className="text-sm text-gray-500 mb-2 font-Urbanist">The name that will be displayed to students</p>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        placeholder="E.g., Introduction to Calculus"
                                        className="w-full"
                                    />
                                </div>

                                <Separator className="my-4" />

                                <div>
                                    <Label htmlFor="description" className="text-base font-medium text-gray-700 block mb-1.5 font-Urbanist">
                                        Description <span className="text-red-500">*</span>
                                    </Label>
                                    <p className="text-sm text-gray-500 mb-2 font-Urbanist">Provide details about what this material covers and what students will learn</p>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                        rows={4}
                                        placeholder="Describe what this material covers..."
                                        className="w-full resize-none"
                                    />
                                </div>

                                <Separator className="my-4" />

                                <div>
                                    <Label className="text-base font-medium text-gray-700 block mb-1.5 font-Urbanist">
                                        Material File <span className="text-red-500">*</span>
                                    </Label>
                                    <p className="text-sm text-gray-500 mb-2 font-Urbanist">Upload a file or provide a link to the material</p>

                                    <div className="flex space-x-4 mb-4">
                                        <Button
                                            type="button"
                                            variant={uploadMode === "url" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setUploadMode("url")}
                                            className={uploadMode === "url" ? "bg-gray-800 text-white" : ""}
                                        >
                                            <LinkIcon className="h-4 w-4 mr-2" />
                                            URL Link
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={uploadMode === "file" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setUploadMode("file")}
                                            className={uploadMode === "file" ? "bg-gray-800 text-white" : ""}
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Upload File
                                        </Button>
                                    </div>

                                    {uploadMode === "url" ? (
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                <LinkIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <Input
                                                id="file_url"
                                                name="file_url"
                                                type="url"
                                                value={formData.file_url}
                                                onChange={handleChange}
                                                required={uploadMode === "url"}
                                                placeholder="https://example.com/materials/math101.pdf"
                                                className="pl-10 w-full"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            {formData.file_url && uploadedFileName ? (
                                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                                    <div className="flex items-center">
                                                        <div className="bg-gray-100 p-2 rounded-full mr-3">
                                                            <File className="h-6 w-6 text-gray-500" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-800 mb-0.5">{uploadedFileName}</p>
                                                            <p className="text-xs text-gray-500">File uploaded successfully</p>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={handleRemoveFile}
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                            <a
                                                                href={formData.file_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="ml-1 inline-flex items-center text-xs text-blue-600 hover:underline"
                                                            >
                                                                View File
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <FileUploadInput
                                                    id="material-file-upload"
                                                    onChange={handleFileUpload}
                                                    isUploading={uploadingFile}
                                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt"
                                                />
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-3 flex items-start bg-blue-50 p-3 rounded-md border border-blue-100">
                                        <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                                        <p className="text-sm text-blue-700 font-Urbanist">
                                            {uploadMode === "url"
                                                ? "Provide a direct link to a file that students can download. Make sure the link is accessible to all students."
                                                : "Supported formats include PDF, Word documents, PowerPoint presentations, Excel spreadsheets, videos, audio files, and more. File size limits vary by type (PDFs up to 100MB, videos up to 500MB)."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mr-3"
                                    onClick={handleReset}
                                >
                                    Reset
                                </Button>
                                <Button
                                    type="button"
                                    onClick={goToNextStep}
                                    className="bg-gray-800 hover:bg-gray-700"
                                >
                                    Continue to Batch Assignment
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {step === 2 && (
                    <Card className="border border-gray-200">
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <h3 className="text-base font-medium text-gray-700 font-Urbanist">Material Summary</h3>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={goToPreviousStep}
                                                className="text-xs"
                                            >
                                                Edit Details
                                            </Button>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-md">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-500 font-Urbanist">ID:</p>
                                                    <p className="font-medium font-Urbanist">{formData.material_id}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500 font-Urbanist">Title:</p>
                                                    <p className="font-medium font-Urbanist">{formData.title}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-sm text-gray-500 font-Urbanist">File:</p>
                                                    <div className="flex items-center">
                                                        <File className="h-4 w-4 text-gray-500 mr-1" />
                                                        <p className="font-medium font-Urbanist truncate">
                                                            {uploadedFileName || formData.file_url || "No file specified"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Label className="text-base font-medium text-gray-700 block mb-1.5rem font-Urbanist">
                                        Batch Assignment <span className="text-red-500">*</span>
                                    </Label>
                                    <p className="text-sm text-gray-500 mb-4 font-Urbanist">Select which batches should have access to this learning material</p>

                                    {isLoading ? (
                                        <div className="flex justify-center py-6">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-800"></div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="relative batch-dropdown-container">
                                                <Label className="text-sm text-gray-600 font-Urbanist mb-2 block">
                                                    Select batches to add:
                                                </Label>
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        className="flex items-center justify-between w-full p-3 border border-gray-200 rounded-md bg-white hover:bg-gray-50"
                                                        onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
                                                    >
                                                        <span className="font-Urbanist text-gray-700">
                                                            {allBatches.filter(batch => !formData.batches.includes(batch._id)).length > 0
                                                                ? "Click to select batches"
                                                                : "All batches selected"}
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
                                                    </button>

                                                    {isBatchDropdownOpen && (
                                                        <div className="absolute z-10 mt-1 w-full border rounded-md bg-white shadow-lg">
                                                            <div className="max-h-48 overflow-y-auto p-2">
                                                                {getCurrentPageBatches().length > 0 ? (
                                                                    getCurrentPageBatches().map(batch => (
                                                                        <div
                                                                            key={batch._id}
                                                                            className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                                                                            onClick={() => {
                                                                                handleBatchSelect(batch._id);
                                                                            }}
                                                                        >
                                                                            <div className="flex items-center">
                                                                                <div className="w-4 h-4 rounded border border-gray-300 mr-2"></div>
                                                                                <span className="text-sm font-Urbanist">{batch.batch_name}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="p-4 text-center">
                                                                        <p className="text-sm text-gray-500 font-Urbanist">
                                                                            {allBatches.filter(batch => !formData.batches.includes(batch._id)).length === 0
                                                                                ? "All batches have been selected"
                                                                                : "No batches available on this page"}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {allBatches.filter(batch => !formData.batches.includes(batch._id)).length > batchesPerPage && (
                                                                <div className="border-t p-2 bg-gray-50 flex items-center justify-between">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleBatchPageChange(batchPage - 1)}
                                                                        disabled={batchPage === 1}
                                                                        className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md shadow-sm transition-colors
                                                                            ${batchPage === 1
                                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                                : 'bg-white text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                                                                    >
                                                                        <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                                                                        Previous
                                                                    </button>

                                                                    <span className="text-xs text-gray-500 font-Urbanist">
                                                                        Page {batchPage} of {batchTotalPages}
                                                                    </span>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleBatchPageChange(batchPage + 1)}
                                                                        disabled={batchPage >= batchTotalPages}
                                                                        className={`inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md shadow-sm transition-colors
                                                                            ${batchPage >= batchTotalPages
                                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                                : 'bg-white text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                                                                    >
                                                                        Next
                                                                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <Label className="text-sm text-gray-600 font-Urbanist mb-2 block">
                                                    Selected Batches: {formData.batches.length > 0 ? `(${formData.batches.length})` : ""}
                                                </Label>
                                                <div className="p-3 bg-white border border-gray-200 rounded-md min-h-12">
                                                    {formData.batches.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {formData.batches.map(batchId => (
                                                                <Badge
                                                                    key={batchId}
                                                                    variant="secondary"
                                                                    className="pl-3 py-1.5 pr-1 bg-blue-50 text-blue-700 border border-blue-100 font-Urbanist"
                                                                >
                                                                    {getBatchName(batchId)}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeBatch(batchId)}
                                                                        className="ml-2 rounded-full p-1 hover:bg-blue-100"
                                                                        aria-label={`Remove ${getBatchName(batchId)}`}
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-center items-center h-8">
                                                            <p className="text-sm text-gray-500 font-Urbanist">No batches selected</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="bg-yellow-50 p-4 rounded-md border-l-4 border-yellow-400">
                                                <p className="text-sm text-yellow-800 font-Urbanist">
                                                    <strong>Note:</strong> Students in selected batches will immediately get access to this material once created.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-8 flex justify-between">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={goToPreviousStep}
                                >
                                    Back to Details
                                </Button>
                                <div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="mr-3"
                                        onClick={handleReset}
                                    >
                                        Reset All
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || formData.batches.length === 0}
                                        className="bg-gray-800 hover:bg-gray-700"
                                    >
                                        {isSubmitting ? "Creating..." : "Create Material"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </form>
        </div>
    );
}