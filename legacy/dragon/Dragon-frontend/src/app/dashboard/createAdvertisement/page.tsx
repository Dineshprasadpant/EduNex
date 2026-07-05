"use client";
import { useState, ChangeEvent, FormEvent } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, Image as ImageIcon, Link as LinkIcon, Info, Upload, Loader, X } from 'lucide-react';
import { createAdvertisement, handleApiError } from "../../../../apiCalls/addAdvertisement";
import { deleteUploadedFile, uploadFile } from "../../../../apiCalls/fileUpload";
import Image from "next/image";

interface FormData {
    title: string;
    description: string;
    imageUrl: string;
    linkUrl: string;
}

interface FileUploadInputProps {
    id: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    isUploading: boolean;
    accept?: string;
    label?: string;
}

interface UploadResult {
    success: boolean;
    message?: string;
    data?: {
        url: string;
    };
}

const AddAdvertisement = () => {
    const [formData, setFormData] = useState<FormData>({
        title: "",
        description: "",
        imageUrl: "",
        linkUrl: "",
    });
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formStep, setFormStep] = useState<number>(1);
    const totalSteps = 4;

    // File upload state
    const [uploadingImage, setUploadingImage] = useState<boolean>(false);
    const [previewImage, setPreviewImage] = useState<string>("");

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle file upload
    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            toast.error("File size exceeds 5MB limit");
            return;
        }

        // Check file type (only allow images)
        if (!file.type.startsWith('image/')) {
            toast.error("Only image files are allowed");
            return;
        }

        try {
            setUploadingImage(true);

            // Upload the file
            const result = await uploadFile(file) as UploadResult;

            if (result.success) {
                // Update form data with the uploaded image URL
                setFormData(prev => ({
                    ...prev,
                    imageUrl: result.data?.url || ""
                }));

                // Set preview image
                setPreviewImage(result.data?.url || "");
                toast.success("Image uploaded successfully!");
            } else {
                toast.error(result.message || "Failed to upload image");
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error("Failed to upload image. Please try again.");
        } finally {
            setUploadingImage(false);
            e.target.value = ''; // Reset the file input
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await createAdvertisement({
                ...formData,
                imageUrl: previewImage || formData.imageUrl
            });
            toast.success("Advertisement created successfully!");

            // Reset form
            setFormData({
                title: "",
                description: "",
                imageUrl: "",
                linkUrl: "",
            });
            setPreviewImage("");
            setFormStep(1);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const nextStep = () => {
        setFormStep(prev => Math.min(prev + 1, totalSteps));
    };

    const prevStep = () => {
        setFormStep(prev => Math.max(prev - 1, 1));
    };

    const isStepComplete = (step: number): boolean => {
        switch (step) {
            case 1:
                return formData.title.trim() !== '';
            case 2:
                return formData.description.trim() !== '';
            case 3:
                return formData.imageUrl.trim() !== '' || previewImage !== '';
            case 4:
                return formData.linkUrl.trim() !== '';
            default:
                return false;
        }
    };

    const renderProgressBar = () => {
        return (
            <div className="mb-8">
                <div className="flex justify-between mb-2">
                    {Array.from({ length: totalSteps }).map((_, index) => (
                        <div
                            key={index}
                            className={`relative flex items-center justify-center rounded-full transition-all
                                ${formStep > index + 1 ? 'bg-gray-700' : formStep === index + 1 ? 'bg-gray-800' : 'bg-gray-200'}
                                w-8 h-8 text-white font-medium cursor-pointer`}
                            onClick={() => isStepComplete(index + 1) ? setFormStep(index + 1) : null}
                        >
                            {formStep > index + 1 ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                        </div>
                    ))}
                </div>
                <div className="relative w-full bg-gray-200 h-2 rounded-full">
                    <div
                        className="absolute top-0 left-0 h-full bg-gray-700 rounded-full transition-all"
                        style={{ width: `${(formStep / totalSteps) * 100}%` }}
                    />
                </div>
            </div>
        );
    };

    // File upload component
    const FileUploadInput = ({
        id,
        onChange,
        isUploading,
        accept = 'image/*',
        label = 'Upload Advertisement Image'
    }: FileUploadInputProps) => (
        <div className="w-full">
            {isUploading ? (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 flex items-center justify-center h-40">
                    <div className="flex flex-col items-center gap-2 text-blue-700">
                        <Loader className="h-6 w-6 animate-spin" />
                        <span className="font-medium">Uploading image...</span>
                        <p className="text-xs text-blue-600">This may take a moment</p>
                    </div>
                </div>
            ) : (
                <Label htmlFor={id} className="cursor-pointer block w-full">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors flex flex-col items-center justify-center h-40">
                        <div className="flex flex-col items-center gap-2 text-gray-700 mb-2">
                            <div className="bg-gray-100 h-12 w-12 rounded-full flex items-center justify-center">
                                <Upload className="h-6 w-6 text-gray-600" />
                            </div>
                            <span className="font-medium text-center">{label}</span>
                            <p className="text-xs text-gray-500 text-center mt-1 max-w-xs">
                                Click to browse or drag and drop your image file here
                            </p>
                            <p className="text-xs text-gray-500 text-center">
                                Accepted formats: PNG, JPG, JPEG, GIF (max 5MB)
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

    const renderFormStep = () => {
        switch (formStep) {
            case 1:
                return (
                    <div className="space-y-5">
                        <div className="flex items-center space-x-3 text-gray-700 mb-3">
                            <Info className="h-5 w-5" />
                            <h2 className="text-lg font-medium">Advertisement Details</h2>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-base font-medium">
                                Advertisement Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Summer Sale - 50% Off!"
                                className="py-3 text-base border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 rounded-md"
                            />
                            <p className="text-sm text-gray-500 flex items-center">
                                <Info className="h-4 w-4 mr-1" />
                                Give your ad a clear and attractive title
                            </p>
                        </div>
                        <div className="pt-6 flex justify-end">
                            <Button
                                type="button"
                                onClick={nextStep}
                                disabled={!isStepComplete(1)}
                                className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-md transition"
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-5">
                        <div className="flex items-center space-x-3 text-gray-700 mb-3">
                            <Info className="h-5 w-5" />
                            <h2 className="text-lg font-medium">Advertisement Description</h2>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-base font-medium">
                                Description <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows={5}
                                placeholder="Describe your promotion in detail. What makes it special?"
                                className="py-3 px-4 text-base border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 rounded-md"
                            />
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500 flex items-center">
                                    <Info className="h-4 w-4 mr-1" />
                                    Be concise but compelling
                                </p>
                                <p className={`text-sm ${formData.description.length > 250 ? 'text-gray-700' : 'text-gray-500'}`}>
                                    {formData.description.length}/250 characters
                                </p>
                            </div>
                        </div>
                        <div className="pt-6 flex justify-between">
                            <Button
                                type="button"
                                onClick={prevStep}
                                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition"
                            >
                                Back
                            </Button>
                            <Button
                                type="button"
                                onClick={nextStep}
                                disabled={!isStepComplete(2) || formData.description.length > 250}
                                className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-md transition"
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-5">
                        <div className="flex items-center space-x-3 text-gray-700 mb-3">
                            <ImageIcon className="h-5 w-5" />
                            <h2 className="text-lg font-medium">Advertisement Visual</h2>
                        </div>

                        {/* Enhanced Image Upload Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="imageUrl" className="text-base font-medium">
                                    Advertisement Image <span className="text-red-500">*</span>
                                </Label>

                                <div className="flex items-center text-sm text-gray-500">
                                    <Info className="h-4 w-4 mr-1" />
                                    <span>Recommended: 1200×630 pixels</span>
                                </div>
                            </div>

                            {/* Two options: Upload or Paste URL */}
                            <div className="grid grid-cols-1 gap-4">
                                {/* Option 1: File Upload */}
                                <div>
                                    <h3 className="font-medium text-sm text-gray-700 mb-2">Option 1: Upload Image</h3>
                                    {previewImage ? (
                                        <div className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                            <img
                                                src={previewImage}
                                                alt="Advertisement Preview"
                                                className="w-full h-64 object-contain rounded-lg"
                                                onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/1200x630?text=Image+Not+Found"; }}
                                            />
                                            <div className="absolute top-2 right-2 flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-gray-700 border border-gray-200 rounded-full shadow-sm"
                                                    onClick={() => window.open(previewImage, '_blank')}
                                                >
                                                    <ImageIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 bg-white/90 hover:bg-white text-red-500 hover:text-red-600 border border-gray-200 rounded-full shadow-sm"
                                                    onClick={async () => {
                                                        try {
                                                            // Delete from S3 if a file was uploaded (not just a URL)
                                                            if (previewImage && previewImage.startsWith('https://dragonapplication.s3.')) {
                                                                await deleteUploadedFile(previewImage);
                                                            }
                                                            setPreviewImage(""); // Clear UI state
                                                            setFormData(prev => ({ ...prev, imageUrl: "" })); // Clear form data
                                                            toast.success("Image removed successfully");
                                                        } catch (error) {
                                                            toast.error("Failed to delete image");
                                                        }
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="p-3 bg-white border-t border-gray-200">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm font-medium text-gray-700 truncate">
                                                        {previewImage.split('/').pop()}
                                                    </p>

                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <FileUploadInput
                                            id="imageFileUpload"
                                            onChange={handleFileUpload}
                                            isUploading={uploadingImage}
                                        />
                                    )}
                                </div>

                                {/* Option 2: Image URL */}
                                <div>
                                    <h3 className="font-medium text-sm text-gray-700 mb-2">Option 2: Paste Image URL</h3>
                                    <div className="space-y-2">
                                        <Input
                                            type="url"
                                            id="imageUrl"
                                            name="imageUrl"
                                            value={formData.imageUrl}
                                            onChange={handleChange}
                                            placeholder="https://example.com/promo-image.jpg"
                                            className="py-3 px-4 text-base border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 rounded-md w-full"
                                            disabled={!!previewImage}
                                        />

                                        {formData.imageUrl && !previewImage && (
                                            <div className="w-full h-40 bg-gray-50 rounded-md overflow-hidden border border-gray-200 relative mt-2">
                                                <div
                                                    className="w-full h-full bg-center bg-cover flex items-center justify-center"
                                                    style={{ backgroundImage: `url(${formData.imageUrl})` }}
                                                >
                                                    <div className="bg-white/80 px-3 py-1 rounded-md text-sm text-gray-700">
                                                        URL Image Preview
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 flex items-center mt-2">
                                <Info className="h-4 w-4 mr-1" />
                                Choose either upload an image file or provide an image URL
                            </p>
                        </div>

                        <div className="pt-6 flex justify-between">
                            <Button
                                type="button"
                                onClick={prevStep}
                                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition"
                            >
                                Back
                            </Button>
                            <Button
                                type="button"
                                onClick={nextStep}
                                disabled={!isStepComplete(3)}
                                className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-md transition"
                            >
                                Continue
                            </Button>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-5">
                        <div className="flex items-center space-x-3 text-gray-700 mb-3">
                            <LinkIcon className="h-5 w-5" />
                            <h2 className="text-lg font-medium">Advertisement Destination</h2>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="linkUrl" className="text-base font-medium">
                                Destination URL <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                type="url"
                                id="linkUrl"
                                name="linkUrl"
                                value={formData.linkUrl}
                                onChange={handleChange}
                                required
                                placeholder="https://example.com/summer-sale"
                                className="py-3 px-4 text-base border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 rounded-md"
                            />
                            <p className="text-sm text-gray-500 flex items-center">
                                <Info className="h-4 w-4 mr-1" />
                                Where should users go when they click your ad?
                            </p>
                        </div>

                        {/* Summary Section */}
                        {isStepComplete(4) && (
                            <div className="mt-8 p-4 bg-gray-50 rounded-md border border-gray-200">
                                <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                    Advertisement Summary
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <div className="md:col-span-2">
                                        {(previewImage || formData.imageUrl) && (
                                            <div className="bg-white p-2 rounded-md border border-gray-200 h-32 flex items-center justify-center overflow-hidden">
                                                <img
                                                    src={previewImage || formData.imageUrl}
                                                    alt={formData.title}
                                                    className="max-h-full max-w-full object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-3 space-y-3">
                                        <div className="flex">
                                            <span className="font-medium text-gray-600 w-24">Title:</span>
                                            <span className="text-gray-800">{formData.title}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-600 mb-1">Description:</span>
                                            <span className="text-gray-800 text-sm bg-white p-2 rounded border border-gray-100">
                                                {formData.description}
                                            </span>
                                        </div>
                                        <div className="flex">
                                            <span className="font-medium text-gray-600 w-24">Link:</span>
                                            <a href={formData.linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                                                {formData.linkUrl}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-6 flex justify-between">
                            <Button
                                type="button"
                                onClick={prevStep}
                                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition"
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-md transition flex items-center space-x-2"
                                disabled={isSubmitting || !isStepComplete(4)}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Publishing...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span>Publish Advertisement</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 px-10 py-12  font-Urbanist">
            <div className="w-full mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 font-Urbanist">
                        Create New Advertisement
                    </h1>
                    <p className="text-lg text-gray-600">
                        Reach your audience with an effective promotional campaign
                    </p>
                </div>

                <Card className="border-none shadow-lg rounded-lg overflow-hidden">
                    <CardHeader className="bg-gray-100 border-b border-gray-200 py-6">
                        <CardTitle className="text-xl font-medium flex items-center text-gray-800">
                            Advertisement Creation ({formStep}/{totalSteps})
                        </CardTitle>
                        <CardDescription className="text-gray-500">
                            Complete all steps to create your advertisement
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 bg-white">
                        {renderProgressBar()}
                        <form onSubmit={handleSubmit}>
                            {renderFormStep()}
                        </form>
                    </CardContent>
                </Card>
            </div>

            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 4000,
                }}
            />
        </div>
    );
};

export default AddAdvertisement;