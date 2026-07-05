'use client';

import { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { deleteUploadedFile, uploadFile } from '../../../../apiCalls/fileUpload';
import {
  ChevronRight,
  ChevronLeft,
  FileText,
  Image as ImageIcon,
  X,
  Plus,
  Info,
  Upload,
  FileDown,
  LayoutList,
  Eye,
  ExternalLink,
  FileType,
  Check,
  Loader
} from 'lucide-react';
import { createAnnouncement } from '../../../../apiCalls/addAnnouncement';
import Image from 'next/image';

// TypeScript interfaces
interface ButtonProps {
  buttonName: string;
  href: string;
}

interface CTAProps {
  title?: string;
  description?: string;
  imageUrl?: string;
  buttons?: ButtonProps[];
}

interface ResourceMaterial {
  materialName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

interface SubInformation {
  title: string;
  description: string;
  bulletPoints?: string[];
}

interface FormDataProps {
  title: string;
  content: string[];
  featureImage: string;
  resourceMaterials: ResourceMaterial[];
  subInformation: SubInformation[];
  cta: Partial<CTAProps>;
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

export default function AddAnnouncement() {
  const [formData, setFormData] = useState<FormDataProps>({
    title: '',
    content: [''],
    featureImage: '',
    resourceMaterials: [],
    subInformation: [],
    cta: {}
  });

  const [activeSection, setActiveSection] = useState<'basic' | 'resources' | 'additional' | 'cta'>('basic');
  const [animatingSection, setAnimatingSection] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [previewResource, setPreviewResource] = useState<ResourceMaterial | null>(null);

  // File upload states
  const [uploadingFeatureImage, setUploadingFeatureImage] = useState<boolean>(false);
  const [uploadingResourceImage, setUploadingResourceImage] = useState<number | null>(null);

  // Calculate completion percentage
  useEffect(() => {
    let completed = 0;
    let total = 1; // Basic section is required

    // Basic section
    if (formData.title && formData.content[0]?.trim().length > 0) {
      completed += 1;
    }

    // Resource Materials section
    if (formData.resourceMaterials.length > 0) {
      total += 1;
      if (formData.resourceMaterials.some(m => m.materialName && m.url)) {
        completed += 1;
      }
    }

    // Sub Information section
    if (formData.subInformation.length > 0) {
      total += 1;
      if (formData.subInformation.some(s => s.title && s.description)) {
        completed += 1;
      }
    }

    // CTA section
    if (formData.cta.title || formData.cta.description || formData.cta.buttons?.length) {
      total += 1;
      if (formData.cta.title || formData.cta.description ||
        (formData.cta.buttons && formData.cta.buttons.some(b => b.buttonName && b.href))) {
        completed += 1;
      }
    }

    setCompletionPercentage(Math.floor((completed / total) * 100));
  }, [formData]);

  // Smooth section transitions
  const changeSection = (newSection: 'basic' | 'resources' | 'additional' | 'cta') => {
    setAnimatingSection(true);
    setTimeout(() => {
      setActiveSection(newSection);
      setAnimatingSection(false);
    }, 300);
  };

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle content array changes
  const handleContentChange = (index: number, value: string) => {
    setFormData(prev => {
      const newContent = [...prev.content];
      newContent[index] = value;
      return { ...prev, content: newContent };
    });
  };

  const addContentField = () => {
    setFormData(prev => ({
      ...prev,
      content: [...prev.content, '']
    }));
  };

  const removeContentField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content.filter((_, i) => i !== index)
    }));
  };

  // Handle resource materials changes
  const updateResourceMaterial = (index: number, field: keyof ResourceMaterial, value: string | number | undefined) => {
    setFormData(prev => {
      const newMaterials = [...prev.resourceMaterials];
      newMaterials[index] = {
        ...newMaterials[index],
        [field]: value
      };
      return { ...prev, resourceMaterials: newMaterials };
    });
  };

  const handleRemoveFeatureImage = async () => {
    if (!formData.featureImage) {
      return;
    }

    try {
      // Only try to delete if the URL is from S3 (not a local preview)
      if (formData.featureImage.startsWith('http')) {
        await deleteUploadedFile(formData.featureImage);
      }

      setFormData(prev => ({ ...prev, featureImage: "" }));
      toast.success("Feature image removed successfully");
    } catch (error) {
      console.error("Error removing feature image:", error);
      toast.error("Failed to remove feature image. Please try again.");
    }
  };

  const removeResourceMaterial = async (index: number) => {
    const resourceToRemove = formData.resourceMaterials[index];

    if (previewResource && previewResource.url === resourceToRemove.url) {
      setPreviewResource(null);
    }

    try {
      // Delete the file from S3 if it exists
      if (resourceToRemove.url && resourceToRemove.url.startsWith('http')) {
        await deleteUploadedFile(resourceToRemove.url);
      }

      setFormData(prev => ({
        ...prev,
        resourceMaterials: prev.resourceMaterials.filter((_, i) => i !== index)
      }));

      toast.success("Resource material removed successfully");
    } catch (error) {
      console.error("Error removing resource material:", error);
      toast.error("Failed to remove resource material. Please try again.");
    }
  };

  const addResourceMaterial = () => {
    setFormData(prev => ({
      ...prev,
      resourceMaterials: [
        ...prev.resourceMaterials,
        { materialName: '', fileType: '', fileSize: 0, url: '' }
      ]
    }));
  };



  // Handle resource preview functionality
  const toggleResourcePreview = (resource: ResourceMaterial) => {
    setPreviewResource(prevPreview =>
      prevPreview?.url === resource.url ? null : resource
    );
  };

  // File upload component
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
            <span className="font-urbanist">Uploading...</span>
          </div>
        </div>
      ) : (
        <Label htmlFor={id} className="cursor-pointer block w-full">
          <div className={`border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors flex flex-col items-center justify-center ${type === 'image' ? 'h-40' : 'h-24'}`}>
            <div className={`flex flex-col items-center gap-2 text-gray-700 ${type === 'image' ? 'mb-2' : ''}`}>
              <div className="bg-gray-100 h-10 w-10 rounded-full flex items-center justify-center">
                <Upload className="h-5 w-5 text-gray-600" />
              </div>
              <span className="font-urbanist text-center">{label}</span>
              <p className="text-xs text-gray-500 font-gtamerica text-center mt-1 max-w-xs">
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
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, uploadType: string, resourceIndex?: number) => {
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
      } else if (uploadType === 'resourceImage' && resourceIndex !== undefined) {
        setUploadingResourceImage(resourceIndex);
      }

      console.log(`Uploading file for ${uploadType}:`, file.name);

      // Upload the file
      const result = await uploadFile(file);
      console.log("Upload result:", result);

      if (result.success) {
        if (uploadType === 'featureImage') {
          setFormData(prev => ({
            ...prev,
            featureImage: result.data.url
          }));
          toast.success('Feature image uploaded successfully!');
        } else if (uploadType === 'ctaImage') {
          handleCTAChange('imageUrl', result.data.url);
          toast.success('CTA image uploaded successfully!');
        } else if (uploadType === 'resourceImage' && resourceIndex !== undefined) {
          // Determine file type from format or original filename
          const fileType = result.data.format ||
            (result.data.original_filename ?
              result.data.original_filename.split('.').pop() :
              'file');

          // Update the resource material with uploaded file data
          updateResourceMaterial(resourceIndex, "url", result.data.url);
          updateResourceMaterial(resourceIndex, "fileType", fileType);
          updateResourceMaterial(resourceIndex, "fileSize", Math.round(result.data.size / 1024)); // Convert to KB

          // Set material name if it's empty
          if (!formData.resourceMaterials[resourceIndex].materialName) {
            const fileName = result.data.original_filename ||
              result.data.public_id ||
              `Resource ${resourceIndex + 1}`;
            updateResourceMaterial(resourceIndex, "materialName", fileName);
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
      if (uploadType === 'featureImage') {
        setUploadingFeatureImage(false);
      } else if (uploadType === 'resourceImage') {
        setUploadingResourceImage(null);
      }

      // Reset the file input
      e.target.value = '';
    }
  };

  // Handle sub-information changes
  const updateSubInformation = (index: number, field: keyof SubInformation, value: string) => {
    setFormData(prev => {
      const newSubInfo = [...prev.subInformation];
      newSubInfo[index] = { ...newSubInfo[index], [field]: value };
      return { ...prev, subInformation: newSubInfo };
    });
  };

  const handleBulletPointChange = (subInfoIndex: number, bulletIndex: number, value: string) => {
    setFormData(prev => {
      const newSubInfo = [...prev.subInformation];
      if (!newSubInfo[subInfoIndex].bulletPoints) {
        newSubInfo[subInfoIndex].bulletPoints = [];
      }
      const newBulletPoints = [...(newSubInfo[subInfoIndex].bulletPoints || [])];
      newBulletPoints[bulletIndex] = value;
      newSubInfo[subInfoIndex].bulletPoints = newBulletPoints;
      return { ...prev, subInformation: newSubInfo };
    });
  };

  const addBulletPoint = (subInfoIndex: any, event: any) => {
    // Prevent default behavior and stop propagation
    if (event) {
      event.preventDefault();
      event.nativeEvent.stopImmediatePropagation();
      event.stopPropagation();
    }

    setFormData(prev => {
      // Create copies to avoid mutation
      const newSubInfo = [...prev.subInformation];
      const subInfo = { ...newSubInfo[subInfoIndex] };

      // Initialize bulletPoints if it doesn't exist
      const bulletPoints = subInfo.bulletPoints || [];

      // Add exactly one new bullet point
      subInfo.bulletPoints = [...bulletPoints, ''];
      newSubInfo[subInfoIndex] = subInfo;

      return { ...prev, subInformation: newSubInfo };
    });
  };

  const removeBulletPoint = (subInfoIndex: any, bulletIndex: any, event: any) => {
    // Prevent default behavior and stop propagation
    if (event) {
      event.preventDefault();
      event.nativeEvent.stopImmediatePropagation();
      event.stopPropagation();
    }

    setFormData(prev => {
      // Create copies to avoid mutation
      const newSubInfo = [...prev.subInformation];
      const subInfo = { ...newSubInfo[subInfoIndex] };

      // Safety check
      if (!subInfo.bulletPoints || subInfo.bulletPoints.length === 0) {
        return prev;
      }

      // Remove exactly one bullet point
      subInfo.bulletPoints = subInfo.bulletPoints.filter((_, i) => i !== bulletIndex);
      newSubInfo[subInfoIndex] = subInfo;

      return { ...prev, subInformation: newSubInfo };
    });
  };
  const addSubInformation = () => {
    setFormData(prev => ({
      ...prev,
      subInformation: [
        ...prev.subInformation,
        { title: '', bulletPoints: [], description: '' } // Changed from [''] to []
      ]
    }));
  };
  const removeSubInformation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subInformation: prev.subInformation.filter((_, i) => i !== index)
    }));
  };

  // Handle CTA changes
  const handleCTAChange = (field: keyof CTAProps, value: string) => {
    setFormData(prev => ({
      ...prev,
      cta: { ...prev.cta, [field]: value }
    }));
  };

  const handleCTAButtonChange = (index: number, field: keyof ButtonProps, value: string) => {
    setFormData(prev => {
      const buttons = prev.cta.buttons || [];
      const newButtons = [...buttons];
      if (!newButtons[index]) {
        newButtons[index] = { buttonName: '', href: '' };
      }
      newButtons[index] = { ...newButtons[index], [field]: value };
      return { ...prev, cta: { ...prev.cta, buttons: newButtons } };
    });
  };

  const addCTAButton = () => {
    setFormData(prev => ({
      ...prev,
      cta: {
        ...prev.cta,
        buttons: [
          ...(prev.cta.buttons || []),
          { buttonName: '', href: '' }
        ]
      }
    }));
  };

  const removeCTAButton = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cta: {
        ...prev.cta,
        buttons: (prev.cta.buttons || []).filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      // Prepare the data to send
      const dataToSend = {
        title: formData.title,
        image: formData.featureImage || undefined,
        content: formData.content.filter(item => item.trim() !== ''),
        ...(formData.resourceMaterials.length > 0 && {
          resourceMaterials: formData.resourceMaterials.filter(
            item => item.materialName.trim() !== '' && item.url.trim() !== ''
          )
        }),
        ...(formData.subInformation.length > 0 && {
          subInformation: formData.subInformation.filter(
            item => item.title.trim() !== '' && item.description.trim() !== ''
          ).map(item => ({
            ...item,
            bulletPoints: item.bulletPoints ? item.bulletPoints.filter(bp => bp.trim() !== '') : []
          }))
        }),
        ...(Object.keys(formData.cta).length > 0 && {
          cta: {
            ...(formData.cta.title && { title: formData.cta.title }),
            ...(formData.cta.imageUrl && { imageUrl: formData.cta.imageUrl }),
            ...(formData.cta.description && { description: formData.cta.description }),
            ...(formData.cta.buttons && formData.cta.buttons.length > 0 && {
              buttons: formData.cta.buttons.filter(
                button => button.buttonName.trim() !== '' && button.href.trim() !== ''
              )
            })
          }
        })
      };

      await createAnnouncement(dataToSend);
      toast.success('Announcement published successfully!');

      // Reset form
      setFormData({
        title: '',
        content: [''],
        featureImage: '',
        resourceMaterials: [],
        subInformation: [],
        cta: {}
      });
      setActiveSection('basic');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to publish announcement');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Navigation steps for the form
  const formSteps = [
    { key: 'basic' as const, label: 'Basic Info' },
    { key: 'resources' as const, label: 'Resources' },
    { key: 'additional' as const, label: 'Additional Info' },
    { key: 'cta' as const, label: 'Call to Action' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto px-10">
        <Toaster />

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-canela font-bold text-gray-900 mb-3">Create New Announcement</h1>
          <p className="text-lg font-gtamerica text-gray-600 max-w-2xl">
            Create an announcement to inform users about important updates, maintenance schedules, or new features.
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-12 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-urbanist font-semibold text-gray-800">Announcement Progress</h2>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-3 h-3 rounded-full 
                  ${completionPercentage < 50 ? 'bg-amber-500' :
                    completionPercentage < 80 ? 'bg-blue-500' :
                      'bg-emerald-500'}`}></span>
                <span className="text-sm font-urbanist font-medium text-gray-600">{completionPercentage}% completed</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100 w-full">
            <div
              className="h-full transition-all duration-300 ease-out"
              style={{
                width: `${completionPercentage}%`,
                backgroundColor: completionPercentage < 50 ? '#F59E0B' :
                  completionPercentage < 80 ? '#3B82F6' :
                    '#10B981'
              }}
            ></div>
          </div>

          {/* Form navigation */}
          <div className="px-6 py-4">
            <div className="flex flex-wrap items-center gap-2 md:gap-0">
              {formSteps.map((step, index) => (
                <div key={step.key} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveSection(step.key)}
                    className={`flex items-center py-2 px-4 rounded-lg font-urbanist font-medium text-sm transition-all
                      ${activeSection === step.key
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full mr-2 text-xs
                      ${activeSection === step.key
                        ? 'bg-white text-gray-800'
                        : completionPercentage >= ((index + 1) / formSteps.length * 100)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {completionPercentage >= ((index + 1) / formSteps.length * 100) && activeSection !== step.key
                        ? <Check className="h-3 w-3" />
                        : index + 1
                      }
                    </span>
                    {step.label}
                  </button>
                  {index < formSteps.length - 1 && (
                    <span className="mx-1 md:mx-3 text-gray-300 hidden md:block">•</span>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile selector */}
            <div className="md:hidden mt-4">
              <select
                className="w-full p-3 border rounded-lg font-urbanist bg-white focus:ring-2 focus:ring-gray-300 focus:border-gray-400"
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value as 'basic' | 'resources' | 'additional' | 'cta')}
              >
                {formSteps.map((step, index) => (
                  <option key={step.key} value={step.key}>
                    {index + 1}. {step.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <form id="announcement-form" onSubmit={handleSubmit} className="space-y-12">

          {/* Basic Information Section */}
          <div className={`transition-opacity duration-300 ${animatingSection ? 'opacity-0' : 'opacity-100'} ${activeSection === 'basic' ? 'block' : 'hidden'}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                <h2 className="text-2xl font-canela font-bold text-gray-800">Basic Information</h2>
              </div>

              <div className="p-6 space-y-8">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title" className="text-lg font-urbanist font-semibold text-gray-700">
                      Title <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-500 font-urbanist">Required</span>
                  </div>

                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="Enter a concise, informative title"
                    className="p-3 text-base font-gtamerica border-gray-200 rounded-lg"
                  />
                  <p className="text-sm text-gray-500 font-gtamerica">Choose a descriptive title that clearly communicates the purpose of your announcement.</p>
                </div>

                {/* Feature Image Upload Section */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-urbanist font-semibold text-gray-700">
                      Feature Image <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-500 font-urbanist">Required</span>
                  </div>

                  {formData.featureImage ? (
                    <div className="mt-3 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      <div className="relative">
                        <div className="bg-white p-2 h-48 flex items-center justify-center overflow-hidden">
                          <img
                            src={formData.featureImage}
                            alt="Feature Image Preview"
                            className="w-full h-64 md:h-80 lg:h-96 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                            }}
                          />
                        </div>
                        <div className="absolute top-2 right-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveFeatureImage}
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
                            <p className="text-sm font-urbanist text-gray-700 truncate">
                              {formData.featureImage.split('/').pop()}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('featureImage')?.click()}
                            className="h-8 text-xs bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                          >
                            Replace
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <FileUploadInput
                      id="featureImage"
                      onChange={(e) => handleFileUpload(e, 'featureImage')}
                      isUploading={uploadingFeatureImage}
                      accept="image/*"
                      label="Upload Feature Image"
                      type="image"
                    />
                  )}

                  <p className="text-sm text-gray-500 font-gtamerica">Upload a high-quality image that represents your announcement. This will be displayed prominently.</p>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-urbanist font-semibold text-gray-700">
                      Content <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-500 font-urbanist">Required</span>
                  </div>

                  {formData.content.map((contentItem, index) => (
                    <div key={index} className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="flex-grow space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center font-urbanist font-medium text-gray-700 text-sm">
                              {index + 1}
                            </div>
                            <span className="text-sm font-urbanist text-gray-600">
                              {index === 0 ? 'Main content' : `Additional paragraph ${index}`}
                            </span>
                          </div><Textarea
                            value={contentItem}
                            onChange={(e) => handleContentChange(index, e.target.value)}
                            required={index === 0}
                            rows={5}
                            placeholder={index === 0 ?
                              "Main announcement content. Provide clear and concise information..." :
                              "Additional details for this announcement..."}
                            className="w-full p-3 border-gray-200 rounded-lg resize-none font-gtamerica"
                          />

                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-gtamerica">Use clear, concise language to communicate effectively.</span>
                            <span className="px-2 py-1 bg-gray-100 rounded-md text-gray-600 font-urbanist">
                              {contentItem.length} characters
                            </span>
                          </div>
                        </div>

                        {index > 0 && (
                          <Button
                            type="button"
                            onClick={() => removeContentField(index)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-full flex items-center justify-center"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    onClick={addContentField}
                    variant="outline"
                    className="border-dashed border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 font-urbanist rounded-lg flex items-center justify-center w-full py-3"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Another Paragraph
                  </Button>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    onClick={() => changeSection('resources')}
                    className="bg-gray-800 hover:bg-gray-700 rounded-lg px-5 py-2.5 text-white font-urbanist flex items-center"
                  >
                    Next: Resources
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Resource Materials Section */}
          <div className={`transition-opacity duration-300 ${animatingSection ? 'opacity-0' : 'opacity-100'} ${activeSection === 'resources' ? 'block' : 'hidden'}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-canela font-bold text-gray-800">Resource Materials</h2>
                <span className="text-sm font-urbanist text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">Optional</span>
              </div>

              <div className="p-6 space-y-8">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 flex gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="font-gtamerica text-gray-700 text-sm">
                    Add downloadable materials that provide additional information or support documentation for your announcement.
                  </p>
                </div>

                <div className="space-y-6">
                  {formData.resourceMaterials.length === 0 ? (
                    <div
                      className="border-2 border-dashed border-gray-200 rounded-lg py-12 px-6 text-center hover:border-gray-300 transition-all cursor-pointer"
                      onClick={addResourceMaterial}
                    >
                      <div className="bg-gray-100 h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileDown className="h-6 w-6 text-gray-600" />
                      </div>
                      <h3 className="font-urbanist font-semibold text-gray-700 mb-2 text-lg">No resources added yet</h3>
                      <p className="font-gtamerica text-gray-500 max-w-md mx-auto mb-6 text-sm">
                        Add documents, PDFs, spreadsheets, or links to helpful resources related to this announcement.
                      </p>
                      <Button
                        type="button"
                        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg font-urbanist"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Resource
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.resourceMaterials.map((material, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-5 border-l-4 border-gray-800 border border-gray-200">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center">
                              <div className="bg-white h-10 w-10 rounded-lg flex items-center justify-center mr-3 shadow-sm border border-gray-200">
                                {getFileTypeIcon(material.fileType)}
                              </div>
                              <h3 className="font-urbanist font-semibold text-gray-800">
                                {material.materialName || `Resource ${index + 1}`}
                              </h3>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                type="button"
                                onClick={() => toggleResourcePreview(material)}
                                variant="outline"
                                size="sm"
                                className="text-gray-700 border-gray-300 hover:bg-gray-100 rounded-lg text-xs"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                {previewResource?.url === material.url ? 'Hide' : 'Preview'}
                              </Button>
                              <Button
                                type="button"
                                onClick={() => removeResourceMaterial(index)}
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-full"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`material-name-${index}`} className="text-sm font-urbanist text-gray-700 mb-1.5 block">
                                Material Name
                              </Label>
                              <Input
                                id={`material-name-${index}`}
                                value={material.materialName || ''}
                                onChange={(e) => updateResourceMaterial(index, 'materialName', e.target.value)}
                                placeholder="e.g., Setup Guide"
                                className="border-gray-200 rounded-lg bg-white font-gtamerica"
                              />
                            </div>
                            <div>
                              <Label
                                htmlFor={`material-type-${index}`}
                                className="text-sm font-urbanist text-gray-700 mb-1.5 block"
                              >
                                File Type
                              </Label>
                              <Input
                                id={`material-type-${index}`}
                                type="text"
                                value={material.fileType || ''}
                                onChange={(e) => updateResourceMaterial(index, 'fileType', e.target.value)}
                                placeholder="Enter file type..."
                                className="w-full p-2.5 rounded-lg border border-gray-200 bg-white font-gtamerica"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`material-size-${index}`} className="text-sm font-urbanist text-gray-700 mb-1.5 block">
                                File Size (KB)
                              </Label>
                              <Input
                                id={`material-size-${index}`}
                                type="number"
                                value={material.fileSize || ''}
                                onChange={(e) => updateResourceMaterial(index, 'fileSize', parseInt(e.target.value) || 0)}
                                placeholder="e.g., 512"
                                className="border-gray-200 rounded-lg bg-white font-gtamerica"
                                min="0"
                              />
                            </div>

                            {/* File Upload for Resource */}
                            <div className="col-span-2">
                              <Label className="text-sm font-urbanist text-gray-700 mb-1.5 block">
                                Resource File
                              </Label>

                              {material.url ? (
                                <div className="mt-3 bg-white rounded-lg border border-gray-200 overflow-hidden">
                                  <div className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                                        {getFileTypeIcon(material.fileType)}
                                      </div>
                                      <div>
                                        <p className="text-sm font-urbanist text-gray-800">
                                          {material.materialName || material.url.split('/').pop()}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                          {material.fileType && (
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-urbanist text-gray-600">
                                              {material.fileType.toUpperCase()}
                                            </span>
                                          )}
                                          {material.fileSize > 0 && (
                                            <span className="text-xs font-gtamerica text-gray-500">
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
                                        className="text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-100 font-urbanist inline-flex items-center"
                                      >
                                        View
                                      </a>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          removeResourceMaterial(index)

                                        }}
                                        className="h-7 text-xs border-gray-200 text-gray-700 hover:bg-gray-100"
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : uploadingResourceImage === index ? (
                                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 flex items-center justify-center">
                                  <div className="flex flex-col items-center gap-2 text-blue-700">
                                    <Loader className="h-6 w-6 animate-spin" />
                                    <span className="font-urbanist">Uploading file...</span>
                                    <p className="text-xs text-blue-600 font-gtamerica">This may take a moment</p>
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

                          {previewResource?.url === material.url && (
                            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 animate-fadeIn">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-urbanist font-medium text-gray-700">Resource Preview</h4>
                                <Button
                                  type="button"
                                  onClick={() => setPreviewResource(null)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 rounded-full text-gray-400 hover:text-gray-600"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="bg-gray-100 h-10 w-10 rounded-lg flex items-center justify-center shadow-sm">
                                  {getFileTypeIcon(material.fileType)}
                                </div>
                                <div>
                                  <div className="font-urbanist font-medium text-gray-800">
                                    {material.materialName || "Untitled Resource"}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    {material.fileType && (
                                      <span className="bg-gray-200 px-2 py-0.5 rounded text-xs font-urbanist text-gray-700">
                                        {material.fileType.toUpperCase()}
                                      </span>
                                    )}
                                    {material.fileSize > 0 && (
                                      <span className="text-xs font-gtamerica text-gray-500">
                                        {material.fileSize} KB
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3">
                                <a
                                  href={material.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-urbanist truncate"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  {material.url}
                                </a>
                              </div>

                              {material.fileType?.toLowerCase().includes('image') && material.url && (
                                <div className="mt-3 bg-gray-100 rounded-lg p-2 flex items-center justify-center h-40 overflow-hidden">
                                  <img
                                    src={material.url}
                                    alt={material.materialName || "Resource Preview"}
                                    className="w-auto h-32 md:h-40 max-h-full object-contain rounded"
                                    onError={(e) => {
                                      e.currentTarget.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                                    }}
                                  />
                                  <div className="text-sm text-gray-500 hidden font-gtamerica">
                                    Failed to load image
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      <Button
                        type="button"
                        onClick={addResourceMaterial}
                        variant="outline"
                        className="border-dashed border-gray-300 hover:border-gray-500 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg py-3 flex items-center justify-center w-full font-urbanist"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Resource
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg flex items-center font-urbanist"
                    onClick={() => changeSection('basic')}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous: Basic Info
                  </Button>

                  <Button
                    type="button"
                    className="bg-gray-800 hover:bg-gray-700 rounded-lg px-5 py-2.5 text-white font-urbanist flex items-center"
                    onClick={() => changeSection('additional')}
                  >
                    Next: Additional Info
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className={`transition-opacity duration-300 ${animatingSection ? 'opacity-0' : 'opacity-100'} ${activeSection === 'additional' ? 'block' : 'hidden'}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-canela font-bold text-gray-800">Additional Information</h2>
                <span className="text-sm font-urbanist text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">Optional</span>
              </div>

              <div className="p-6 space-y-8">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 flex gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="font-gtamerica text-gray-700 text-sm">
                    Break down complex information into structured sections with titles, bullet points, and descriptions for better readability.
                  </p>
                </div>

                <div className="space-y-6">
                  {formData.subInformation.length === 0 ? (
                    <div
                      className="border-2 border-dashed border-gray-200 rounded-lg py-12 px-6 text-center hover:border-gray-300 transition-all cursor-pointer"
                      onClick={addSubInformation}
                    >
                      <div className="bg-gray-100 h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LayoutList className="h-6 w-6 text-gray-600" />
                      </div>
                      <h3 className="font-urbanist font-semibold text-gray-700 mb-2 text-lg">No sections added yet</h3>
                      <p className="font-gtamerica text-gray-500 max-w-md mx-auto mb-6 text-sm">
                        Create structured sections with titles, bullet points, and descriptions to organize your announcement information.
                      </p>
                      <Button
                        type="button"
                        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg font-urbanist"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.subInformation.map((subInfo, subInfoIndex) => (
                        <div key={subInfoIndex} className="bg-gray-50 rounded-lg p-5 border-l-4 border-gray-800 border border-gray-200">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center">
                              <div className="bg-white h-10 w-10 rounded-lg flex items-center justify-center mr-3 shadow-sm border border-gray-200">
                                <LayoutList className="h-5 w-5 text-gray-700" />
                              </div>
                              <h3 className="font-urbanist font-semibold text-gray-800">
                                {subInfo.title || `Section ${subInfoIndex + 1}`}
                              </h3>
                            </div>

                            <Button
                              type="button"
                              onClick={() => removeSubInformation(subInfoIndex)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-full"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label htmlFor={`section-title-${subInfoIndex}`} className="text-sm font-urbanist text-gray-700 mb-1.5 block">
                                Section Title
                              </Label>
                              <Input
                                id={`section-title-${subInfoIndex}`}
                                value={subInfo.title || ''}
                                onChange={(e) => updateSubInformation(subInfoIndex, 'title', e.target.value)}
                                placeholder="e.g., Affected Services"
                                className="border-gray-200 rounded-lg bg-white font-gtamerica"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <Label className="text-sm font-urbanist text-gray-700">Bullet Points</Label>
                                <Button
                                  type="button"
                                  onClick={(e) => addBulletPoint(subInfoIndex, e)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-xs py-0 px-2 text-blue-600 hover:bg-blue-50 font-urbanist"
                                >
                                  <Plus className="h-3 w-3 mr-1" /> Add Point
                                </Button>
                              </div>
                              <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                                {(subInfo.bulletPoints || []).map((bullet, bulletIndex) => (
                                  <div key={bulletIndex} className="flex items-center gap-2">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-urbanist text-xs font-medium">
                                      {bulletIndex + 1}
                                    </div>
                                    <Input
                                      value={bullet || ''}
                                      onChange={(e) => handleBulletPointChange(subInfoIndex, bulletIndex, e.target.value)}
                                      placeholder="Key point or feature"
                                      className="flex-grow border-gray-200 rounded-lg bg-gray-50 text-sm font-gtamerica"
                                    />
                                    <Button
                                      type="button"
                                      onClick={(e) => removeBulletPoint(subInfoIndex, bulletIndex, e)}
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0 flex-shrink-0 rounded-full"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>                   </div>
                                ))}

                                {(subInfo.bulletPoints || []).length === 0 && (
                                  <div className="text-center py-3 text-sm text-gray-500 font-gtamerica">
                                    No bullet points added yet. Add some key points to enhance your section.
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <Label htmlFor={`section-desc-${subInfoIndex}`} className="text-sm font-urbanist text-gray-700 mb-1.5 block">
                                Description
                              </Label>
                              <Textarea
                                id={`section-desc-${subInfoIndex}`}
                                value={subInfo.description || ''}
                                onChange={(e) => updateSubInformation(subInfoIndex, 'description', e.target.value)}
                                placeholder="Additional details or context for this section"
                                className="min-h-[100px] border-gray-200 rounded-lg bg-white font-gtamerica"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        onClick={addSubInformation}
                        variant="outline"
                        className="border-dashed border-gray-300 hover:border-gray-500 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg py-3 flex items-center justify-center w-full font-urbanist"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Section
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg flex items-center font-urbanist"
                    onClick={() => changeSection('resources')}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous: Resources
                  </Button>

                  <Button
                    type="button"
                    className="bg-gray-800 hover:bg-gray-700 rounded-lg px-5 py-2.5 text-white font-urbanist flex items-center"
                    onClick={() => changeSection('cta')}
                  >
                    Next: Call to Action
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action Section */}
          <div className={`transition-opacity duration-300 ${animatingSection ? 'opacity-0' : 'opacity-100'} ${activeSection === 'cta' ? 'block' : 'hidden'}`}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-canela font-bold text-gray-800">Call to Action</h2>
                <span className="text-sm font-urbanist text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">Optional</span>
              </div>

              <div className="p-6 space-y-8">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 flex gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="font-gtamerica text-gray-700 text-sm">
                    Add clear next steps with a call to action section that guides users on what to do with this information.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <h3 className="font-urbanist font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
                      CTA Information
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cta-title" className="text-sm font-urbanist text-gray-700 mb-1.5 block">
                          CTA Title
                        </Label>
                        <Input
                          id="cta-title"
                          value={formData.cta.title || ''}
                          onChange={(e) => handleCTAChange('title', e.target.value)}
                          placeholder="e.g., Need Help?"
                          className="border-gray-200 rounded-lg bg-white font-gtamerica"
                        />
                      </div>

                      <div>
                        <Label htmlFor="cta-description" className="text-sm font-urbanist text-gray-700 mb-1.5 block">
                          CTA Description
                        </Label><Textarea
                          id="cta-description"
                          value={formData.cta.description || ''}
                          onChange={(e) => handleCTAChange('description', e.target.value)}
                          placeholder="Provide instructions or context for the action you want users to take"
                          className="min-h-[120px] border-gray-200 rounded-lg bg-white font-gtamerica"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-urbanist font-semibold text-gray-700">CTA Buttons</h3>
                    {(formData.cta.buttons || []).length > 0 && (
                      <Button
                        type="button"
                        onClick={addCTAButton}
                        size="sm"
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg text-xs font-urbanist h-7 px-3"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add Button
                      </Button>
                    )}
                  </div>

                  {(!formData.cta.buttons || formData.cta.buttons.length === 0) ? (
                    <div
                      className="border-2 border-dashed border-gray-200 rounded-lg py-10 px-6 text-center hover:border-gray-300 transition-all cursor-pointer"
                      onClick={addCTAButton}
                    >
                      <div className="bg-gray-100 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plus className="h-6 w-6 text-gray-600" />
                      </div>
                      <h3 className="font-urbanist font-semibold text-gray-700 mb-2">No buttons added yet</h3>
                      <p className="font-gtamerica text-gray-500 max-w-md mx-auto mb-6 text-sm">
                        Add buttons to guide users to take action, such as visiting a support portal or accessing related resources.
                      </p>
                      <Button
                        type="button"
                        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg font-urbanist"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Button
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.cta.buttons?.map((button, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-urbanist font-medium text-gray-700 flex items-center">
                              <span className="bg-gray-200 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                                {index + 1}
                              </span>
                              Button
                            </h4>
                            <Button
                              type="button"
                              onClick={() => removeCTAButton(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0 rounded-full"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label htmlFor={`button-text-${index}`} className="text-sm font-urbanist text-gray-700 mb-1.5 block">
                                Button Text
                              </Label>
                              <Input
                                id={`button-text-${index}`}
                                value={button.buttonName || ''}
                                onChange={(e) => handleCTAButtonChange(index, 'buttonName', e.target.value)}
                                placeholder="e.g., Get Support"
                                className="border-gray-200 rounded-lg bg-white font-gtamerica"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`button-link-${index}`} className="text-sm font-urbanist text-gray-700 mb-1.5 block">
                                Button Link
                              </Label>
                              <Input
                                id={`button-link-${index}`}
                                value={button.href || ''}
                                onChange={(e) => handleCTAButtonChange(index, 'href', e.target.value)}
                                placeholder="https://support.example.com"
                                className="border-gray-200 rounded-lg bg-white font-gtamerica"
                                type="url"
                              />
                            </div>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-gray-100 flex items-center justify-center">
                            <div className="px-4 py-2 bg-gray-800 text-white rounded-md font-urbanist text-sm inline-flex">
                              {button.buttonName || "Button Text"}
                            </div>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        onClick={addCTAButton}
                        variant="outline"
                        className="border-dashed border-gray-300 hover:border-gray-500 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg py-3 flex items-center justify-center w-full font-urbanist"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Button
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg flex items-center font-urbanist"
                    onClick={() => changeSection('additional')}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous: Additional Info
                  </Button>

                  <Button
                    type="submit"
                    className="bg-gray-800 hover:bg-gray-700 rounded-lg px-5 py-2.5 text-white font-urbanist flex items-center"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Publish Announcement
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile submit button for easier access */}
          <div className="md:hidden sticky bottom-4 left-0 right-0 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-10">
            <Button
              type="submit"
              className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg py-3 font-urbanist font-medium"
              disabled={formSubmitting}
            >
              {formSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Publishing...
                </div>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Publish Announcement
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Tips section - Simplified */}
        <div className="mt-10 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex gap-4">
            <div className="bg-gray-100 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Info className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <h3 className="text-xl font-canela font-bold text-gray-800 mb-3">Tips for Creating Effective Announcements</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 font-gtamerica text-gray-600">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2"></div>
                  <span>Be clear and concise in your messaging</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2"></div>
                  <span>Include specific dates for time-sensitive information</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2"></div>
                  <span>Organize complex information into sections</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2"></div>
                  <span>Provide resources for users who need additional details</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2"></div>
                  <span>End with a clear call-to-action if needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2"></div>
                  <span>Use bullet points for improved readability</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}