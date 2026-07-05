// src/components/news/newsModal.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Save, Plus, X, Upload, FileText, PenLine, Eye, ExternalLink, ImageIcon, Loader, FileType } from "lucide-react";
import { NewsData, ResourceMaterial, updateNews } from "../../../apiCalls/manageNews";
import { deleteUploadedFile, uploadFile } from "../../../apiCalls/fileUpload"; // Adjust this path based on your project structure
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditNewsModalProps {
  newsData: NewsData | null;
  onClose: () => void;
  onSave: (updatedNews: NewsData) => void;
  isOpen: boolean;
}

// Extended ResourceMaterial interface with additional fields
interface ExtendedResourceMaterial extends ResourceMaterial {
  fileName?: string;
  isUploading?: boolean;
}

// Extended NewsData interface to use our ExtendedResourceMaterial
interface ExtendedNewsData extends Omit<NewsData, 'resourceMaterials'> {
  resourceMaterials: ExtendedResourceMaterial[];
  featuredImage: string;
  image?: string; // Alternative field name that might be in your API
}

export function EditNewsModal({ newsData, onClose, onSave, isOpen }: EditNewsModalProps) {
  const [editedNews, setEditedNews] = useState<ExtendedNewsData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingResourceIndex, setUploadingResourceIndex] = useState<number | null>(null);
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (newsData) {
      console.log("Original news data:", newsData);

      // Find the featured image from any possible fields (handle different API structures)
      const featuredImage = newsData.image || "";
      console.log("Featured image found:", featuredImage);

      // Ensure the resourceMaterials array has the extended properties
      const extendedResourceMaterials: ExtendedResourceMaterial[] = newsData.resourceMaterials.map(material => ({
        ...material,
        fileName: extractFileName(material.url),
        isUploading: false
      }));

      setEditedNews({
        ...newsData,
        resourceMaterials: extendedResourceMaterials,
        featuredImage: featuredImage // Explicitly set the featured image
      });
    } else {
      setEditedNews(null);
    }
  }, [newsData]);

  // Helper function to extract filename from URL
  const extractFileName = (url: string): string => {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (!editedNews) return;

    setEditedNews(prev => {
      if (!prev) return prev;
      return { ...prev, [name]: value };
    });
  };

  const handleContentChange = (index: number, value: string) => {
    if (!editedNews) return;

    setEditedNews(prev => {
      if (!prev) return prev;

      const newContent = [...prev.content];
      newContent[index] = value;
      return { ...prev, content: newContent };
    });
  };

  const addContentParagraph = () => {
    if (!editedNews) return;

    setEditedNews(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        content: [...prev.content, ""]
      };
    });
  };

  const removeContentParagraph = (index: number) => {
    if (!editedNews || editedNews.content.length <= 1) return;

    setEditedNews(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        content: prev.content.filter((_, i) => i !== index)
      };
    });
  };

  const handleResourceMaterialChange = (index: number, field: keyof ResourceMaterial, value: string | number) => {
    if (!editedNews) return;

    setEditedNews(prev => {
      if (!prev) return prev;

      const updated = [...prev.resourceMaterials];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, resourceMaterials: updated };
    });
  };

  const handleFileDelete = async (url: string) => {
    if (!url) return;

    try {
      const result = await deleteUploadedFile(url);
      if (result.success) {
        toast.success('File deleted successfully');
      } else {
        toast.error(result.message || 'Failed to delete file');
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error('Failed to delete file');
    }
  };

  const removeResourceFile = async (index: number) => {
    if (!editedNews) return;

    // Get the URL before removing it
    const urlToDelete = editedNews.resourceMaterials[index].url;

    // Remove from UI first for better UX
    setEditedNews(prev => {
      if (!prev) return prev;

      const updated = [...prev.resourceMaterials];
      updated[index] = {
        ...updated[index],
        url: "",
        fileType: "",
        fileSize: 0,
        fileName: ""
      };
      return { ...prev, resourceMaterials: updated };
    });

    // Delete from S3
    if (urlToDelete) {
      await handleFileDelete(urlToDelete);
    }
  };

  // Get file type icon
  const getFileTypeIcon = (fileType: string) => {
    if (!fileType) return <FileType className="h-5 w-5" />;

    const type = fileType.toLowerCase();
    if (type === 'pdf') return <FileText className="h-5 w-5 text-red-500" />;
    if (['doc', 'docx'].includes(type)) return <FileText className="h-5 w-5 text-blue-500" />;
    if (['xls', 'xlsx'].includes(type)) return <FileText className="h-5 w-5 text-green-500" />;
    if (['image', 'png', 'jpg', 'jpeg'].includes(type)) return <ImageIcon className="h-5 w-5 text-purple-500" />;
    return <FileType className="h-5 w-5 text-gray-500" />;
  };

  // File Upload Handling Functions
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, uploadType: string, resourceIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file || !editedNews) return;

    // File size validation (5MB for images, 10MB for documents)
    const maxSize = uploadType === 'featuredImage' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeInMB = Math.round(maxSize / (1024 * 1024));
      toast.error(`File size exceeds ${sizeInMB}MB limit`);
      e.target.value = '';
      return;
    }

    try {
      // Set uploading state
      if (uploadType === 'featuredImage') {
        // Store the old URL for deletion
        const oldUrl = editedNews.featuredImage;
        setUploadingFeaturedImage(true);

        // Upload new file
        const result = await uploadFile(file);
        console.log("Upload result:", result);

        if (result.success) {
          // Update the featured image
          setEditedNews(prev => {
            if (!prev) return prev;
            return { ...prev, featuredImage: result.data.url };
          });
          toast.success('Featured image uploaded successfully!');

          // Delete old file if it exists
          if (oldUrl) {
            await handleFileDelete(oldUrl);
          }
        }
      } else if (uploadType === 'resourceImage' && resourceIndex !== undefined) {
        // Store the old URL for deletion
        const oldUrl = editedNews.resourceMaterials[resourceIndex].url;
        setUploadingResourceIndex(resourceIndex);

        // Upload new file
        const result = await uploadFile(file);
        console.log("Upload result:", result);

        if (result.success) {
          // Determine file type from format or original filename
          const fileType = result.data.format ||
            (result.data.original_filename ?
              result.data.original_filename.split('.').pop() :
              'file');

          // Update resource material with file info
          setEditedNews(prev => {
            if (!prev) return prev;

            const updated = [...prev.resourceMaterials];
            updated[resourceIndex] = {
              ...updated[resourceIndex],
              url: result.data.url,
              fileName: file.name,
              fileType: fileType || "",
              fileSize: Math.round(result.data.size / 1024) // Convert to KB
            };

            // Set material name if it's empty
            if (!updated[resourceIndex].materialName) {
              const fileName = result.data.original_filename ||
                result.data.public_id ||
                `Resource ${resourceIndex + 1}`;
              updated[resourceIndex].materialName = fileName;
            }

            return { ...prev, resourceMaterials: updated };
          });

          toast.success('Resource file uploaded successfully!');

          // Delete old file if it exists
          if (oldUrl) {
            await handleFileDelete(oldUrl);
          }
        }
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error('Failed to upload file: ' + (error.message || 'Unknown error'));
    } finally {
      if (uploadType === 'featuredImage') {
        setUploadingFeaturedImage(false);
      } else if (uploadType === 'resourceImage') {
        setUploadingResourceIndex(null);
      }
      e.target.value = '';
    }
  };

  // Helper function to determine file type from extension
  const getFileType = (extension: string): string => {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'svg'];
    const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
    const spreadsheetTypes = ['xls', 'xlsx', 'csv'];

    if (imageTypes.includes(extension)) return 'image';
    if (documentTypes.includes(extension)) return 'document';
    if (spreadsheetTypes.includes(extension)) return 'spreadsheet';

    return extension || 'unknown';
  };

  // Function to handle file preview
  const handlePreview = (url: string | undefined) => {
    if (url == undefined) {
      return
    }
    const fileType = url.toLowerCase() || "";

    // For images, show in a modal
    if (fileType.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      setPreviewUrl(url || "");
    } else {
      // For documents, open in a new tab
      window.open(url, '_blank');
    }
  };

  const closePreview = () => {
    setPreviewUrl(null);
  };


  const addResourceMaterial = () => {
    if (!editedNews) return;

    setEditedNews(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        resourceMaterials: [
          ...prev.resourceMaterials,
          { materialName: "", fileType: "", fileSize: 0, url: "", fileName: "", isUploading: false }
        ]
      };
    });
  };

  const removeResourceMaterial = async (index: number) => {
    if (!editedNews) return;

    // Get the URL before removing it
    const urlToDelete = editedNews.resourceMaterials[index].url;

    // Remove from UI first
    setEditedNews(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        resourceMaterials: prev.resourceMaterials.filter((_, i) => i !== index)
      };
    });

    // Delete from S3 if URL exists
    if (urlToDelete) {
      await handleFileDelete(urlToDelete);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editedNews || !editedNews._id) return;

    // Validate that materials with names have files
    const invalidMaterials = editedNews.resourceMaterials.filter(
      material => material.materialName && !material.url
    );

    if (invalidMaterials.length > 0) {
      toast.error("Please upload files for all named materials");
      return;
    }

    // Validate featured image is provided
    if (!editedNews.featuredImage) {
      toast.error("Please upload a featured image");
      return;
    }

    setIsSubmitting(true);
    try {
      // We need to send back a NewsData object without the extended properties
      // that we added for UI purposes only
      const newsDataToSend: NewsData = {
        ...editedNews,
        // Ensure featuredImage is properly included in the data sent to the API
        image: editedNews.featuredImage,
        resourceMaterials: editedNews.resourceMaterials.map(material => ({
          materialName: material.materialName,
          fileType: material.fileType,
          fileSize: material.fileSize,
          url: material.url
        }))
      };

      delete (newsDataToSend as any).featuredImage;

      const result = await updateNews(editedNews._id, newsDataToSend);

      if (result.success) {
        toast.success("News updated successfully!");
        onSave(newsDataToSend);
        onClose();
      } else {
        toast.error(result.error || "Failed to update news");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // File upload component
  const FileUploadInput = ({
    id,
    onChange,
    isUploading,
    accept = 'image/png, image/jpeg, application/pdf, .doc, .docx, .xls, .xlsx, .txt',
    multiple = false,
    label = 'Choose File',
    type = 'default'
  }: {
    id: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isUploading: boolean;
    accept?: string;
    multiple?: boolean;
    label?: string;
    type?: 'default' | 'image';
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

  if (!editedNews) return null;

  console.log("Rendering with editedNews:", editedNews);
  console.log("Featured image in render:", editedNews.featuredImage);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto font-Urbanist">
          <DialogHeader>
            <DialogTitle>Edit News Article</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <Card className="border-none shadow-none">
              <CardContent className="pt-6 pb-0">
                {/* Basic Information - with featured image */}
                <div className="space-y-6 mb-8">
                  <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Basic Information</h2>

                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        News Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={editedNews.title}
                        onChange={handleChange}
                        required
                        placeholder="Enter news title"
                        className="mt-1"
                      />
                    </div>

                    {/* Featured Image Upload Section */}
                    <div className="space-y-3">
                      <Label className="block text-sm font-medium text-gray-700">
                        Featured Image <span className="text-red-500">*</span>
                      </Label>

                      {editedNews.featuredImage ? (
                        <div className="mt-3 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                          <div className="relative">
                            <div className="bg-white p-2 h-48 flex items-center justify-center overflow-hidden">
                              <img
                                src={editedNews.featuredImage}
                                alt="Featured Preview"
                                className="w-full h-64 md:h-80 lg:h-96 object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                                }}
                              />
                            </div>
                          </div>
                          <div className="p-3 bg-white border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-gray-500" />
                                <p className="text-sm font-Urbanist text-gray-700 truncate">
                                  {editedNews.featuredImage.split('/').pop() || "Featured Image"}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePreview(editedNews.featuredImage)}
                                  className="h-8 text-xs"
                                >
                                  <Eye size={14} className="mr-1" />
                                  View
                                </Button>

                                <div className="relative">
                                  <input
                                    id="featuredImage-replace"
                                    type="file"
                                    className="sr-only"
                                    onChange={(e) => handleFileUpload(e, 'featuredImage')}
                                    accept="image/*"
                                    disabled={uploadingFeaturedImage}
                                  />
                                  <label
                                    htmlFor="featuredImage-replace"
                                    className="inline-flex items-center px-3 py-1.5 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer h-8"
                                  >
                                    <PenLine size={14} className="mr-1" />
                                    Replace
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : uploadingFeaturedImage ? (
                        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 flex items-center justify-center">
                          <div className="flex flex-col items-center gap-2 text-blue-700">
                            <Loader className="h-6 w-6 animate-spin" />
                            <span className="font-Urbanist">Uploading image...</span>
                            <p className="text-xs text-blue-600 font-Urbanist">This may take a moment</p>
                          </div>
                        </div>
                      ) : (
                        <FileUploadInput
                          id="featuredImage"
                          onChange={(e) => handleFileUpload(e, 'featuredImage')}
                          isUploading={uploadingFeaturedImage}
                          accept="image/*"
                          label="Upload Featured Image"
                          type="image"
                        />
                      )}

                      <p className="text-sm text-gray-500 mt-1">Upload an eye-catching image to accompany your news article</p>
                    </div>

                    <div>
                      <Label htmlFor="publisher" className="block text-sm font-medium text-gray-700 mb-1">
                        Publisher <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="publisher"
                        name="publisher"
                        value={editedNews.publisher}
                        onChange={handleChange}
                        required
                        placeholder="Enter publisher name"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="publishedDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Publication Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="publishedDate"
                        name="publishedDate"
                        type="date"
                        value={editedNews.publishedDate}
                        onChange={handleChange}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* News Content */}
                <div className="space-y-6 mb-8">
                  <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">News Content</h2>

                  {editedNews.content.map((paragraph, index) => (
                    <div key={index} className="space-y-2 relative">
                      <Label htmlFor={`content-${index}`} className="block text-sm font-medium text-gray-700">
                        {index === 0 ? (
                          <span>Lead Paragraph <span className="text-gray-500 text-sm">(introduces your story)</span></span>
                        ) : (
                          `Paragraph ${index + 1}`
                        )}
                      </Label>
                      <div className="flex gap-2">
                        <Textarea
                          id={`content-${index}`}
                          value={paragraph}
                          onChange={(e) => handleContentChange(index, e.target.value)}
                          required
                          rows={3}
                          placeholder={index === 0 ? "Start with an attention-grabbing first paragraph..." : `Continue your story...`}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeContentParagraph(index)}
                          disabled={editedNews.content.length <= 1}
                          className="h-10 w-10 rounded-full"
                        >
                          <X size={18} className="text-gray-500" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addContentParagraph}
                    className="mt-2"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Paragraph
                  </Button>
                </div>

                {/* Resource Materials - updated with improved file upload and view functionality */}
                <div className="space-y-6 mb-4">
                  <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">Supporting Materials</h2>

                  {editedNews.resourceMaterials.length > 0 ? (
                    editedNews.resourceMaterials.map((material, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50 relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeResourceMaterial(index)}
                          className="absolute top-2 right-2 h-8 w-8 rounded-full sm:flex hidden"
                        >
                          <X size={16} className="text-gray-500" />
                        </Button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label className="text-sm">Material Name</Label>
                            <Input
                              value={material.materialName}
                              onChange={(e) => handleResourceMaterialChange(index, "materialName", e.target.value)}
                              placeholder="E.g., Annual Report"
                              className="mt-1"
                            />
                          </div>
                          <div className="flex justify-end items-center md:hidden">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeResourceMaterial(index)}
                              className="h-8 w-8 rounded-full text-gray-500"
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4">
                          <Label className="text-sm mb-2 block">File</Label>
                          {material.url ? (
                            // File is already uploaded - show preview with view/replace/remove options
                            <div className="mt-3 bg-white rounded-lg border border-gray-200 overflow-hidden">
                              <div className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                                <div className="flex items-center gap-3 mb-3 sm:mb-0">
                                  <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                                    {getFileTypeIcon(material.fileType || "")}
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

                                <div className="flex gap-2 w-full sm:w-auto justify-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePreview(material.url)}
                                    className="h-8 text-xs"
                                  >
                                    <Eye size={14} className="mr-1" />
                                    View
                                  </Button>

                                  <div className="relative">
                                    <input
                                      id={`file-replace-${index}`}
                                      type="file"
                                      className="sr-only"
                                      onChange={(e) => handleFileUpload(e, 'resourceImage', index)}
                                      accept="image/png, image/jpeg, application/pdf, .doc, .docx, .xls, .xlsx, .txt"
                                      disabled={uploadingResourceIndex === index}
                                    />
                                    <label
                                      htmlFor={`file-replace-${index}`}
                                      className="inline-flex items-center px-3 py-1.5 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer h-8"
                                    >
                                      <PenLine size={14} className="mr-1" />
                                      Replace
                                    </label>
                                  </div>

                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeResourceFile(index)}
                                    className="h-8 px-2 text-gray-500 hover:text-red-500"
                                  >
                                    <X size={14} />
                                  </Button>
                                </div>
                              </div>

                              {/* Preview for images */}
                              {(material.fileType?.toLowerCase().includes('image') ||
                                material.url.match(/\.(jpeg|jpg|gif|png)$/i)) && (
                                  <div className="border-t border-gray-100 p-2 bg-gray-50 h-32 md:h-40 flex items-center justify-center">
                                    <img
                                      src={material.url}
                                      alt={material.materialName || "Resource Preview"}
                                      className="w-auto h-32 md:h-40 max-h-full object-contain rounded"
                                      onError={(e) => {
                                        e.currentTarget.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                                      }}
                                    />
                                  </div>
                                )}
                            </div>
                          ) : uploadingResourceIndex === index ? (
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
                              type="default"
                            />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 px-6 text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-300">
                      <p className="font-Urbanist">No supporting materials attached</p>
                      <p className="text-sm font-Urbanist mt-2">This section is optional. You can update without adding materials.</p>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addResourceMaterial}
                    className="mt-2"
                  >
                    <Plus size={16} className="mr-1" />
                    Add Supporting Material
                  </Button>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 border-t mt-6 p-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="order-2 sm:order-1 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#082c34] hover:bg-[#264046] order-1 sm:order-2 w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      {previewUrl && (
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-1 sm:p-2 md:p-6 overflow-hidden">
            <div className="relative h-full">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closePreview}
                className="absolute top-2 right-2 h-8 w-8 bg-white/80 z-10 rounded-full"
              >
                <X size={16} />
              </Button>

              <div className="flex items-center justify-center overflow-auto h-[calc(80vh-64px)]">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                  }}
                />
              </div>

              <div className="mt-4 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(previewUrl, '_blank')}
                  className="text-xs"
                >
                  <ExternalLink size={14} className="mr-1" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}