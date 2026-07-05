"use client";

import { useState, useEffect, Suspense } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, PenLine, Trash2, X, ChevronLeft, ChevronRight, Image as ImageIcon, Link as LinkIcon, Upload, Loader, Info } from 'lucide-react';
import {
    fetchAdvertisements,
    updateAdvertisement,
    deleteAdvertisement,
    handleFileUpload as apiHandleFileUpload,
    Advertisement
} from '../../../../apiCalls/manageAdvertisement';
import { deleteUploadedFile } from "../../../../apiCalls/fileUpload";

const ManageAdvertisement = () => {
    const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // File upload states
    const [uploadingImage, setUploadingImage] = useState(false);
    const [previewImage, setPreviewImage] = useState("");

    useEffect(() => {
        fetchAdvertisement();
    }, [currentPage, limit]);

    const fetchAdvertisement = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAdvertisements(currentPage, limit);
            setAdvertisements(data.currentObjects);
            setTotalPages(data.totalPages);
        } catch (error) {
            toast.error("Failed to fetch advertisements.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (ad: Advertisement) => {
        setEditingAd(ad);
        setPreviewImage("");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error("File size exceeds 5MB limit");
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error("Only image files are allowed");
            return;
        }

        try {
            setUploadingImage(true);
            await handleRemoveImage();
            const result = await apiHandleFileUpload(file);

            setPreviewImage(result.url);

            if (editingAd) {
                setEditingAd({
                    ...editingAd,
                    imageUrl: result.url
                });
            }

            toast.success("Image uploaded successfully!");
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error(error instanceof Error ? error.message : "Failed to upload image. Please try again.");
        } finally {
            setUploadingImage(false);
            e.target.value = '';
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAd) return;

        setIsSubmitting(true);
        try {
            await updateAdvertisement(editingAd._id, editingAd);
            toast.success("Advertisement updated successfully!");
            setEditingAd(null);
            setPreviewImage("");
            fetchAdvertisement();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update advertisement.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this advertisement?")) {
            return;
        }

        try {
            await deleteAdvertisement(id);
            toast.success("Advertisement deleted successfully!");
            fetchAdvertisement();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete advertisement.");
            console.error(error);
        }
    };

    const handleRemoveImage = async () => {
        if (!editingAd?.imageUrl) {
            setPreviewImage("");
            return;
        }

        try {
            // Only try to delete if the URL is from S3 (not a local preview)
            if (editingAd.imageUrl.startsWith('https://dragonapplication.s3.')) {
                await deleteUploadedFile(editingAd.imageUrl);
            }

            setPreviewImage("");
            setEditingAd(prev => prev ? {
                ...prev,
                imageUrl: ""
            } : null);
            toast.success("Image removed successfully");
        } catch (error) {
            console.error("Error removing image:", error);
            toast.error("Failed to remove image. Please try again.");
        }
    };

    // File upload component
    const FileUploadInput = ({
        id,
        onChange,
        isUploading,
        accept = 'image/*',
        label = 'Upload Image'
    }: {
        id: string;
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
        isUploading: boolean;
        accept?: string;
        label?: string;
    }) => (
        <div className="w-full">
            {isUploading ? (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 flex items-center justify-center h-24">
                    <div className="flex flex-col items-center gap-2 text-blue-700">
                        <Loader className="h-5 w-5 animate-spin" />
                        <span className="text-sm font-medium">Uploading image...</span>
                    </div>
                </div>
            ) : (
                <Label htmlFor={id} className="cursor-pointer block w-full">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors flex flex-col items-center justify-center h-24">
                        <div className="flex flex-col items-center gap-2 text-gray-700">
                            <Upload className="h-5 w-5 text-gray-600" />
                            <span className="text-sm font-medium text-center">{label}</span>
                            <p className="text-xs text-gray-500 text-center">
                                Accepted formats: PNG, JPG (max 5MB)
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

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <div className="min-h-screen bg-gray-50  py-12 px-10 font-Urbanist">
                <div className="w-full mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2 font-Urbanist">
                            Manage Advertisements
                        </h1>
                        <p className="text-lg text-gray-600">
                            View, edit, or delete your active promotional campaigns
                        </p>
                    </div>

                    {editingAd ? (
                        <Card className="mb-8 border-none shadow-lg rounded-lg overflow-hidden">
                            <CardHeader className="bg-gray-100 border-b border-gray-200 py-4">
                                <CardTitle className="text-xl font-medium flex items-center justify-between text-gray-800">
                                    <span>Edit Advertisement</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingAd(null)}
                                        className="h-8 w-8 rounded-full"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 bg-white">
                                <form onSubmit={handleUpdate} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-base font-medium">
                                            Title <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            type="text"
                                            id="title"
                                            name="title"
                                            value={editingAd.title}
                                            onChange={(e) =>
                                                setEditingAd({ ...editingAd, title: e.target.value })
                                            }
                                            required
                                            className="py-2 text-base border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 rounded-md"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-base font-medium">
                                            Description <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={editingAd.description}
                                            onChange={(e) =>
                                                setEditingAd({ ...editingAd, description: e.target.value })
                                            }
                                            required
                                            rows={3}
                                            className="py-2 text-base border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 rounded-md"
                                        />
                                        <p className={`text-sm text-right ${editingAd.description.length > 250 ? 'text-red-500' : 'text-gray-500'}`}>
                                            {editingAd.description.length}/250 characters
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-3">
                                            <Label className="text-base font-medium flex items-center">
                                                <ImageIcon className="h-4 w-4 mr-1" />
                                                Advertisement Image <span className="text-red-500">*</span>
                                            </Label>

                                            {/* Enhanced Image Upload Section */}
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm text-gray-500 flex items-center">
                                                        <Info className="h-4 w-4 mr-1" />
                                                        You can upload a new image or use the current URL
                                                    </p>
                                                </div>

                                                {/* Option 1: File Upload */}
                                                <FileUploadInput
                                                    id="imageFileUpload"
                                                    onChange={handleFileUpload}
                                                    isUploading={uploadingImage}
                                                    label="Upload New Image"
                                                />

                                                {/* Option 2: Image URL */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="imageUrl" className="text-sm font-medium">
                                                        Or enter image URL directly:
                                                    </Label>
                                                    <Input
                                                        type="url"
                                                        id="imageUrl"
                                                        name="imageUrl"
                                                        value={editingAd.imageUrl}
                                                        onChange={(e) =>
                                                            setEditingAd({ ...editingAd, imageUrl: e.target.value })
                                                        }
                                                        required
                                                        placeholder="https://example.com/image.jpg"
                                                        className="py-2 text-base border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 rounded-md"
                                                    />
                                                </div>

                                                {/* Image Preview */}
                                                {editingAd.imageUrl && (
                                                    <div className="mt-3 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                                        <div className="relative">
                                                            <div className="bg-white p-2 h-40 flex items-center justify-center overflow-hidden">
                                                                <img
                                                                    src={editingAd.imageUrl}
                                                                    alt="Advertisement Preview"
                                                                    className="w-full h-40 object-cover rounded-lg"
                                                                    onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/1200x630?text=Image+Not+Found"; }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="p-3 bg-white border-t border-gray-200">
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-sm text-gray-700 truncate">
                                                                    Image Preview
                                                                </p>
                                                                <a
                                                                    href={editingAd.imageUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs px-2 py-1 bg-gray-100 border border-gray-200 rounded text-blue-600 hover:bg-gray-200"
                                                                >
                                                                    View Full Image
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="linkUrl" className="text-base font-medium flex items-center">
                                                <LinkIcon className="h-4 w-4 mr-1" />
                                                Link URL <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                type="url"
                                                id="linkUrl"
                                                name="linkUrl"
                                                value={editingAd.linkUrl}
                                                onChange={(e) =>
                                                    setEditingAd({ ...editingAd, linkUrl: e.target.value })
                                                }
                                                required
                                                placeholder="https://example.com/your-landing-page"
                                                className="py-2 text-base border-gray-300 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 rounded-md"
                                            />
                                            <p className="text-sm text-gray-500 mt-2">
                                                This is where users will be directed when they click on your advertisement.
                                            </p>

                                            {/* Ad Summary */}
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-6">
                                                <h3 className="font-medium text-gray-700 mb-2">Advertisement Summary</h3>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex">
                                                        <span className="font-medium text-gray-600 w-24">Title:</span>
                                                        <span className="text-gray-800">{editingAd.title}</span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="font-medium text-gray-600 w-24">Description:</span>
                                                        <span className="text-gray-800 line-clamp-2">{editingAd.description}</span>
                                                    </div>
                                                    <div className="flex">
                                                        <span className="font-medium text-gray-600 w-24">Link:</span>
                                                        <a href={editingAd.linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                                                            {editingAd.linkUrl}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex justify-end space-x-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setEditingAd(null)}
                                            className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || editingAd.description.length > 250}
                                            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-md transition flex items-center"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                                    Update Advertisement
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    ) : null}

                    <Card className="border-none shadow-lg rounded-lg overflow-hidden">
                        <CardHeader className="bg-gray-100 border-b border-gray-200 py-4">
                            <CardTitle className="text-xl font-medium text-gray-800">
                                Your Advertisements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="flex justify-center items-center py-20">
                                    <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            ) : advertisements.length === 0 ? (
                                <div className="py-16 text-center">
                                    <p className="text-gray-500 mb-4">No advertisements found</p>
                                    <Button
                                        onClick={() => window.location.href = '/dashboard/createAdvertisement'}
                                        className="bg-gray-800 hover:bg-gray-900 text-white"
                                    >
                                        Create Your First Ad
                                    </Button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[300px]">Advertisement</TableHead>
                                                <TableHead>Preview</TableHead>
                                                <TableHead>Destination</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {advertisements.map((ad) => (
                                                <TableRow key={ad._id}>
                                                    <TableCell>
                                                        <div>
                                                            <h3 className="font-medium text-gray-900">{ad.title}</h3>
                                                            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{ad.description}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="h-14 w-24 rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                                                            <div
                                                                className="w-full h-full bg-center bg-cover"
                                                                style={{ backgroundImage: `url(${ad.imageUrl})` }}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <a
                                                            href={ad.linkUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-gray-600 hover:text-gray-900 text-sm underline truncate block max-w-[200px]"
                                                        >
                                                            {ad.linkUrl}
                                                        </a>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                onClick={() => handleEdit(ad)}
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 px-3 text-gray-700 border-gray-300"
                                                            >
                                                                <PenLine className="h-4 w-4 mr-1" />
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleDelete(ad._id)}
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-1" />
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {advertisements.length > 0 && (
                        <div className="flex items-center justify-between mt-6 px-4">
                            <Button
                                variant="outline"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((prev) => prev - 1)}
                                className="border-gray-300 text-gray-700"
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                            <span className="text-sm text-gray-600">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((prev) => prev + 1)}
                                className="border-gray-300 text-gray-700"
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    )}
                </div>

                <Toaster />
            </div>
        </Suspense>
    );
};

export default ManageAdvertisement;