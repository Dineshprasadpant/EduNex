"use client";
import { useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEvent, handleApiError } from "../../../../../apiCalls/addEvents";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { deleteUploadedFile, uploadFile } from "../../../../../apiCalls/fileUpload";
import {
    Calendar, User, MapPin, FileText, Plus, Trash2,
    Upload, FileDown, Loader,
    GalleryHorizontal
} from "lucide-react";
import Image from "next/image";

// File upload utility function
const uploadFiles = async (file: File) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        console.log('Uploading file:', file.name);

        const result = await uploadFile(file)

        return {
            success: true,
            data: result.data || result
        };
    } catch (error) {
        console.error("Error in uploadFile:", error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error during file upload'
        };
    }
};

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// File type interface
interface ResourceMaterial {
    materialName: string;
    fileType: string;
    fileSize: number;
    url: string;
}

interface ExtraInformation {
    title: string;
    description: string;
}

interface Organizer {
    name: string;
    email: string;
    phone: string;
}

interface Venue {
    name: string;
    address: string;
}

interface EventFormData {
    title: string;
    description: string;
    event_type: string;
    organizer: Organizer;
    start_date: string;
    end_date: string;
    month: string;
    year: string;
    venue: Venue;
    resourceMaterials: ResourceMaterial[];
    extraInformation: ExtraInformation[];
}

interface EventFormProps {
    onSuccess?: () => void;
}

// File Upload Input Component
interface FileUploadInputProps {
    id: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isUploading: boolean;
    accept?: string;
    multiple?: boolean;
    label?: string;
    type?: 'default' | 'image';
}

const FileUploadInput: React.FC<FileUploadInputProps> = ({
    id,
    onChange,
    isUploading,
    accept = 'image/png, image/jpeg, application/pdf, .doc, .docx, .xls, .xlsx, .txt',
    multiple = false,
    label = 'Choose File',
    type = 'default'
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
                <div className={`border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors flex flex-col items-center justify-center ${type === 'image' ? 'h-40' : 'h-24'}`}>
                    <div className={`flex flex-col items-center gap-2 text-gray-700 ${type === 'image' ? 'mb-2' : ''}`}>
                        <div className="bg-gray-100 h-10 w-10 rounded-full flex items-center justify-center">
                            <Upload className="h-5 w-5 text-gray-600" />
                        </div>
                        <span className="font-Urbanist text-center">{label}</span>
                        <p className="text-xs text-gray-500 font-Urbanist text-center mt-1 max-w-xs">
                            {type === 'image' ?
                                'Accepted formats: PNG, JPG (max 5MB)' :
                                'Accepted formats: PDF, DOC, XLS, TXT (max 10MB)'}
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
            multiple={multiple}
        />
    </div>
);

// Helper function to get file type icon
const getFileTypeIcon = (fileType: string) => {
    if (!fileType) return <FileText className="h-5 w-5" />;

    const type = fileType.toLowerCase();
    if (type === 'pdf') return <FileText className="h-5 w-5" />;
    if (['doc', 'docx'].includes(type)) return <FileText className="h-5 w-5" />;
    if (['xls', 'xlsx'].includes(type)) return <FileText className="h-5 w-5" />;
    if (['png', 'jpg', 'jpeg', 'image'].includes(type)) return <GalleryHorizontal className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
};

export function EventForm() {
    const initialFormState: EventFormData = {
        title: "",
        description: "",
        event_type: "",
        organizer: {
            name: "",
            email: "",
            phone: "",
        },
        start_date: "",
        end_date: "",
        month: "",
        year: "",
        venue: {
            name: "",
            address: "",
        },
        resourceMaterials: [],
        extraInformation: [],
    };

    const [formData, setFormData] = useState<EventFormData>(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 5;

    const [uploadingFiles, setUploadingFiles] = useState<Record<number, boolean>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleOrganizerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            organizer: { ...prev.organizer, [name]: value },
        }));
    };

    const handleVenueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            venue: { ...prev.venue, [name]: value },
        }));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };

            if (name === 'start_date' && value) {
                const date = new Date(value);
                const month = months[date.getMonth()];
                const year = date.getFullYear().toString();
                return { ...updated, month, year };
            }

            return updated;
        });
    };

    const addResourceMaterial = () => {
        setFormData((prev) => ({
            ...prev,
            resourceMaterials: [
                ...prev.resourceMaterials,
                { materialName: "", fileType: "", fileSize: 0, url: "" },
            ],
        }));
    };

    const updateResourceMaterial = (index: number, field: keyof ResourceMaterial, value: string | number) => {
        setFormData((prev) => {
            const updated = [...prev.resourceMaterials];
            updated[index] = {
                ...updated[index],
                [field]: value
            };
            return { ...prev, resourceMaterials: updated };
        });
    };

    const addExtraInformation = () => {
        setFormData((prev) => ({
            ...prev,
            extraInformation: [...prev.extraInformation, { title: "", description: "" }],
        }));
    };

    const updateExtraInformation = (index: number, field: keyof ExtraInformation, value: string) => {
        setFormData((prev) => {
            const updated = [...prev.extraInformation];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, extraInformation: updated };
        });
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setCurrentStep(1);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, resourceIndex: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error(`File size exceeds 10MB limit`);
            return;
        }

        try {
            setUploadingFiles(prev => ({ ...prev, [resourceIndex]: true }));

            console.log(`Uploading file for resource ${resourceIndex}:`, file.name);

            const result = await uploadFiles(file);
            console.log("Upload result:", result);

            if (result.success && result.data) {
                const fileType = result.data.format ||
                    (file.name ? file.name.split('.').pop() : 'file');

                updateResourceMaterial(resourceIndex, "url", result.data.url);
                updateResourceMaterial(resourceIndex, "fileType", fileType || '');
                updateResourceMaterial(resourceIndex, "fileSize", Math.round(result.data.size / 1024));

                if (!formData.resourceMaterials[resourceIndex].materialName) {
                    const fileName = result.data.original_filename ||
                        result.data.public_id ||
                        `Resource ${resourceIndex + 1}`;
                    updateResourceMaterial(resourceIndex, "materialName", fileName);
                }

                toast.success('File uploaded successfully!');
            } else {
                toast.error(result.message || 'Failed to upload file');
            }
        } catch (error) {
            console.error("Error in file upload:", error);
            toast.error(error instanceof Error ? error.message : 'Failed to upload file. Please try again.');
        } finally {
            setUploadingFiles(prev => {
                const newState = { ...prev };
                delete newState[resourceIndex];
                return newState;
            });

            e.target.value = '';
        }
    };

    const validateCurrentStep = () => {
        let isValid = false;

        if (currentStep === 1) {
            isValid = Boolean(formData.title && formData.event_type && formData.description);
        } else if (currentStep === 2) {
            isValid = Boolean(formData.start_date && formData.end_date);
        } else if (currentStep === 3) {
            isValid = Boolean(formData.organizer.name && formData.organizer.email && formData.organizer.phone);
        } else if (currentStep === 4) {
            isValid = Boolean(formData.venue.name && formData.venue.address);
        } else if (currentStep === 5) {
            isValid = true;
        } else {
            console.warn("Unknown step in validation:", currentStep);
            isValid = true;
        }

        return isValid;
    };

    const nextStep = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        console.log("Next button clicked. Current step:", currentStep, "Total steps:", totalSteps);

        if (currentStep < totalSteps) {
            const isValid = validateCurrentStep();
            console.log("Current step validation:", isValid);

            if (isValid) {
                console.log(`Moving from step ${currentStep} to step ${currentStep + 1}`);
                setCurrentStep(prevStep => prevStep + 1);
                window.scrollTo(0, 0);
            } else {
                console.warn("Cannot proceed due to validation failure");
                toast.error("Please fill in all required fields before proceeding.");
            }
        } else {
            console.warn("Already at last step, cannot proceed further");
        }
    };

    const prevStep = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        console.log("Previous button clicked. Current step:", currentStep);

        if (currentStep > 1) {
            console.log(`Moving from step ${currentStep} to step ${currentStep - 1}`);
            setCurrentStep(prevStep => prevStep - 1);
            window.scrollTo(0, 0);
        } else {
            console.warn("Already at first step, cannot go back further");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submission attempted. Current step:", currentStep, "Total steps:", totalSteps);

        if (currentStep !== totalSteps) {
            console.warn("Preventing submission - not on final step");
            return;
        }

        if (new Date(formData.end_date) <= new Date(formData.start_date)) {
            toast.error("End date must be after start date");
            return;
        }

        setIsSubmitting(true);

        try {
            await createEvent(formData);
            toast.success("Event created successfully!");
            resetForm();
        } catch (error) {
            handleApiError(error, "Failed to create event");
        } finally {
            setIsSubmitting(false);
        }
    };



    const removeResourceMaterial = async (index: number) => {
        const resourceToRemove = formData.resourceMaterials[index];

        try {
            // Delete the file from S3 if it exists
            if (resourceToRemove.url && resourceToRemove.url.startsWith('http')) {
                await deleteUploadedFile(resourceToRemove.url);
            }

            setFormData((prev) => ({
                ...prev,
                resourceMaterials: prev.resourceMaterials.filter((_, i) => i !== index),
            }));

            toast.success("Resource material removed successfully");
        } catch (error) {
            console.error("Error removing resource material:", error);
            toast.error("Failed to remove resource material. Please try again.");
        }
    };

    const removeExtraInformation = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            extraInformation: prev.extraInformation.filter((_, i) => i !== index),
        }));
    };

    return (
        <div className="w-full bg-white overflow-scroll h-screen">
            <Toaster />

            <div className="bg-white border-b border-gray-200 px-10 py-6">
                <h1 className="text-2xl font-bold text-gray-800 font-Urbanist">Create New Event</h1>
                <p className="text-gray-600 mt-1 font-Urbanist">Fill in the event details below</p>

                <div className="mt-4 flex justify-between">
                    {[...Array(totalSteps)].map((_, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-Urbanist
                                ${currentStep > index + 1
                                    ? 'bg-gray-200 text-gray-700 border border-gray-300'
                                    : currentStep === index + 1
                                        ? 'bg-gray-800 text-white'
                                        : 'bg-gray-200 text-gray-500'}`}
                            >
                                {index + 1}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="relative w-full bg-gray-200 h-1 mt-4">
                    <div
                        className="absolute top-0 left-0 h-full bg-gray-800"
                        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    ></div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="p-6">
                    {/* Step 1: Event Basic Information */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800 font-Urbanist flex items-center">
                                <Calendar className="mr-2 h-5 w-5" />
                                Event Details
                            </h2>
                            <Card className="border border-gray-200">
                                <CardContent className="p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="title" className="text-gray-700 font-Urbanist">Event Title <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="title"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                required
                                                placeholder="Enter event title"
                                                className="font-Urbanist"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="event_type" className="text-gray-700 font-Urbanist">Event Type <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="event_type"
                                                name="event_type"
                                                value={formData.event_type}
                                                onChange={handleChange}
                                                required
                                                placeholder="Conference, Workshop, etc."
                                                className="font-Urbanist"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="description" className="text-gray-700 font-Urbanist">Description <span className="text-red-500">*</span></Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            required
                                            rows={4}
                                            placeholder="Describe your event in detail"
                                            className="font-Urbanist resize-none"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 2: Date & Time */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800 font-Urbanist flex items-center">
                                <Calendar className="mr-2 h-5 w-5" />
                                Schedule
                            </h2>
                            <Card className="border border-gray-200">
                                <CardContent className="p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="start_date" className="text-gray-700 font-Urbanist">Start Date <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="start_date"
                                                name="start_date"
                                                type="date"
                                                value={formData.start_date}
                                                onChange={handleDateChange}
                                                required
                                                className="font-Urbanist"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="end_date" className="text-gray-700 font-Urbanist">End Date <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="end_date"
                                                name="end_date"
                                                type="date"
                                                value={formData.end_date}
                                                onChange={handleDateChange}
                                                required
                                                className="font-Urbanist"
                                                min={formData.start_date}
                                            />
                                        </div>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="month" className="text-gray-700 font-Urbanist">Month (Auto-generated)</Label>
                                            <Input
                                                id="month"
                                                name="month"
                                                value={formData.month}
                                                readOnly
                                                className="bg-gray-50 font-Urbanist"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="year" className="text-gray-700 font-Urbanist">Year (Auto-generated)</Label>
                                            <Input
                                                id="year"
                                                name="year"
                                                value={formData.year}
                                                readOnly
                                                className="bg-gray-50 font-Urbanist"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 3: Organizer Information */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800 font-Urbanist flex items-center">
                                <User className="mr-2 h-5 w-5" />
                                Organizer Information
                            </h2>
                            <Card className="border border-gray-200">
                                <CardContent className="p-4 space-y-4">
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="organizer.name" className="text-gray-700 font-Urbanist">Name <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="organizer.name"
                                                name="name"
                                                value={formData.organizer.name}
                                                onChange={handleOrganizerChange}
                                                required
                                                placeholder="Enter organizer's name"
                                                className="font-Urbanist"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="organizer.email" className="text-gray-700 font-Urbanist">Email <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="organizer.email"
                                                name="email"
                                                type="email"
                                                value={formData.organizer.email}
                                                onChange={handleOrganizerChange}
                                                required
                                                placeholder="Enter contact email"
                                                className="font-Urbanist"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="organizer.phone" className="text-gray-700 font-Urbanist">Phone <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="organizer.phone"
                                                name="phone"
                                                value={formData.organizer.phone}
                                                onChange={handleOrganizerChange}
                                                required
                                                placeholder="Enter contact phone number"
                                                className="font-Urbanist"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 4: Venue Information */}
                    {currentStep === 4 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-800 font-Urbanist flex items-center">
                                <MapPin className="mr-2 h-5 w-5" />
                                Venue Details
                            </h2>
                            <Card className="border border-gray-200">
                                <CardContent className="p-4 space-y-4">
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="venue.name" className="text-gray-700 font-Urbanist">Venue Name <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="venue.name"
                                                name="name"
                                                value={formData.venue.name}
                                                onChange={handleVenueChange}
                                                required
                                                placeholder="Enter venue name"
                                                className="font-Urbanist"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="venue.address" className="text-gray-700 font-Urbanist">Address <span className="text-red-500">*</span></Label>
                                            <Textarea
                                                id="venue.address"
                                                name="address"
                                                value={formData.venue.address}
                                                onChange={handleVenueChange}
                                                required
                                                placeholder="Enter complete venue address"
                                                className="font-Urbanist resize-none"
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Step 5: Resources & Additional Info */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            {/* Resource Materials */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold text-gray-800 font-Urbanist flex items-center">
                                        <FileText className="mr-2 h-5 w-5" />
                                        Resource Materials
                                    </h2>
                                    <Button
                                        type="button"
                                        onClick={addResourceMaterial}
                                        variant="outline"
                                        className="font-Urbanist text-sm flex items-center gap-1"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Material
                                    </Button>
                                </div>

                                {formData.resourceMaterials.length === 0 ? (
                                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-center">
                                        <p className="text-gray-500 font-Urbanist">No materials added yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {formData.resourceMaterials.map((material, index) => (
                                            <Card key={index} className="border border-gray-200">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h3 className="font-medium font-Urbanist text-gray-700">Resource Material #{index + 1}</h3>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => removeResourceMaterial(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    {/* File Upload Section */}
                                                    {!material.url ? (
                                                        <div className="mb-4">
                                                            <FileUploadInput
                                                                id={`resourceFile-${index}`}
                                                                onChange={(e) => handleFileUpload(e, index)}
                                                                isUploading={!!uploadingFiles[index]}
                                                                label="Upload Document or Resource"
                                                                type={material.fileType?.toLowerCase().includes('image') ? 'image' : 'default'}
                                                            />
                                                            <p className="text-xs text-gray-500 font-Urbanist mt-2">
                                                                Or fill in the resource details manually below
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg">
                                                            <div className="p-3 flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                                                                        {getFileTypeIcon(material.fileType)}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-Urbanist text-gray-800">
                                                                            {material.materialName || material.url.split('/').pop()}
                                                                        </p>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            {material.fileType && (
                                                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-Urbanist text-gray-600">
                                                                                    {material.fileType.toUpperCase()}
                                                                                </span>
                                                                            )}
                                                                            {material.fileSize > 0 && (
                                                                                <span className="text-xs font-Urbanist text-gray-500">
                                                                                    {material.fileSize} KB
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex gap-2">
                                                                    <a
                                                                        href={material.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-100 font-Urbanist inline-flex items-center"
                                                                    >
                                                                        <FileDown className="h-3.5 w-3.5 mr-1" />
                                                                        View
                                                                    </a>

                                                                </div>
                                                            </div>

                                                            {/* Preview for images */}
                                                            {(material.fileType?.toLowerCase().includes('image') ||
                                                                material.url.match(/\.(jpeg|jpg|gif|png)$/i)) && (
                                                                    <div className="border-t border-gray-100 p-2 bg-gray-50">
                                                                        <div className="relative max-h-34 max-w-34">
                                                                            <img
                                                                                src={material.url}
                                                                                alt={material.materialName || "Resource Preview"}
                                                                                className="w-full h-34 object-contain rounded"
                                                                                onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/400x300?text=Image+Not+Found"; }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <Label className="text-gray-700 font-Urbanist">Material Name</Label>
                                                            <Input
                                                                value={material.materialName}
                                                                onChange={(e) => updateResourceMaterial(index, "materialName", e.target.value)}
                                                                placeholder="Enter material name"
                                                                className="font-Urbanist"
                                                            />
                                                        </div>

                                                        {!material.url && (
                                                            <>
                                                                <div className="space-y-1">
                                                                    <Label className="text-gray-700 font-Urbanist">File Type</Label>
                                                                    <Input
                                                                        value={material.fileType}
                                                                        onChange={(e) => updateResourceMaterial(index, "fileType", e.target.value)}
                                                                        placeholder="PDF, DOCX, etc."
                                                                        className="font-Urbanist"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-gray-700 font-Urbanist">File Size (KB)</Label>
                                                                    <Input
                                                                        type="number"
                                                                        value={material.fileSize}
                                                                        onChange={(e) => updateResourceMaterial(index, "fileSize", Number(e.target.value))}
                                                                        placeholder="Enter file size"
                                                                        className="font-Urbanist"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-gray-700 font-Urbanist">URL</Label>
                                                                    <Input
                                                                        value={material.url}
                                                                        onChange={(e) => updateResourceMaterial(index, "url", e.target.value)}
                                                                        placeholder="https://example.com/file.pdf"
                                                                        className="font-Urbanist"
                                                                    />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Extra Information */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold text-gray-800 font-Urbanist">Additional Information</h2>
                                    <Button
                                        type="button"
                                        onClick={addExtraInformation}
                                        variant="outline"
                                        className="font-Urbanist text-sm flex items-center gap-1"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Information
                                    </Button>
                                </div>

                                {formData.extraInformation.length === 0 ? (
                                    <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-center">
                                        <p className="text-gray-500 font-Urbanist">No additional information added</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {formData.extraInformation.map((info, index) => (
                                            <Card key={index} className="border border-gray-200">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h3 className="font-medium font-Urbanist text-gray-700">Additional Information #{index + 1}</h3>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => removeExtraInformation(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div className="space-y-1">
                                                            <Label className="text-gray-700 font-Urbanist">Title</Label>
                                                            <Input
                                                                value={info.title}
                                                                onChange={(e) => updateExtraInformation(index, "title", e.target.value)}
                                                                placeholder="Enter section title"
                                                                className="font-Urbanist"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-gray-700 font-Urbanist">Description</Label>
                                                            <Textarea
                                                                value={info.description}
                                                                onChange={(e) => updateExtraInformation(index, "description", e.target.value)}
                                                                rows={3}
                                                                placeholder="Provide additional details"
                                                                className="font-Urbanist resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between border-t border-gray-200 px-6 py-4">
                    <div>
                        {currentStep > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={(e) => prevStep(e)}
                                className="font-Urbanist"
                            >
                                Previous
                            </Button>
                        )}
                    </div>
                    <div className="flex space-x-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetForm}
                            className="font-Urbanist"
                        >
                            Reset
                        </Button>

                        {currentStep < totalSteps ? (
                            <Button
                                type="button"
                                onClick={(e) => nextStep(e)}
                                disabled={!validateCurrentStep()}
                                className="bg-gray-800 hover:bg-gray-700 text-white font-Urbanist"
                            >
                                Next Step ({currentStep}/{totalSteps})
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-gray-800 hover:bg-gray-700 text-white font-Urbanist"
                            >
                                {isSubmitting ? "Creating..." : "Create Event"}
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}