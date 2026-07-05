"use client";
import { useState, ChangeEvent, FormEvent, MouseEvent } from "react";
import { toast, Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, ChevronLeft, Plus, X, Upload, Loader, FileText, Image as ImageIcon, FileType } from "lucide-react";
import { createNews, initialNewsState } from "../../../../apiCalls/addNews";

// Add the uploadFile function import
import { deleteUploadedFile, uploadFile } from "../../../../apiCalls/fileUpload";
import Image from "next/image";

// Define types
interface ResourceMaterial {
  materialName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

interface FileUploadInputProps {
  id: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  accept?: string;
  multiple?: boolean;
  label?: string;
  type?: 'default' | 'image';
}

interface UploadResult {
  success: boolean;
  data?: {
    url: string;
    format?: string;
    original_filename?: string;
    public_id?: string;
    size: number;
  };
  message?: string;
  error?: string;
}

export default function NewsForm() {
  const [newsData, setNewsData] = useState(initialNewsState);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [intentionalSubmit, setIntentionalSubmit] = useState<boolean>(false);
  const totalSteps = 3;

  // Add state for tracking uploads in progress
  const [uploadingResourceImage, setUploadingResourceImage] = useState<number | null>(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string>("");
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewsData(prev => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (index: number, value: string) => {
    setNewsData(prev => {
      const newContent = [...prev.content];
      newContent[index] = value;
      return { ...prev, content: newContent };
    });
  };

  const addContentParagraph = () => {
    setNewsData(prev => ({
      ...prev,
      content: [...prev.content, ""]
    }));
  };

  const removeContentParagraph = (index: number) => {
    if (newsData.content.length <= 1) return;
    setNewsData(prev => ({
      ...prev,
      content: prev.content.filter((_, i) => i !== index)
    }));
  };

  const handleResourceMaterialChange = (index: number, field: keyof ResourceMaterial, value: string | number) => {
    setNewsData(prev => {
      const updated = [...prev.resourceMaterials];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, resourceMaterials: updated };
    });
  };

  const addResourceMaterial = () => {
    setNewsData(prev => ({
      ...prev,
      resourceMaterials: [
        ...prev.resourceMaterials,
        { materialName: "", fileType: "", fileSize: 0, url: "" }
      ]
    }));
  };

  const removeResourceMaterial = (index: number) => {
    setNewsData(prev => ({
      ...prev,
      resourceMaterials: prev.resourceMaterials.filter((_, i) => i !== index)
    }));
  };

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

  // File upload component
  const FileUploadInput = ({
    id,
    onChange,
    isUploading,
    accept = 'image/png, image/jpeg, application/pdf, .doc, .docx, .xls, .xlsx, .txt',
    multiple = false,
    label = 'Choose File',
    type = 'default'
  }: FileUploadInputProps) => (
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

  // Handle file uploads
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, uploadType: 'featuredImage' | 'resourceImage', resourceIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5MB for images, 10MB for documents)
    const maxSize = uploadType === 'featuredImage' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeInMB = Math.round(maxSize / (1024 * 1024));
      toast.error(`File size exceeds ${sizeInMB}MB limit`);
      return;
    }

    try {
      // Set uploading state
      if (uploadType === 'featuredImage') {
        setUploadingFeaturedImage(true);
      } else if (uploadType === 'resourceImage' && resourceIndex !== undefined) {
        setUploadingResourceImage(resourceIndex);
      }

      console.log(`Uploading file for ${uploadType}:`, file.name);

      // Upload the file
      const result = await uploadFile(file) as UploadResult;
      console.log("Upload result:", result);

      if (result.success && result.data) {
        if (uploadType === 'featuredImage') {
          setFeaturedImageUrl(result.data.url);
          setNewsData(prev => ({
            ...prev,
            featuredImage: result.data!.url
          }));
          toast.success('Featured image uploaded successfully!');
        } else if (uploadType === 'resourceImage' && resourceIndex !== undefined) {
          // Determine file type from format or original filename
          const fileType = result.data.format ||
            (result.data.original_filename ?
              result.data.original_filename.split('.').pop() :
              'file');

          // Update the resource material with uploaded file data
          handleResourceMaterialChange(resourceIndex, "url", result.data.url);
          handleResourceMaterialChange(resourceIndex, "fileType", fileType || '');
          handleResourceMaterialChange(resourceIndex, "fileSize", Math.round(result.data.size / 1024)); // Convert to KB

          // Set material name if it's empty
          if (!newsData.resourceMaterials[resourceIndex].materialName) {
            const fileName = result.data.original_filename ||
              result.data.public_id ||
              `Resource ${resourceIndex + 1}`;
            handleResourceMaterialChange(resourceIndex, "materialName", fileName || '');
          }

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
      if (uploadType === 'featuredImage') {
        setUploadingFeaturedImage(false);
      } else if (uploadType === 'resourceImage') {
        setUploadingResourceImage(null);
      }

      // Reset the file input
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Only proceed if submission was intentional
    if (!intentionalSubmit) {
      console.log("Preventing automatic submission");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the data to send
      const dataToSend = {
        ...newsData,
        image: featuredImageUrl || newsData.featuredImage,
        // Make sure resource materials with valid URLs are included
        resourceMaterials: newsData.resourceMaterials.filter(item => item.url)
      };

      const result = await createNews(dataToSend);

      if (result.success) {
        toast.success("News created successfully!");
        setNewsData(initialNewsState);
        setFeaturedImageUrl("");
        setCurrentStep(1);
        setIntentionalSubmit(false);
      } else {
        toast.error(result.error || "Failed to create news");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSubmitting(false);
      setIntentionalSubmit(false);
    }
  };

  const nextStep = (e?: MouseEvent<HTMLButtonElement>) => {
    // Explicitly prevent form submission when navigating
    if (e) e.preventDefault();

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = (e?: MouseEvent<HTMLButtonElement>) => {
    // Explicitly prevent form submission when navigating
    if (e) e.preventDefault();

    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleFileDeletion = async (url: string) => {
    if (!url) return;

    try {
      const result = await deleteUploadedFile(url);
      if (result.success) {
        console.log("File deleted successfully from AWS:", url);
      } else {
        console.error("Failed to delete file from AWS:", result.message);
      }
    } catch (error) {
      console.error("Error deleting file from AWS:", error);
    }
  };

  // Updated function to handle featured image removal
  const handleFeaturedImageRemoval = async () => {
    if (featuredImageUrl) {
      await handleFileDeletion(featuredImageUrl);
    }
    setFeaturedImageUrl("");
    setNewsData(prev => ({ ...prev, featuredImage: "" }));
  };

  // Updated function to handle resource material removal
  const handleResourceMaterialRemoval = async (index: number) => {
    const material = newsData.resourceMaterials[index];
    if (material.url) {
      await handleFileDeletion(material.url);
    }
    removeResourceMaterial(index);
  };

  // Updated function to handle resource material replacement
  const handleResourceMaterialReplacement = async (index: number) => {
    const material = newsData.resourceMaterials[index];
    if (material.url) {
      await handleFileDeletion(material.url);
    }
    handleResourceMaterialChange(index, "url", "");
    handleResourceMaterialChange(index, "fileType", "");
    handleResourceMaterialChange(index, "fileSize", 0);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-sm rounded-lg">
      <Toaster position="top-right" />

      <h1 className="text-3xl font-Urbanist font-semibold text-gray-800 mb-3">Create News</h1>
      <p className="text-base font-Urbanist text-gray-500 mb-8">Complete each step to publish your news article</p>

      {/* Progress Indicator */}
      <div className="mb-10">
        <div className="flex justify-between">
          {[...Array(totalSteps)].map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                  ${currentStep > index + 1
                    ? "bg-gray-800 border-gray-800 text-white"
                    : currentStep === index + 1
                      ? "border-gray-800 text-gray-800"
                      : "border-gray-300 text-gray-300"}`}
              >
                {index + 1}
              </div>
              <span className={`text-sm font-Urbanist mt-2 ${currentStep >= index + 1 ? "text-gray-800" : "text-gray-300"}`}>
                {index === 0 ? "Basic Info" : index === 1 ? "Content" : "Materials"}
              </span>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute h-1 bg-gray-200 top-0 left-5 right-5"></div>
          <div
            className="absolute h-1 bg-gray-800 top-0 left-5 transition-all duration-300 ease-in-out"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} onClick={(e) => e.target === e.currentTarget && e.preventDefault()}>
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <div className="border-b pb-3 mb-6">
              <h2 className="text-2xl font-Urbanist font-medium text-gray-800">Basic Information</h2>
              <p className="text-sm font-Urbanist text-gray-500 mt-1">Enter the essential details of your news article</p>
            </div>

            <div className="space-y-7 px-1">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-base font-Urbanist font-medium text-gray-700">
                  News Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={newsData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter a compelling headline"
                  className="w-full border-gray-300 py-3"
                />
                <p className="text-sm font-Urbanist text-gray-500 mt-1">Create a concise, attention-grabbing headline that summarizes your news</p>
              </div>

              {/* Featured Image Upload Section */}
              <div className="space-y-3">
                <Label className="text-base font-Urbanist font-medium text-gray-700">
                  Featured Image <span className="text-red-500">*</span>
                </Label>
                {featuredImageUrl ? (
                  <div className="mt-3 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                    <div className="relative">
                      <div className="bg-white p-2 h-48 flex items-center justify-center overflow-hidden">
                        <img
                          src={featuredImageUrl}
                          alt="Featured Preview"
                          className="w-full h-48 object-contain"
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                      <div className="absolute top-2 right-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleFeaturedImageRemoval}
                          className="bg-white/90 text-red-500 hover:text-red-700 hover:bg-white rounded-full h-8 w-8 p-0 flex items-center justify-center shadow-sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 bg-white border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-gray-500" />
                          <p className="text-sm font-Urbanist text-gray-700 truncate">
                            {featuredImageUrl.split('/').pop()}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleFeaturedImageRemoval}
                          className="h-8 text-xs bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                        >
                          Replace
                        </Button>
                      </div>
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

                <p className="text-sm font-Urbanist text-gray-500 mt-1">Upload an eye-catching image to accompany your news article</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="publisher" className="text-base font-Urbanist font-medium text-gray-700">
                  Publisher <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="publisher"
                  name="publisher"
                  value={newsData.publisher}
                  onChange={handleChange}
                  required
                  placeholder="E.g., Global News Network"
                  className="w-full border-gray-300 py-3"
                />
                <p className="text-sm font-Urbanist text-gray-500 mt-1">Name of the organization or source publishing this news</p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="publishedDate" className="text-base font-Urbanist font-medium text-gray-700">
                  Publication Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="publishedDate"
                  name="publishedDate"
                  type="date"
                  value={newsData.publishedDate}
                  onChange={handleChange}
                  required
                  className="w-full border-gray-300 py-3"
                />
                <p className="text-sm font-Urbanist text-gray-500 mt-1">When this news was or will be published</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: News Content */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <div className="border-b pb-3 mb-6">
              <h2 className="text-2xl font-Urbanist font-medium text-gray-800">News Content</h2>
              <p className="text-sm font-Urbanist text-gray-500 mt-1">Write your news article in easy-to-read paragraphs</p>
            </div>

            <div className="space-y-8 px-1">
              {newsData.content.map((paragraph, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor={`content-${index}`} className="text-base font-Urbanist font-medium text-gray-700">
                      {index === 0 ? (
                        <span>Lead Paragraph <span className="text-gray-500 text-sm">(introduces your story)</span></span>
                      ) : (
                        `Paragraph ${index + 1}`
                      )}
                    </Label>

                    {newsData.content.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContentParagraph(index)}
                        className="text-gray-400 hover:text-gray-600 p-2"
                        aria-label="Remove paragraph"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  <Textarea
                    id={`content-${index}`}
                    value={paragraph}
                    onChange={(e) => handleContentChange(index, e.target.value)}
                    required
                    rows={5}
                    placeholder={index === 0 ? "Start with an attention-grabbing first paragraph..." : `Continue your story...`}
                    className="w-full border-gray-300 resize-y font-Urbanist"
                  />

                  {index === 0 && (
                    <p className="text-sm font-Urbanist text-gray-500 mt-1">The lead paragraph should engage readers and summarize key points</p>
                  )}

                  {index > 0 && index === newsData.content.length - 1 && (
                    <p className="text-sm font-Urbanist text-gray-500 mt-1">Add supporting details, quotes, or background information</p>
                  )}

                  {index < newsData.content.length - 1 && <Separator className="my-6" />}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addContentParagraph}
              className="mt-4 border-dashed py-5 font-Urbanist"
            >
              <Plus size={18} className="mr-2" /> Add Paragraph
            </Button>
          </div>
        )}

        {/* Step 3: Supporting Materials */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <div className="border-b pb-3 mb-6">
              <h2 className="text-2xl font-Urbanist font-medium text-gray-800">Supporting Materials <span className="text-sm font-Urbanist text-gray-500">(Optional)</span></h2>
              <p className="text-sm font-Urbanist text-gray-500 mt-1">Add documents or files that supplement your news article</p>
            </div>

            <div className="space-y-6 px-1">
              {newsData.resourceMaterials.length > 0 ? (
                newsData.resourceMaterials.map((material, index) => (
                  <div key={index} className="p-6 border border-gray-200 rounded-md bg-gray-50 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-Urbanist font-medium text-gray-700">Material {index + 1}</h3>
                        <span className="text-xs font-Urbanist text-gray-500 px-2 py-1 bg-gray-100 rounded-full">Optional</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleResourceMaterialRemoval(index)}
                        className="text-gray-400 hover:text-gray-600 p-2"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-Urbanist font-medium text-gray-600">Material Name</Label>
                        <Input
                          value={material.materialName}
                          onChange={(e) => handleResourceMaterialChange(index, "materialName", e.target.value)}
                          placeholder="E.g., Annual Report"
                          className="border-gray-300 py-3 font-Urbanist"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-Urbanist font-medium text-gray-600">File Type</Label>
                        <Input
                          value={material.fileType}
                          onChange={(e) => handleResourceMaterialChange(index, "fileType", e.target.value)}
                          placeholder="E.g., pdf, jpg"
                          className="border-gray-300 py-3 font-Urbanist"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-Urbanist font-medium text-gray-600">File Size (KB)</Label>
                        <Input
                          type="number"
                          value={material.fileSize}
                          onChange={(e) => handleResourceMaterialChange(index, "fileSize", Number(e.target.value))}
                          placeholder="Size in KB"
                          className="border-gray-300 py-3 font-Urbanist"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-Urbanist font-medium text-gray-600">URL</Label>
                        <Input
                          value={material.url}
                          onChange={(e) => handleResourceMaterialChange(index, "url", e.target.value)}
                          placeholder="https://example.com/file.pdf"
                          className="border-gray-300 py-3 font-Urbanist"
                        />
                      </div>

                      {/* File Upload for Resource */}
                      <div className="space-y-2 col-span-2">
                        <Label className="text-sm font-Urbanist font-medium text-gray-600">Resource File</Label>

                        {material.url ? (
                          <div className="mt-3 bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                                  View
                                </a>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResourceMaterialReplacement(index)}
                                  className="h-7 text-xs border-gray-200 text-gray-700 hover:bg-gray-100"
                                >
                                  Replace
                                </Button>
                              </div>
                            </div>

                            {/* Preview for images */}
                            {(material.fileType?.toLowerCase().includes('image') ||
                              material.url.match(/\.(jpeg|jpg|gif|png)$/i)) && (
                                <div className="border-t border-gray-100 p-2 bg-gray-50 h-32 flex items-center justify-center">
                                  <img
                                    src={material.url}
                                    alt={material.materialName || "Resource Preview"}
                                    className="w-auto h-32 max-h-full object-contain"
                                    style={{ objectFit: 'contain' }}
                                  />
                                </div>
                              )}
                          </div>
                        ) : uploadingResourceImage === index ? (
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
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 px-6 text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-300">
                  <p className="font-Urbanist">No supporting materials added</p>
                  <p className="text-sm font-Urbanist mt-2">This section is optional. You can publish without adding materials.</p>
                </div>
              )}

              <div className="flex flex-col items-center mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addResourceMaterial}
                  className="border-dashed py-5 px-6 font-Urbanist"
                >
                  <Plus size={18} className="mr-2" /> Add Optional Material
                </Button>
                <p className="text-xs font-Urbanist text-gray-500 mt-3">You can skip this section if no supporting materials are needed</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-10 pt-5 border-t">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              className="flex items-center py-5 px-6 font-Urbanist"
            >
              <ChevronLeft size={18} className="mr-2" /> Previous
            </Button>
          ) : (
            <div></div>
          )}

          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={nextStep}
              className="bg-gray-800 hover:bg-gray-700 text-white py-5 px-8 font-Urbanist"
            >
              Next <ChevronRight size={18} className="ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={() => setIntentionalSubmit(true)}
              disabled={isSubmitting}
              className="bg-gray-800 hover:bg-gray-700 text-white py-5 px-8 font-Urbanist"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Publishing...
                </>
              ) : "Publish News"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}