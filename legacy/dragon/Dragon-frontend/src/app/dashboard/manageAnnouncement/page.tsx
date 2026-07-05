'use client';

import { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    fetchAnnouncements,
    fetchAnnouncementDetails,
    updateAnnouncement,
    deleteAnnouncement
} from '../../../../apiCalls/manageAnnouncement';
import { deleteUploadedFile, uploadFile } from '../../../../apiCalls/fileUpload';
import {
    FileText,
    Image as ImageIcon,
    FileType,
    Loader,
    Upload,
    X,
    Eye
} from 'lucide-react';
import Image from 'next/image';

// Type definitions
interface ResourceMaterial {
    materialName: string;
    fileType: string;
    fileSize: number;
    url: string;
}

interface SubInformation {
    title: string;
    bulletPoints: string[];
    description: string;
}

interface CTAButton {
    buttonName: string;
    href: string;
}

interface CTA {
    title?: string;
    description?: string;
    imageUrl?: string;
    buttons?: CTAButton[];
}

interface Announcement {
    _id: string;
    title: string;
    image?: string;
    announcedDate: string;
    content: string[];
    cta?: CTA;
    resourceMaterials: ResourceMaterial[];
    subInformation: SubInformation[];
    [key: string]: any;
}

interface PaginationResponse {
    data: {
        announcements: Announcement[];
        total: number;
        limit: number;
    };
}

interface FileUploadInputProps {
    id: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isUploading: boolean;
    accept?: string;
    multiple?: boolean;
    label?: string;
    type?: 'default' | 'image';
}

export default function ManageAnnouncements() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [contentItems, setContentItems] = useState<string[]>([]);
    const [newContentItem, setNewContentItem] = useState<string>('');
    const [ctaButtons, setCtaButtons] = useState<CTAButton[]>([]);
    const [resourceMaterials, setResourceMaterials] = useState<ResourceMaterial[]>([]);
    const [subInformation, setSubInformation] = useState<SubInformation[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
    const [isViewMode, setIsViewMode] = useState<boolean>(false);

    // File upload states
    const [uploadingFeatureImage, setUploadingFeatureImage] = useState<boolean>(false);
    const [uploadingCtaImage, setUploadingCtaImage] = useState<boolean>(false);
    const [uploadingResourceImage, setUploadingResourceImage] = useState<number | null>(null);

    useEffect(() => {
        loadAnnouncements();
    }, [currentPage]);

    const loadAnnouncements = async (): Promise<void> => {
        try {
            setLoading(true);
            const { data } = await fetchAnnouncements(currentPage) as PaginationResponse;
            setAnnouncements(data.announcements);
            setTotalPages(Math.ceil(data.total / data.limit));
            setLoading(false);
        } catch (error) {
            toast.error('Failed to fetch announcements.');
            setLoading(false);
        }
    };

    const handleEdit = async (id: string): Promise<void> => {
        try {
            setLoading(true);
            const announcement = await fetchAnnouncementDetails(id) as Announcement;
            setEditingAnnouncement(announcement);
            setContentItems(announcement.content || []);
            setIsViewMode(false);
            setCtaButtons(announcement.cta?.buttons || []);
            setResourceMaterials(announcement.resourceMaterials || []);
            setSubInformation(announcement.subInformation || []);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to fetch announcement details.');
            setLoading(false);
        }
    };

    const handleView = async (id: string): Promise<void> => {
        try {
            setLoading(true);
            const announcement = await fetchAnnouncementDetails(id) as Announcement;
            setEditingAnnouncement(announcement);
            setContentItems(announcement.content || []);
            setIsViewMode(true);

            // Initialize additional fields
            setCtaButtons(announcement.cta?.buttons || []);
            setResourceMaterials(announcement.resourceMaterials || []);
            setSubInformation(announcement.subInformation || []);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to fetch announcement details.');
            setLoading(false);
        }
    };

    const confirmDelete = (announcement: Announcement): void => {
        setAnnouncementToDelete(announcement);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async (): Promise<void> => {
        if (!announcementToDelete) return;

        try {
            setLoading(true);
            await deleteAnnouncement(announcementToDelete._id);
            toast.success('Announcement deleted successfully!');
            setIsDeleteModalOpen(false);
            setAnnouncementToDelete(null);
            loadAnnouncements();
        } catch (error) {
            toast.error('Failed to delete announcement.');
        } finally {
            setLoading(false);
        }
    };

    const handleContentChange = (index: number, value: string): void => {
        const updatedItems = [...contentItems];
        updatedItems[index] = value;
        setContentItems(updatedItems);
    };

    const addContentItem = (): void => {
        if (newContentItem.trim()) {
            setContentItems([...contentItems, newContentItem]);
            setNewContentItem('');
        }
    };

    const removeContentItem = (index: number): void => {
        const updatedItems = contentItems.filter((_, i) => i !== index);
        setContentItems(updatedItems);
    };

    // File upload component
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

    // Get file type icon
    const getFileTypeIcon = (fileType: string | undefined) => {
        if (!fileType) return <FileType className="h-5 w-5" />;

        const type = fileType.toLowerCase();
        if (type === 'pdf') return <FileText className="h-5 w-5" />;
        if (['doc', 'docx'].includes(type)) return <FileText className="h-5 w-5" />;
        if (['xls', 'xlsx'].includes(type)) return <FileText className="h-5 w-5" />;
        if (['image', 'png', 'jpg', 'jpeg'].includes(type)) return <ImageIcon className="h-5 w-5" />;
        return <FileType className="h-5 w-5" />;
    };

    // Handle file uploads
    type UploadType = 'featureImage' | 'ctaImage' | 'resourceImage';

    const handleFileUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        uploadType: UploadType,
        resourceIndex?: number
    ): Promise<void> => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (5MB for images, 10MB for documents)
        const maxSize = ['featureImage', 'ctaImage'].includes(uploadType) ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
            const sizeInMB = Math.round(maxSize / (1024 * 1024));
            toast.error(`File size exceeds ${sizeInMB}MB limit`);
            return;
        }

        try {
            // Set uploading state
            if (uploadType === 'featureImage') {
                setUploadingFeatureImage(true);
            } else if (uploadType === 'ctaImage') {
                setUploadingCtaImage(true);
            } else if (uploadType === 'resourceImage' && resourceIndex !== undefined) {
                setUploadingResourceImage(resourceIndex);
            }

            console.log(`Uploading file for ${uploadType}:`, file.name);

            // Upload the file
            const result = await uploadFile(file);
            console.log("Upload result:", result);

            if (result.success) {
                if (uploadType === 'featureImage' && editingAnnouncement) {
                    setEditingAnnouncement({
                        ...editingAnnouncement,
                        image: result.data.url
                    });
                    toast.success('Feature image uploaded successfully!');

                } else if (uploadType === 'resourceImage' && resourceIndex !== undefined) {
                    // Determine file type from format or original filename
                    const fileType = result.data.format ||
                        (result.data.original_filename ?
                            result.data.original_filename.split('.').pop() :
                            'file');

                    // Update the resource material with uploaded file data
                    const updatedMaterials = [...resourceMaterials];
                    updatedMaterials[resourceIndex] = {
                        ...updatedMaterials[resourceIndex],
                        url: result.data.url,
                        fileType: fileType || "",
                        fileSize: Math.round(result.data.size / 1024) // Convert to KB
                    };

                    // Set material name if it's empty
                    if (!updatedMaterials[resourceIndex].materialName) {
                        updatedMaterials[resourceIndex].materialName = result.data.original_filename ||
                            result.data.public_id ||
                            `Resource ${resourceIndex + 1}`;
                    }

                    setResourceMaterials(updatedMaterials);
                    toast.success('Resource file uploaded successfully!');
                }
            } else {
                toast.error(result.message || 'Failed to upload file');
            }
        } catch (error) {
            console.error("Error in file upload:", error);
            toast.error('Failed to upload file: ' + ((error as Error).message || 'Unknown error'));
        } finally {
            // Reset uploading state
            if (uploadType === 'featureImage') {
                setUploadingFeatureImage(false);
            } else if (uploadType === 'ctaImage') {
                setUploadingCtaImage(false);
            } else if (uploadType === 'resourceImage') {
                setUploadingResourceImage(null);
            }

            // Reset the file input
            e.target.value = '';
        }
    };

    const handleUpdate = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!editingAnnouncement) return;

        try {
            setLoading(true);
            const updatedData = {
                ...editingAnnouncement,
                content: contentItems,
                title: editingAnnouncement.title,
                image: editingAnnouncement.image,
                cta: {
                    ...editingAnnouncement.cta || {},
                    buttons: ctaButtons
                },
                resourceMaterials: resourceMaterials,
                subInformation: subInformation
            };
            await updateAnnouncement(editingAnnouncement._id, updatedData);
            toast.success('Announcement updated successfully!');
            setEditingAnnouncement(null);
            loadAnnouncements();
        } catch (error) {
            toast.error('Failed to update announcement.');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number): void => {
        setCurrentPage(page);
    };

    const truncateText = (text: string, maxLength = 100): string => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const formatDate = (dateString: string): string => {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    if (loading && !editingAnnouncement) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-800 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-700 font-Urbanist">Loading announcements...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="mx-auto px-10">
                <Toaster />

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl mx-4">
                            <h3 className="text-xl font-Urbanist font-bold text-gray-900 mb-3">Confirm Deletion</h3>
                            <p className="text-gray-600 mb-6 font-Urbanist">
                                Are you sure you want to delete the announcement <span className="font-medium">"{announcementToDelete?.title}"</span>? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="font-Urbanist rounded-lg"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleDelete}
                                    className="bg-red-600 hover:bg-red-700 text-white font-Urbanist rounded-lg"
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-Urbanist font-bold text-gray-900 mb-3">Manage Announcements</h1>
                    <p className="text-lg text-gray-600 font-Urbanist">
                        View, edit or delete existing announcements to keep your users informed with up-to-date information.
                    </p>
                </div>

                {editingAnnouncement ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-Urbanist font-bold text-gray-800">
                                {isViewMode ? 'Viewing Announcement' : 'Edit Announcement'}
                            </h2>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setEditingAnnouncement(null);
                                    setIsViewMode(false);
                                }}
                                className="font-Urbanist rounded-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                    <path d="M19 12H5"></path>
                                    <path d="M12 19l-7-7 7-7"></path>
                                </svg>
                                Back to List
                            </Button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-6 space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="title" className="text-lg font-Urbanist font-semibold text-gray-700">
                                                Title <span className="text-red-500">*</span>
                                            </Label>
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-500 font-Urbanist">Required</span>
                                        </div>
                                        <Input
                                            id="title"
                                            name="title"
                                            value={editingAnnouncement.title}
                                            onChange={(e) => setEditingAnnouncement({
                                                ...editingAnnouncement,
                                                title: e.target.value
                                            })}
                                            placeholder="Enter announcement title"
                                            required
                                            className="p-3 font-Urbanist border-gray-200 rounded-lg"
                                            disabled={isViewMode}
                                        />
                                        <p className="text-sm text-gray-500 font-Urbanist">
                                            This is the main headline that will grab users' attention.
                                        </p>
                                    </div>

                                    {/* Feature Image Upload Section */}
                                    <div className="space-y-4">
                                        <Label className="text-lg font-Urbanist font-semibold text-gray-700">
                                            Feature Image
                                        </Label>

                                        {editingAnnouncement.image ? (
                                            <div className="mt-3 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                                                <div className="relative">
                                                    <div className="bg-white p-2 h-48 flex items-center justify-center overflow-hidden">
                                                        <img
                                                            src={editingAnnouncement.image}
                                                            alt="Feature Image Preview"
                                                            className="w-full h-64 md:h-80 lg:h-96 object-cover rounded-lg"
                                                            onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/1200x630?text=Image+Not+Found"; }}
                                                        />
                                                    </div>
                                                    {!isViewMode && (
                                                        <div className="absolute top-2 right-2">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={async () => {
                                                                    try {
                                                                        // First delete the file from AWS
                                                                        if (editingAnnouncement.image) {
                                                                            await deleteUploadedFile(editingAnnouncement.image);
                                                                        }
                                                                        // Then remove it from the state
                                                                        setEditingAnnouncement({
                                                                            ...editingAnnouncement,
                                                                            image: ""
                                                                        });
                                                                        toast.success('Image removed successfully');
                                                                    } catch (error) {
                                                                        toast.error('Failed to remove image');
                                                                    }
                                                                }}
                                                                className="bg-white/90 text-red-500 hover:text-red-700 hover:bg-white rounded-full h-8 w-8 p-0 flex items-center justify-center shadow-sm"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3 bg-white border-t border-gray-100">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <ImageIcon className="h-4 w-4 text-gray-500" />
                                                            <p className="text-sm font-Urbanist text-gray-700 truncate">
                                                                {editingAnnouncement.image.split('/').pop()}
                                                            </p>
                                                        </div>
                                                        {!isViewMode && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setEditingAnnouncement({
                                                                    ...editingAnnouncement,
                                                                    image: ""
                                                                })}
                                                                className="h-8 text-xs bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                                            >
                                                                Replace
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : !isViewMode && (
                                            <FileUploadInput
                                                id="featureImage"
                                                onChange={(e) => handleFileUpload(e, 'featureImage')}
                                                isUploading={uploadingFeatureImage}
                                                accept="image/*"
                                                label="Upload Feature Image"
                                                type="image"
                                            />
                                        )}

                                        <p className="text-sm text-gray-500 font-Urbanist">
                                            A high-quality image that represents your announcement. This will be displayed prominently.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <Label htmlFor="announcedDate" className="text-lg font-Urbanist font-semibold text-gray-700">
                                            Publication Date <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="announcedDate"
                                            name="announcedDate"
                                            type="datetime-local"
                                            value={editingAnnouncement.announcedDate ? editingAnnouncement.announcedDate.substring(0, 16) : ''}
                                            onChange={(e) => setEditingAnnouncement({
                                                ...editingAnnouncement,
                                                announcedDate: new Date(e.target.value).toISOString()
                                            })}
                                            required
                                            className="p-3 font-Urbanist border-gray-200 rounded-lg"
                                            disabled={isViewMode}
                                        />
                                        <p className="text-sm text-gray-500 font-Urbanist">
                                            Set when this announcement should be visible to users.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-lg font-Urbanist font-semibold text-gray-700">
                                            Content <span className="text-red-500">*</span>
                                        </Label>

                                        {contentItems.map((item, index) => (
                                            <div key={index} className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-grow space-y-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center font-Urbanist font-medium text-gray-700 text-sm">
                                                                {index + 1}
                                                            </div>
                                                            <span className="text-sm font-Urbanist text-gray-600">
                                                                {index === 0 ? 'Main content' : `Additional paragraph ${index}`}
                                                            </span>
                                                        </div>

                                                        <Textarea
                                                            value={item}
                                                            onChange={(e) => handleContentChange(index, e.target.value)}
                                                            required={index === 0}
                                                            rows={5}
                                                            placeholder={index === 0 ?
                                                                "Main announcement content. Provide clear and concise information..." :
                                                                "Additional details for this announcement..."}
                                                            className="w-full p-3 border-gray-200 rounded-lg resize-none font-Urbanist"
                                                            disabled={isViewMode}
                                                        />
                                                    </div>

                                                    {!isViewMode && (
                                                        <Button
                                                            type="button"
                                                            onClick={() => removeContentItem(index)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-full flex items-center justify-center"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                                            </svg>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {!isViewMode && (
                                            <div className="flex gap-3">
                                                <Input
                                                    value={newContentItem}
                                                    onChange={(e) => setNewContentItem(e.target.value)}
                                                    placeholder="Add new content paragraph"
                                                    className="flex-1 p-3 border-gray-200 rounded-lg font-Urbanist"
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={addContentItem}
                                                    className="bg-gray-800 hover:bg-gray-700 rounded-lg px-5 py-2.5 text-white font-Urbanist"
                                                    disabled={!newContentItem.trim()}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    </svg>
                                                    Add Paragraph
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 h-fit">
                                    <h3 className="font-Urbanist font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">Announcement Preview</h3>
                                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                        <h4 className="text-xl font-Urbanist font-bold text-gray-800 mb-2">{editingAnnouncement.title || 'Announcement Title'}</h4>
                                        <div className="text-sm text-gray-500 mb-4 font-Urbanist">{formatDate(editingAnnouncement.announcedDate)}</div>

                                        {editingAnnouncement.image && (
                                            <div className="mb-4 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                                <img
                                                    src={editingAnnouncement.image}
                                                    alt="Announcement"
                                                    className="w-full h-40 object-contain"
                                                />
                                            </div>
                                        )}

                                        <div className="prose max-w-none font-Urbanist text-gray-600 space-y-3">
                                            {contentItems.map((content, index) => (
                                                <p key={index}>{content}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Call to Action Section */}
                            <div className="bg-white rounded-lg border border-gray-200 p-5">
                                <h3 className="text-lg font-Urbanist font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    Call to Action
                                </h3>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="ctaTitle" className="font-Urbanist text-gray-700 mb-1.5 block">CTA Title</Label>
                                            <Input
                                                id="ctaTitle"
                                                value={editingAnnouncement.cta?.title || ''}
                                                onChange={(e) => setEditingAnnouncement({
                                                    ...editingAnnouncement,
                                                    cta: {
                                                        ...editingAnnouncement.cta || {},
                                                        title: e.target.value
                                                    }
                                                })}
                                                placeholder="e.g., Need Help?"
                                                className="border-gray-200 rounded-lg font-Urbanist"
                                                disabled={isViewMode}
                                            />
                                        </div>

                                        <div>
                                            <Label className="font-Urbanist text-gray-700 mb-1.5 block">CTA Description</Label>
                                            <Input
                                                value={editingAnnouncement.cta?.description || ''}
                                                onChange={(e) => setEditingAnnouncement({
                                                    ...editingAnnouncement,
                                                    cta: {
                                                        ...editingAnnouncement.cta || {},
                                                        description: e.target.value
                                                    }
                                                })}
                                                placeholder="Brief description for call to action"
                                                className="border-gray-200 rounded-lg font-Urbanist"
                                                disabled={isViewMode}
                                            />
                                        </div>
                                    </div>


                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="font-Urbanist text-gray-700">CTA Buttons</Label>
                                            {!isViewMode && ctaButtons.length > 0 && (
                                                <Button
                                                    type="button"
                                                    onClick={() => setCtaButtons([...ctaButtons, { buttonName: '', href: '' }])}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-Urbanist"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    </svg>
                                                    Add Button
                                                </Button>
                                            )}
                                        </div>

                                        {ctaButtons.length === 0 ? (
                                            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                                <p className="text-gray-500 font-Urbanist mb-3">No CTA buttons added yet</p>
                                                {!isViewMode && (
                                                    <Button
                                                        type="button"
                                                        onClick={() => setCtaButtons([{ buttonName: '', href: '' }])}
                                                        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-Urbanist"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                                        </svg>
                                                        Add CTA Button
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {ctaButtons.map((button, index) => (
                                                    <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-Urbanist text-xs">
                                                            {index + 1}
                                                        </div>
                                                        <Input
                                                            value={button.buttonName}
                                                            onChange={(e) => {
                                                                if (isViewMode) return;
                                                                const updated = [...ctaButtons];
                                                                updated[index].buttonName = e.target.value;
                                                                setCtaButtons(updated);
                                                            }}
                                                            placeholder="Button text"
                                                            className="flex-1 border-gray-200 rounded-lg font-Urbanist"
                                                            disabled={isViewMode}
                                                        />
                                                        <Input
                                                            value={button.href}
                                                            onChange={(e) => {
                                                                if (isViewMode) return;
                                                                const updated = [...ctaButtons];
                                                                updated[index].href = e.target.value;
                                                                setCtaButtons(updated);
                                                            }}
                                                            placeholder="Button URL"
                                                            className="flex-1 border-gray-200 rounded-lg font-Urbanist"
                                                            disabled={isViewMode}
                                                        />

                                                        {!isViewMode && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-full flex items-center justify-center"
                                                                onClick={() => {
                                                                    const updated = ctaButtons.filter((_, i) => i !== index);
                                                                    setCtaButtons(updated);
                                                                }}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                </svg>
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Resource Materials Section */}
                            <div className="bg-white rounded-lg border border-gray-200 p-5">
                                <h3 className="text-lg font-Urbanist font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    Resource Materials
                                </h3>

                                <div className="space-y-4">
                                    {resourceMaterials.length === 0 ? (
                                        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                            <p className="text-gray-500 font-Urbanist mb-3">No resource materials added yet</p>
                                            {!isViewMode && (
                                                <Button
                                                    type="button"
                                                    onClick={() => setResourceMaterials([{ materialName: '', fileType: '', fileSize: 0, url: '' }])}
                                                    className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-Urbanist"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    </svg>Add Resource Material
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {resourceMaterials.map((material, index) => (
                                                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-700">
                                                                {getFileTypeIcon(material.fileType)}
                                                            </div>
                                                            <span className="font-Urbanist font-medium text-gray-700">Resource #{index + 1}</span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full h-8 w-8 p-0 flex items-center justify-center"
                                                            onClick={async () => {
                                                                try {
                                                                    // First delete the file from AWS if it exists
                                                                    if (resourceMaterials[index].url) {
                                                                        await deleteUploadedFile(resourceMaterials[index].url);
                                                                    }
                                                                    // Then remove the entire resource material
                                                                    const updated = resourceMaterials.filter((_, i) => i !== index);
                                                                    setResourceMaterials(updated);
                                                                    toast.success('Resource material removed successfully');
                                                                } catch (error) {
                                                                    toast.error('Failed to remove resource material');
                                                                }
                                                            }}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                                                        <div>
                                                            <Label className="text-sm font-Urbanist text-gray-700 mb-1.5 block">Material Name</Label>
                                                            <Input
                                                                value={material.materialName}
                                                                onChange={(e) => {
                                                                    if (isViewMode) return;
                                                                    const updated = [...resourceMaterials];
                                                                    updated[index].materialName = e.target.value;
                                                                    setResourceMaterials(updated);
                                                                }}
                                                                placeholder="Material name"
                                                                className="border-gray-200 rounded-lg font-Urbanist"
                                                                disabled={isViewMode}
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label className="text-sm font-Urbanist text-gray-700 mb-1.5 block">File Type</Label>
                                                            <Input
                                                                value={material.fileType}
                                                                onChange={(e) => {
                                                                    if (isViewMode) return;
                                                                    const updated = [...resourceMaterials];
                                                                    updated[index].fileType = e.target.value;
                                                                    setResourceMaterials(updated);
                                                                }}
                                                                placeholder="File type (pdf, doc, etc.)"
                                                                className="border-gray-200 rounded-lg font-Urbanist"
                                                                disabled={isViewMode}
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label className="text-sm font-Urbanist text-gray-700 mb-1.5 block">File Size (KB)</Label>
                                                            <Input
                                                                type="number"
                                                                value={material.fileSize || ''}
                                                                onChange={(e) => {
                                                                    if (isViewMode) return;
                                                                    const updated = [...resourceMaterials];
                                                                    updated[index].fileSize = Number(e.target.value);
                                                                    setResourceMaterials(updated);
                                                                }}
                                                                placeholder="Size in KB"
                                                                className="border-gray-200 rounded-lg font-Urbanist"
                                                                disabled={isViewMode}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* File Upload and Preview */}
                                                    <div className="mt-4">
                                                        {material.url ? (
                                                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                                                                            <Eye className="h-3.5 w-3.5 mr-1" />
                                                                            View
                                                                        </a>
                                                                        {!isViewMode && (
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={async () => {
                                                                                    try {
                                                                                        // First delete the file from AWS if it exists
                                                                                        if (resourceMaterials[index].url) {
                                                                                            await deleteUploadedFile(resourceMaterials[index].url);
                                                                                        }
                                                                                        // Then remove it from the state
                                                                                        const updated = [...resourceMaterials];
                                                                                        updated[index].url = "";
                                                                                        setResourceMaterials(updated);
                                                                                        toast.success('Resource file removed successfully');
                                                                                    } catch (error) {
                                                                                        toast.error('Failed to remove resource file');
                                                                                    }
                                                                                }}
                                                                                className="h-7 text-xs border-gray-200 text-gray-700 hover:bg-gray-100"
                                                                            >
                                                                                Replace
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Preview for images */}
                                                                {(material.fileType?.toLowerCase().includes('image') ||
                                                                    material.url.match(/\.(jpeg|jpg|gif|png)$/i)) && (
                                                                        <div className="border-t border-gray-100 p-2 bg-gray-50 h-32 flex items-center justify-center">
                                                                            <img
                                                                                src={material.url}
                                                                                alt={material.materialName || "Resource Preview"}
                                                                                className="max-h-full max-w-full object-contain"
                                                                            />
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        ) : !isViewMode && (
                                                            <div>
                                                                <Label className="text-sm font-Urbanist text-gray-700 mb-1.5 block">Resource File</Label>
                                                                {uploadingResourceImage === index ? (
                                                                    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 flex items-center justify-center">
                                                                        <div className="flex flex-col items-center gap-2 text-blue-700">
                                                                            <Loader className="h-6 w-6 animate-spin" />
                                                                            <span className="font-Urbanist">Uploading file...</span>
                                                                            <p className="text-xs text-blue-600 font-Urbanist">This may take a moment</p>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <FileUploadInput
                                                                        id={`resource-upload-${index}`}
                                                                        onChange={(e) => handleFileUpload(e, 'resourceImage', index)}
                                                                        isUploading={false}
                                                                        label="Upload Document or Image"
                                                                    />
                                                                )}
                                                            </div>
                                                        )}

                                                        {!material.url && !isViewMode && (
                                                            <div className="mt-2">
                                                                <Label className="text-sm font-Urbanist text-gray-700 mb-1.5 block">Or Paste URL</Label>
                                                                <Input
                                                                    value={material.url}
                                                                    onChange={(e) => {
                                                                        const updated = [...resourceMaterials];
                                                                        updated[index].url = e.target.value;
                                                                        setResourceMaterials(updated);
                                                                    }}
                                                                    placeholder="https://example.com/file.pdf"
                                                                    className="border-gray-200 rounded-lg font-Urbanist"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {!isViewMode && (
                                                <Button
                                                    type="button"
                                                    onClick={() => setResourceMaterials([...resourceMaterials, { materialName: '', fileType: '', fileSize: 0, url: '' }])}
                                                    className="mt-2 border-dashed border-gray-300 hover:border-gray-500 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg py-2.5 flex items-center justify-center w-full font-Urbanist"
                                                    variant="outline"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    </svg>
                                                    Add Resource Material
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sub Information Section */}
                            <div className="bg-white rounded-lg border border-gray-200 p-5">
                                <h3 className="text-lg font-Urbanist font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="8" y1="6" x2="21" y2="6"></line>
                                        <line x1="8" y1="12" x2="21" y2="12"></line>
                                        <line x1="8" y1="18" x2="21" y2="18"></line>
                                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                    </svg>
                                    Additional Information
                                </h3>

                                <div className="space-y-4">
                                    {subInformation.length === 0 ? (
                                        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                            <p className="text-gray-500 font-Urbanist mb-3">No additional information sections added yet</p>
                                            {!isViewMode && (
                                                <Button
                                                    type="button"
                                                    onClick={() => setSubInformation([{ title: '', bulletPoints: [''], description: '' }])}
                                                    className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-Urbanist"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    </svg>
                                                    Add Information Section
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {subInformation.map((info, index) => (
                                                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line>
                                                                    <line x1="8" y1="12" x2="21" y2="12"></line>
                                                                    <line x1="8" y1="18" x2="21" y2="18"></line>
                                                                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                                                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                                                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                                                </svg>
                                                            </div>
                                                            <span className="font-Urbanist font-medium text-gray-700">Section #{index + 1}</span>
                                                        </div>

                                                        {!isViewMode && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full h-8 w-8 p-0 flex items-center justify-center"
                                                                onClick={() => {
                                                                    const updated = subInformation.filter((_, i) => i !== index);
                                                                    setSubInformation(updated);
                                                                }}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                </svg>
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                                        <div>
                                                            <Label className="text-sm font-Urbanist text-gray-700 mb-1.5 block">Section Title</Label>
                                                            <Input
                                                                value={info.title}
                                                                onChange={(e) => {
                                                                    if (isViewMode) return;
                                                                    const updated = [...subInformation];
                                                                    updated[index].title = e.target.value;
                                                                    setSubInformation(updated);
                                                                }}
                                                                placeholder="Section title"
                                                                className="border-gray-200 rounded-lg font-Urbanist"
                                                                disabled={isViewMode}
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label className="text-sm font-Urbanist text-gray-700 mb-1.5 block">Description</Label>
                                                            <Input
                                                                value={info.description}
                                                                onChange={(e) => {
                                                                    if (isViewMode) return;
                                                                    const updated = [...subInformation];
                                                                    updated[index].description = e.target.value;
                                                                    setSubInformation(updated);
                                                                }}
                                                                placeholder="Section description"
                                                                className="border-gray-200 rounded-lg font-Urbanist"
                                                                disabled={isViewMode}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="mt-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <Label className="text-sm font-Urbanist text-gray-700 flex items-center gap-1">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <line x1="8" y1="6" x2="21" y2="6"></line>
                                                                    <line x1="8" y1="12" x2="21" y2="12"></line>
                                                                    <line x1="8" y1="18" x2="21" y2="18"></line>
                                                                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                                                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                                                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                                                </svg>
                                                                Bullet Points
                                                            </Label>

                                                            {!isViewMode && (
                                                                <Button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = [...subInformation];
                                                                        if (!updated[index].bulletPoints) {
                                                                            updated[index].bulletPoints = [];
                                                                        }
                                                                        updated[index].bulletPoints.push('');
                                                                        setSubInformation(updated);
                                                                    }}
                                                                    className="h-7 text-xs bg-transparent text-gray-700 hover:bg-gray-100 rounded-lg font-Urbanist"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                                    </svg>
                                                                    Add Point
                                                                </Button>
                                                            )}
                                                        </div>

                                                        <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                                                            {info.bulletPoints && info.bulletPoints.map((point, pointIndex) => (
                                                                <div key={pointIndex} className="flex items-center gap-2">
                                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-Urbanist text-xs">
                                                                        {pointIndex + 1}
                                                                    </div>
                                                                    <Input
                                                                        value={point}
                                                                        onChange={(e) => {
                                                                            if (isViewMode) return;
                                                                            const updated = [...subInformation];
                                                                            updated[index].bulletPoints[pointIndex] = e.target.value;
                                                                            setSubInformation(updated);
                                                                        }}
                                                                        placeholder="Bullet point"
                                                                        className="flex-1 border-gray-200 bg-gray-50 rounded-lg text-sm font-Urbanist"
                                                                        disabled={isViewMode}
                                                                    />

                                                                    {!isViewMode && (
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full h-6 w-6 p-0 flex items-center justify-center"
                                                                            onClick={() => {
                                                                                const updated = [...subInformation];
                                                                                updated[index].bulletPoints = updated[index].bulletPoints.filter((_, i) => i !== pointIndex);
                                                                                setSubInformation(updated);
                                                                            }}
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                            </svg>
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ))}

                                                            {(!info.bulletPoints || info.bulletPoints.length === 0) && (
                                                                <div className="text-center py-2 text-sm text-gray-500 font-Urbanist">
                                                                    No bullet points added yet.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {!isViewMode && (
                                                <Button
                                                    type="button"
                                                    onClick={() => setSubInformation([...subInformation, { title: '', bulletPoints: [''], description: '' }])}
                                                    className="mt-2 border-dashed border-gray-300 hover:border-gray-500 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg py-2.5 flex items-center justify-center w-full font-Urbanist"
                                                    variant="outline"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                                    </svg>
                                                    Add Information Section
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                {!isViewMode ? (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setEditingAnnouncement(null)}
                                            className="font-Urbanist rounded-lg"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="bg-gray-800 hover:bg-gray-700 font-Urbanist rounded-lg"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                                <polyline points="7 3 7 8 15 8"></polyline>
                                            </svg>
                                            Save Changes
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                setIsViewMode(false);
                                            }}
                                            className="bg-gray-800 hover:bg-gray-700 font-Urbanist rounded-lg"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                            Edit Announcement
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setEditingAnnouncement(null)}
                                            className="font-Urbanist rounded-lg"
                                        >
                                            Back to List
                                        </Button>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6">
                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                <Table className="w-full">
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="font-Urbanist font-semibold text-gray-700 py-3">Title</TableHead>
                                            <TableHead className="font-Urbanist font-semibold text-gray-700 py-3">Content Preview</TableHead>
                                            <TableHead className="font-Urbanist font-semibold text-gray-700 py-3">Date</TableHead>
                                            <TableHead className="font-Urbanist font-semibold text-gray-700 py-3">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {announcements.map((announcement) => (
                                            <TableRow key={announcement._id} className="hover:bg-gray-50 transition-colors">
                                                <TableCell className="font-medium text-gray-800 py-4 font-Urbanist">
                                                    {announcement.title}
                                                </TableCell>
                                                <TableCell className="py-4 font-Urbanist text-gray-600">
                                                    <div className="line-clamp-2 max-w-xs">
                                                        {truncateText(announcement.content[0] || '', 100)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 font-Urbanist text-gray-600">
                                                    {formatDate(announcement.announcedDate)}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => handleView(announcement._id)}
                                                            className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 font-Urbanist text-sm h-8"
                                                            size="sm"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                <circle cx="12" cy="12" r="3"></circle>
                                                            </svg>
                                                            View
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => handleEdit(announcement._id)}
                                                            className="text-gray-600 hover:text-green-600 hover:bg-green-50 font-Urbanist text-sm h-8"
                                                            size="sm"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                            </svg>
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => confirmDelete(announcement)}
                                                            className="text-gray-600 hover:text-red-600 hover:bg-red-50 font-Urbanist text-sm h-8"
                                                            size="sm"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                            </svg>
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {announcements.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                                <polyline points="10 9 9 9 8 9"></polyline>
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-Urbanist font-semibold text-gray-700 mb-2">No announcements found</h3>
                                    </div>
                                )}
                            </div>

                            {announcements.length > 0 && (
                                <div className="flex justify-between items-center pt-4 mt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="font-Urbanist rounded-lg"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                            <path d="M19 12H5"></path>
                                            <path d="M12 19l-7-7 7-7"></path>
                                        </svg>
                                        Previous
                                    </Button>
                                    <span className="text-sm text-gray-600 font-Urbanist">
                                        Page <span className="font-medium text-gray-800">{currentPage}</span> of <span className="font-medium text-gray-800">{totalPages}</span>
                                    </span>
                                    <Button
                                        variant="outline"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="font-Urbanist rounded-lg"
                                    >
                                        Next
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                                            <path d="M5 12h14"></path>
                                            <path d="M12 5l7 7-7 7"></path>
                                        </svg>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}