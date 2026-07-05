"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Phone,
  CreditCard,
  Shield,
  Upload,
  QrCode,
  Download,
  ExternalLink,
  X,
  Save,
  FileText,
  File,
  Image as LucideImage,
  Copy,
  CheckCircle2,
  Book,
  CheckCircle,
} from "lucide-react";
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
import { useState, useEffect, useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { uploadFile } from "../../../apiCalls/fileUpload";
import { registerUser } from "../../../apiCalls/registerUser";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { CourseSummary, fetchCoursesByDeliveryMode, Pagination } from "../../../apiCalls/fetchCourses";


interface CourseSelectionFieldProps {
  field: SelectField;
  error?: string;
  value: string | null | undefined;
  selectedModeForHybrid?: 'online' | 'offline' | null;
  courses: CourseSummary[];
  setCourses: React.Dispatch<React.SetStateAction<CourseSummary[]>>;
  setSelectedModeForHybrid: (mode: 'online' | 'offline' | undefined) => void;
  onCourseChange: (field: string, value: string) => void;
  deliveryMode: 'online' | 'offline' | 'hybrid';
  setDeliveryMode: (mode: 'online' | 'offline' | 'hybrid') => void;
}
const CourseSelectionField = ({
  field,
  error,
  value,
  selectedModeForHybrid,
  setSelectedModeForHybrid,
  setCourses,
  courses,
  onCourseChange,
  deliveryMode,
  setDeliveryMode
}: CourseSelectionFieldProps) => {

  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    itemsPerPage: 15,  
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState<CourseSummary | null>(null);

  useEffect(() => {
    loadCourses(pagination.currentPage, pagination.itemsPerPage);
  }, [deliveryMode]);

  const loadCourses = async (page: number, limit: number) => {
    setIsLoading(true);
    try {
      if((pagination.itemsPerPage * pagination.currentPage) < courses.length){
        return;
      }
      const response = await fetchCoursesByDeliveryMode(deliveryMode, page, limit);

      setCourses(prevCourses =>
        page === 1 ? response.data.courses : [...prevCourses, ...response.data.courses]
      );

      setPagination(response.data.pagination);

      if (deliveryMode !== 'hybrid') {
        setSelectedModeForHybrid(undefined);
      }
    } catch (error) {
      console.error("Failed to load courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    loadCourses(newPage, pagination.itemsPerPage);
  };

  const handleCourseSelect = (courseId: string) => {
    const selectedCourse = courses.find(course => course._id === courseId);
    if (selectedCourse) {
      setSelectedCourseDetails(selectedCourse);
      onCourseChange(field.name, courseId);

      if (selectedCourse.deliveryMode !== 'hybrid') {
        onCourseChange('deliveryPreference', selectedCourse.deliveryMode);
      }
    }
  };

  const handlePlatformSelect = (mode: 'online' | 'offline') => {
    setSelectedModeForHybrid(mode);
    onCourseChange('deliveryPreference', mode);
  };

  return (
    <div className="w-full font-Urbanist space-y-4">
      {/* Delivery Mode Selection */}
      <div className="space-y-2">
        <Label className="text-sm md:text-base font-medium text-gray-700">
          Select course type (online/offline/hybrid)
        </Label>
        <div className="flex flex-wrap gap-2">
          {['online', 'offline', 'hybrid'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => (setDeliveryMode(mode as 'online' | 'offline' | 'hybrid'),
                setPagination({
                  currentPage: 1,
                  itemsPerPage: 15,
                  totalItems: 0,
                  totalPages: 1,
                  hasNextPage: false,
                  hasPreviousPage: false,
                }),
                setCourses([])
              )}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                deliveryMode === mode
                  ? 'bg-[#010794] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Hybrid Mode Selection */}
      {deliveryMode === 'hybrid' && (
        <div className="space-y-2">
          <Label className="text-sm md:text-base font-medium text-gray-700">
            The selected course offers both online and offline, which platform do you prefer?
          </Label>
          <div className="flex flex-wrap gap-2">
            {['online', 'offline'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handlePlatformSelect(mode as 'online' | 'offline')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  selectedModeForHybrid === mode
                    ? 'bg-[#010794] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          {!selectedModeForHybrid && (
            <p className="text-xs text-red-600">
              Please select your preferred platform for hybrid courses
            </p>
          )}
        </div>
      )}

      {/* Course Selection */}
      <div className="space-y-2">
        <Label className="text-sm md:text-base font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Loading courses...
          </div>
        ) : courses.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            No {deliveryMode} courses available
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto p-1">
            {courses.map((course) => (
              <div
                key={course._id}
                className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${
                  value === course._id
                    ? 'border-[#010794] bg-[#010794]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleCourseSelect(course._id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 flex-shrink-0 ${
                    value === course._id ? 'text-[#010794]' : 'text-gray-400'
                  }`}>
                    {value === course._id ? (
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {course.title}
                      </h4>
                      <Badge variant="outline" className="text-xs sm:text-sm">
                        {course.deliveryMode}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500 mt-1">
                      <span>{course.category}</span>
                      <span>•</span>
                      <span className="truncate">{course.moduleLeader}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-2 sm:gap-0">
                      <div className="flex flex-wrap items-center gap-x-2">
                        {course.deliveryMode === 'hybrid' ? (
                          <>
                            <span className="text-xs font-medium text-green-600">
                              Online: NPR {course.onlinePrice}
                            </span>
                            <span className="text-xs text-gray-400">|</span>
                            <span className="text-xs font-medium text-blue-600">
                              Offline: NPR {course.offlinePrice}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-medium">
                            NPR {course.deliveryMode === 'online' ? course.onlinePrice : course.offlinePrice}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                        <span>{course.overallHours} hrs</span>
                        <span>•</span>
                        <span>{course.studentsEnrolled} students</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center mt-1">
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </p>
      )}

      {/* Selected Course Details */}
      {selectedCourseDetails && (
        <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 text-sm sm:text-base mb-2">Selected Course Details</h4>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-xs sm:text-sm">
            <div className="truncate">
              <span className="text-gray-500">Title:</span>
              <span className="ml-2 font-medium truncate">{selectedCourseDetails.title}</span>
            </div>
            <div className="truncate">
              <span className="text-gray-500">Category:</span>
              <span className="ml-2 font-medium truncate">{selectedCourseDetails.category}</span>
            </div>
            <div className="truncate">
              <span className="text-gray-500">Delivery Mode:</span>
              <span className="ml-2 font-medium capitalize truncate">
                {selectedCourseDetails.deliveryMode}
              </span>
            </div>
            <div className="truncate">
              <span className="text-gray-500">Module Leader:</span>
              <span className="ml-2 font-medium truncate">{selectedCourseDetails.moduleLeader}</span>
            </div>
            <div className="truncate">
              <span className="text-gray-500">Duration:</span>
              <span className="ml-2 font-medium truncate">
                {selectedCourseDetails.overallHours} hours
              </span>
            </div>
            <div className="truncate">
              <span className="text-gray-500">Price:</span>
              <span className="ml-2 font-medium truncate">
                {selectedCourseDetails.deliveryMode === 'hybrid' ? (
                  selectedModeForHybrid === 'online' ? (
                    `NPR ${selectedCourseDetails.onlinePrice} (Online)`
                  ) : selectedModeForHybrid === 'offline' ? (
                    `NPR ${selectedCourseDetails.offlinePrice} (Offline)`
                  ) : 'Please select platform'
                ) : (
                  `NPR ${
                    selectedCourseDetails.deliveryMode === 'online'
                      ? selectedCourseDetails.onlinePrice
                      : selectedCourseDetails.offlinePrice
                  }`
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 mt-4">
        <div className="text-xs sm:text-sm text-gray-500">
          Page {pagination.currentPage} of {pagination.totalPages}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasNextPage || isLoading || courses.length >= pagination.totalItems}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            className="text-xs sm:text-sm"
          >
            Load More Courses
          </Button>
        </div>
      </div>

      {pagination.totalPages > 1 && (
        <div className="text-xs text-gray-500 mt-2">
          {courses.length >= pagination.totalItems
            ? "All courses loaded"
            : "Can't find your course? Click 'Next' to see more options."}
        </div>
      )}
    </div>
  );
};

type FileData = {
  file: File;
  preview: string;
};

type BaseField = {
  name: string;
  label: string;
  required?: boolean;
  validation?: (
    value: string | FileData | null,
    formData?: Record<string, any>
  ) => string | undefined;
  icon?: React.ReactNode;
};

type InputField = BaseField & {
  type: "text" | "email" | "tel" | "password" | "file";
  placeholder?: string;
  accept?: string;
};

type SelectField = BaseField & {
  type: "select";
  options: {
    value: string;
    label: string;
    badge?: string;
    description?: string;
  }[];
  placeholder?: string;
};

type Field = InputField | SelectField;

type FormDataType = Record<string, string | FileData | null>;

const bankDetails = {
  bankName: "Nabil Bank",
  accountName: "DRAGON EDUCATION FOUNDATION PRIVATE LIMITED",
  accountNumber: "03101017501853",
  bankCode: "NARBNPKA",
};

const QRCodeDisplay = ({
  amount = '',
  accountName,
  accountNumber,
  bankName
}: {
  amount?: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadQRCode = () => {
    setIsDownloading(true);
    try {
      // Get the PNG image element instead of SVG
      const imgElement = document.getElementById('payment-qr-code') as HTMLImageElement;
      if (!imgElement) {
        console.error('QR Code PNG image element not found');
        setIsDownloading(false);
        return;
      }

      // Create a canvas element
      const canvas = document.createElement('canvas');
      canvas.width = imgElement.naturalWidth || imgElement.width;
      canvas.height = imgElement.naturalHeight || imgElement.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        console.error('Could not get canvas context');
        setIsDownloading(false);
        return;
      }

      // Draw the image onto the canvas
      ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

      // Convert to PNG and download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'payment-qr-code.png';
      link.href = dataUrl;
      link.click();
      setIsDownloading(false);

    } catch (error) {
      console.error('Error downloading QR code:', error);
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-4">
        <h4 className="text-lg font-medium text-gray-800 font-Urbanist mb-1">Scan to Pay</h4>
        <p className="text-sm text-gray-500 font-Urbanist">Use your banking app to scan</p>
      </div>

      <div className="w-48 h-48 border border-gray-200 p-2 rounded-lg bg-white">
        <img id="payment-qr-code" alt="Payment QR Code"
          className="w-full h-full object-contain" src={`/images/qr.png`}></img>
      </div>

      <div className="mt-4 flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs font-Urbanist inline-flex items-center"
          onClick={downloadQRCode}
          disabled={isDownloading}
        >
          <Download className="h-3 w-3 mr-1" />
          {isDownloading ? 'Downloading...' : 'Download QR'}
        </Button>


      </div>

      {amount && (
        <div className="mt-3 px-4 py-2 bg-blue-50 rounded-lg border border-blue-100 text-center">
          <p className="text-sm font-medium text-blue-700 font-Urbanist">
            Amount: NPR{amount}
          </p>
        </div>
      )}
    </div>
  );
};

const steps: { title: string; description: string; fields: Field[] }[] = [
  {
    title: "Personal Information",
    description: "Tell us about yourself to get started",
    fields: [
      {
        name: "fullName",
        label: "Full Name",
        type: "text",
        required: true,
        icon: <User className="h-4 w-4 text-gray-500" />,
        placeholder: "John Doe",
        validation: (value) => (!value ? "Name is required" : undefined),
      },
      {
        name: "email",
        label: "Email Address",
        type: "email",
        required: true,
        icon: <Mail className="h-4 w-4 text-gray-500" />,
        placeholder: "john@example.com",
        validation: (value) => {
          if (!value) return "Email is required";
          if (typeof value !== "string") return "Invalid email format";
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) return "Please enter a valid email";
          return undefined;
        },
      },
      {
        name: "phone",
        label: "Phone Number (This phone number should match the one on your citizenship document that you will submit later; otherwise, you will not be verified.) ",
        type: "tel",
        required: true,
        icon: <Phone className="h-4 w-4 text-gray-500" />,
        placeholder: "+1 (555) 123-4567",
        validation: (value) => {
          if (!value) return "Phone number is required";
          if (typeof value !== "string") return "Invalid phone number format";
          if (!/^\+?[0-9\s\(\)-]{8,}$/.test(value))
            return "Please enter a valid phone number";
          return undefined;
        },
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        required: true,
        placeholder: "**********",
        icon: <Lock className="h-4 w-4 text-gray-500" />,
        validation: (value) => {
          if (!value) return "Password is required";
          if (typeof value !== "string") return "Invalid password format";
          if (value.length < 8) return "Password must be at least 8 characters";
          if (!/[A-Z]/.test(value))
            return "Password must contain at least one uppercase letter";
          if (!/[0-9]/.test(value))
            return "Password must contain at least one number";
          return undefined;
        },
      },
      {
        name: "confirmPassword",
        label: "Confirm Password",
        type: "password",
        required: true,
        placeholder: "**********",
        icon: <Shield className="h-4 w-4 text-gray-500" />,
        validation: (value, formData) => {
          if (!value) return "Please confirm your password";
          if (typeof value !== "string") return "Invalid password format";
          if (!formData || typeof formData.password !== "string")
            return "Invalid password comparison";
          if (value !== formData.password) return "Passwords do not match";
          return undefined;
        },
      },
    ],
  },
  {
    title: "Course Selection",
    description: "Select the course you want to enroll in",
    fields: [
      {
        name: "course",
        label: "Select Course",
        type: "select",
        required: true,
        icon: <Book className="h-4 w-4 text-gray-500" />,
        placeholder: "Select a course",
        options: [],
        validation: (value) => (!value ? "Please select a course" : undefined),
      }
    ],
  },
  {
    title: "Choose Your Plan",
    description: "Select a subscription plan that works for you",
    fields: [
      {
        name: "plan",
        label: "Subscription Plan",
        type: "select",
        required: true,
        icon: <CreditCard className="h-4 w-4 text-gray-500" />,
        placeholder: "Select a plan",
        options: [
          {
            value: "free",
            label: "Free Plan",
            description: "Limited access to basic features",
          },
          {
            value: "half",
            label: "Half Payment of the Course",
            badge: "Popular",
            description: "Half access to the materials",
          },
          {
            value: "full",
            label: "Full Payment of the Course",
            description: "Full access to the materials ",
          },
        ],
        validation: (value) => (!value ? "Please select a plan" : undefined),
      },
    ],
  },
  {
    title: "Payment Details",
    description: "Complete payment to activate your subscription",
    fields: [
      {
        name: "paymentReceipt",
        label: "Payment Receipt",
        type: "file",
        required: true,
        accept: "image/png",
        icon: <Upload className="h-4 w-4 text-gray-500" />,
        validation: (value) => {
          if (!value) return "Please upload your payment receipt";
          if (typeof value === 'string') return "Invalid file format";
          if (value.file.size > 5 * 1024 * 1024) return "File size must be less than 5MB";
          if (value.file.type !== "image/png") return "Only PNG files are accepted";
          return undefined;
        },
      },
    ],
  },
  {
    title: "Citizenship Verification",
    description: "Upload your citizenship document for verification",
    fields: [
      {
        name: "citizenship",
        label: "Citizenship Document",
        type: "file",
        required: true,
        accept: "image/png",
        icon: <Upload className="h-4 w-4 text-gray-500" />,
        validation: (value) => {
          if (!value) return "Please upload your citizenship document";
          if (typeof value === 'string') return "Invalid file format";
          if (value.file.size > 5 * 1024 * 1024) return "File size must be less than 5MB";
          if (value.file.type !== "image/png") return "Only PNG files are accepted";
          return undefined;
        },
      }
    ],
  },
];

const animations = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: "easeOut" },
  },
  listItem: {
    initial: { opacity: 0, x: -10 },
    animate: (custom: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        delay: custom * 0.1,
      },
    }),
    exit: { opacity: 0, x: 10 },
  },
  scale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const SROnly = ({ children }: { children: React.ReactNode }) => (
  <span className="sr-only">{children}</span>
);

const FileIcon = ({ type }: { type: string }) => {
  if (!type) return <File className="h-8 w-8 text-blue-500" />;

  if (type.startsWith("image/")) {
    return <LucideImage className="h-8 w-8 text-green-500" />;
  } else if (type === "application/pdf") {
    return <FileText className="h-8 w-8 text-red-500" />;
  } else {
    return <File className="h-8 w-8 text-blue-500" />;
  }
};

const FileUploadField = ({
  field,
  error,
  value,
  onFileChange,
}: {
  field: InputField;
  error?: string;
  value: FileData | null | undefined;
  onFileChange: (field: string, value: FileData | null) => void;
}) => {
  const [localValue, setLocalValue] = useState<FileData | null>(value || null);

  useEffect(() => {
    // Sync with parent value
    if (value) {
      setLocalValue(value);
    } else {
      setLocalValue(null);
    }
  }, [value]);

  const hasPreview = localValue?.preview;
  const fileType = localValue?.file?.type || "";
  const isImage = fileType.startsWith("image/");

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-[#010794]", "bg-[#010794]/5");
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-[#010794]", "bg-[#010794]/5");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-[#010794]", "bg-[#010794]/5");

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type and size
    if (field.accept && !file.type.match(field.accept)) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    const filePreview = URL.createObjectURL(file);
    const newValue = { file, preview: filePreview };
    setLocalValue(newValue);
    onFileChange(field.name, newValue);
  };

  const handleRemove = () => {
    if (localValue?.preview) {
      URL.revokeObjectURL(localValue.preview);
    }
    setLocalValue(null);
    onFileChange(field.name, null);
  };

  return (
    <div className="space-y-2">
      {!hasPreview ? (
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 transition-all 
            ${error
              ? "border-red-300 bg-red-50"
              : "border-gray-200 hover:border-[#010794] hover:bg-[#010794]/5"
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            id={field.name}
            type="file"
            accept={field.accept || "image/*,.pdf"}
            className="absolute inset-0 font-Urbanist w-full h-full opacity-0 cursor-pointer z-10"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
            aria-invalid={!!error}
            aria-describedby={error ? `${field.name}-error` : undefined}
          />

          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 mb-3 bg-[#010794]/10 rounded-full flex items-center justify-center">
              {field.icon || <Upload className="h-5 w-5 text-[#010794]" />}
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1 font-Urbanist">
              {field.label}
            </p>

            <p className="text-xs text-gray-500 mb-2 font-Urbanist">
              Drag and drop or click to browse
            </p>
            <p className="text-xs text-gray-400 font-Urbanist">
              {field.accept === "image/png"
                ? "PNG files only (max 5MB)"
                : "Accepted formats: JPG, PNG, PDF (max 5MB)"}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-2 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-3">

            <div className="w-16 h-16 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileIcon type={fileType} />
            </div>


            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate font-Urbanist">
                {localValue.file.name}
              </p>
              <p className="text-xs text-gray-500 font-Urbanist">
                {(localValue.file.size / 1024).toFixed(1)} KB •{" "}
                {fileType.split("/")[1]?.toUpperCase() || "FILE"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="text-gray-400 hover:text-red-500"
              aria-label="Remove file"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 font-Urbanist">
        {field.accept === "image/png"
          ? "Please upload a PNG file (max 5MB)"
          : "Max file size: 5MB"}
      </p>

      {error && (
        <p
          id={`${field.name}-error`}
          className="text-xs text-red-500 flex items-center mt-1 font-Urbanist"
          role="alert"
        >
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

const PaymentInformation = ({
  formData,
  courses
}: {
  formData: FormDataType,
  courses: CourseSummary[]
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const getAmount = () => {
    if (!formData.course || !formData.plan) return '';

    const selectedCourse = courses.find(c => c._id === formData.course);
    if (!selectedCourse) return '';

    const plan = formData.plan as string;
    const isHalfPlan = plan === 'half';

    if (selectedCourse.deliveryMode === 'hybrid') {
      const deliveryPreference = formData.deliveryPreference as 'online' | 'offline' | undefined;
      if (!deliveryPreference) return '';

      const baseAmount = deliveryPreference === 'online'
        ? selectedCourse.onlinePrice
        : selectedCourse.offlinePrice;

      return isHalfPlan ? (baseAmount / 2).toString() : baseAmount.toString();
    } else {
      const baseAmount = selectedCourse.deliveryMode === 'online'
        ? selectedCourse.onlinePrice
        : selectedCourse.offlinePrice;

      return isHalfPlan ? (baseAmount / 2).toString() : baseAmount.toString();
    }
  };

  const amount = getAmount();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* QR Code Section */}
        <div className="flex-1 bg-white rounded-xl p-6 border border-gray-200 flex flex-col items-center">
          <QRCodeDisplay
            amount={amount}
            accountName={bankDetails.accountName}
            accountNumber={bankDetails.accountNumber}
            bankName={bankDetails.bankName}
          />
        </div>

        {/* Bank Details Section */}
        <div className="flex-1 bg-white rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-medium text-gray-800 font-Urbanist mb-4">Bank Transfer Details</h4>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 font-Urbanist mb-1">Bank Name</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800 font-Urbanist">{bankDetails.bankName}</p>
                <button
                  className="text-[#010794] hover:text-[#010794]/80"
                  onClick={() => copyToClipboard(bankDetails.bankName, 'bankName')}
                >
                  {copied === 'bankName' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-Urbanist mb-1">Account Name</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800 font-Urbanist">{bankDetails.accountName}</p>
                <button
                  className="text-[#010794] hover:text-[#010794]/80"
                  onClick={() => copyToClipboard(bankDetails.accountName, 'accountName')}
                >
                  {copied === 'accountName' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-Urbanist mb-1">Account Number</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800 font-Urbanist">{bankDetails.accountNumber}</p>
                <button
                  className="text-[#010794] hover:text-[#010794]/80"
                  onClick={() => copyToClipboard(bankDetails.accountNumber, 'accountNumber')}
                >
                  {copied === 'accountNumber' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>


            <div>
              <p className="text-xs text-gray-500 font-Urbanist mb-1">Bank Code</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800 font-Urbanist">{bankDetails.bankCode}</p>
                <button
                  className="text-[#010794] hover:text-[#010794]/80"
                  onClick={() => copyToClipboard(bankDetails.bankCode, 'swiftCode')}
                >
                  {copied === 'swiftCode' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <Alert className="mt-6 bg-blue-50 border-blue-200">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
              <AlertDescription className="text-xs text-blue-600 ml-2 font-Urbanist">
                After making the payment, please upload your payment receipt below for verification.
              </AlertDescription>
            </div>
          </Alert>
        </div>
      </div>
    </div>
  );
};

const RegistrationForm = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<FormDataType>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const [generalError, setGeneralError] = useState<string>("");
  const [passwordHint, setPasswordHint] = useState<string>("");
  const [passwordMatchStatus, setPasswordMatchStatus] = useState<string>("");
  const [savedEmailSent, setSavedEmailSent] = useState<boolean>(false);
  const [savedEmail, setSavedEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);
  const [selectedModeForHybrid, setSelectedModeForHybrid] = useState<'online' | 'offline'>();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<'online' | 'offline' | 'hybrid'>('hybrid');

  const [shouldShowPaymentStep, setShouldShowPaymentStep] = useState<boolean>(false);

  const visibleSteps = useMemo(() => {
    if (shouldShowPaymentStep) {
      return steps;
    } else {
      return steps.filter(step => step.title !== "Payment Details");
    }
  }, [shouldShowPaymentStep]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const selectedPlan = formData.plan as string;
    const isPaidPlan = selectedPlan === "half" || selectedPlan === "full";
    setShouldShowPaymentStep(isPaidPlan);

    if (currentStep > 1) {
      if (isPaidPlan) {
        return;
      } else {
        setCurrentStep(prev => Math.min(prev, visibleSteps.length - 1));
      }
    }
  }, [formData.plan, currentStep, visibleSteps.length]);

  useEffect(() => {
    const password = formData.password as string | undefined | null;
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  }, [formData.password]);

  useEffect(() => {
    return () => {
      Object.values(formData).forEach((value) => {
        if (value && typeof value === "object" && (value as FileData).preview) {
          URL.revokeObjectURL((value as FileData).preview);
        }
      });
    };
  }, [formData]);

  useEffect(() => {
    const announcement = document.getElementById("step-announcement");
    if (announcement) {
      announcement.textContent = `Step ${currentStep + 1} of ${visibleSteps.length}: ${visibleSteps[currentStep].title}`;
    }
  }, [currentStep, visibleSteps]);

  const calculateProgress = () => {
    const totalRequiredFields = visibleSteps.reduce(
      (count, step) =>
        count + step.fields.filter((field) => field.required).length,
      0
    );

    const completedRequiredFields = Object.keys(formData).filter(
      (fieldName) => {
        const field = visibleSteps
          .flatMap((step) => step.fields)
          .find((f) => f.name === fieldName);
        return (
          field &&
          field.required &&
          formData[fieldName] &&
          (!field.validation || !field.validation(formData[fieldName], formData))
        );
      }
    ).length;

    return Math.round((completedRequiredFields / totalRequiredFields) * 100);
  };

  const allFieldsValid = useMemo(() => {
    if (currentStep >= visibleSteps.length) return false;

    const currentFields = visibleSteps[currentStep].fields;
    return currentFields.every(
      (field) =>
        !field.required ||
        (formData[field.name] &&
          (!field.validation || !field.validation(formData[field.name], formData))
        ));
  }, [currentStep, formData, visibleSteps]);

  const validateStep = () => {
    if (currentStep >= visibleSteps.length) return false;

    const currentFields = visibleSteps[currentStep].fields;
    const newErrors: Record<string, string> = {};
    let isValid = true;

    currentFields.forEach((field) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
        isValid = false;
      } else if (field.validation && (formData[field.name] || field.required)) {
        const error = field.validation(formData[field.name], formData);
        if (error) {
          newErrors[field.name] = error;
          isValid = false;
        }
      }
    });

    // Add validation for hybrid course platform selection
    if (currentStep === 1 && formData.course) {
      const selectedCourse = courses.find(c => c._id === formData.course);
      if (selectedCourse?.deliveryMode === 'hybrid' && !selectedModeForHybrid) {
        newErrors['deliveryPreference'] = 'Please select your preferred platform for hybrid courses';
        isValid = false;
      }
    }

    setErrors({});
    setTimeout(() => {
      setErrors(newErrors);
    }, 10);

    if (!isValid) {
      setGeneralError("Please correct the highlighted errors");
      setTimeout(() => setGeneralError(""), 5000);
    }

    return isValid;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined as unknown as string }));
    }

    if (field === "password" && value) {
      const passwordField = steps[0].fields.find((f) => f.name === "password");
      if (passwordField?.validation) {
        const error = passwordField.validation(value, formData);
        setPasswordHint(error || "");
      }

      if (formData.confirmPassword) {
        setPasswordMatchStatus(
          value === formData.confirmPassword ? "Passwords match" : "Passwords don't match"
        );
      }
    }

    if (field === "confirmPassword" && value) {
      setPasswordMatchStatus(
        value === formData.password ? "Passwords match" : "Passwords don't match"
      );
    }
  };

  const handleFileChange = (field: string, value: FileData | null) => {
    setFormData((prev) => {
      const oldValue = prev[field] as FileData | undefined;
      // Revoke the old preview URL before updating
      if (oldValue?.preview) {
        URL.revokeObjectURL(oldValue.preview);
      }
      return { ...prev, [field]: value };
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined as unknown as string }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('fullname', formData.fullName as string);
      formDataToSend.append('role', 'user');
      formDataToSend.append('email', formData.email as string);
      formDataToSend.append('phone', formData.phone as string);
      formDataToSend.append('password', formData.password as string);
      formDataToSend.append('plan', formData.plan as string);
      formDataToSend.append('courseEnrolled', formData.course as string);

      // Add delivery preference for hybrid courses
      if (selectedModeForHybrid) {
        formDataToSend.append('platformPreference', selectedModeForHybrid);
      }

      const citizenshipFile = formData.citizenship as FileData | undefined;
      if (!citizenshipFile) {
        throw new Error("Citizenship document is required");
      }
      formDataToSend.append('citizenship', citizenshipFile.file);

      if (shouldShowPaymentStep) {
        const paymentReceiptFile = formData.paymentReceipt as FileData | undefined;
        if (!paymentReceiptFile) {
          throw new Error("Payment receipt is required for paid plans");
        }
        formDataToSend.append('paymentReceipt', paymentReceiptFile.file);
      }

      const data = await registerUser(formDataToSend);

      if (data.success) {
        setIsCompleted(true);
        localStorage.removeItem("registrationProgress");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      setGeneralError(error instanceof Error ? error.message : "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!validateStep()) return;

    if (currentStep < visibleSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getStepStatus = (index: number): "current" | "completed" | "upcoming" => {
    if (index === currentStep) return "current";
    if (index < currentStep) return "completed";
    return "upcoming";
  };

  const getStrengthColor = () => {
    if (passwordStrength < 50) return "bg-red-500";
    if (passwordStrength < 100) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStepDisplay = (index: number): string => {
    if (index === 0) return "Info";

    if (!shouldShowPaymentStep) {
      return index === 1 ? "Course" : "Docs";
    } else {
      if (index === 1) return "Course";
      if (index === 2) return "Plan";
      if (index === 3) return "Pay";
      return "Docs";
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl"
        >
          <div className={`${isDesktop ? "p-8 shadow-none border-0" : "p-8 shadow-lg border-0 rounded-3xl"}`}>
            <div className="flex flex-col items-center text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: 0.2,
                }}
                className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center"
              >
                <Check className="h-10 w-10 text-green-500" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800 font-Urbanist">
                Registration Complete!
              </h2>
              <p className="text-gray-600 max-w-xs font-Urbanist">
                Thank you for registering. We've sent a confirmation email with
                further instructions.
              </p>
              <Button
                onClick={() => router.push("/login")}
                className="mt-6 bg-[#010794] rounded-full px-8 py-6 hover:bg-[#010794]/90 h-auto font-Urbanist"
              >
                Login
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl"
        >
          <div className={`${isDesktop ? "p-6" : "p-4 sm:p-6 shadow-xl border-0 rounded-3xl"}`}>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-1.5 h-12 bg-[#010794] rounded-full"></div>
              <div>
                <h2 className="text-2xl font-bold text-[#010794] font-Urbanist">
                  Registration
                </h2>
                <p className="text-gray-500 text-sm font-Urbanist">
                  Complete in just a few steps
                </p>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="text-gray-500 font-Urbanist">
                  Overall Progress
                </span>
                <span className="text-[#010794] font-medium font-Urbanist">
                  {calculateProgress()}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#010794] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateProgress()}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            <div id="step-announcement" className="sr-only" aria-live="polite" aria-atomic="true"></div>

            <div className="space-y-6">
              <div className="flex justify-between mb-8 relative">
                {visibleSteps.map((step, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="z-10 flex flex-col items-center">
                          <div
                            className={`flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-300 
                            ${getStepStatus(index) === "current"
                                ? "bg-[#010794] text-white border-[#010794] ring-4 ring-[#010794]/20"
                                : getStepStatus(index) === "completed"
                                  ? "bg-green-500 text-white border-green-500"
                                  : "bg-white text-gray-400 border-gray-200"
                              }`}
                            aria-current={getStepStatus(index) === "current" ? "step" : undefined}
                          >
                            {getStepStatus(index) === "completed" ? (
                              <>
                                <Check className="h-4 w-4 sm:h-6 sm:w-6" />
                                <SROnly>Completed</SROnly>
                              </>
                            ) : (
                              <>
                                <span className="text-xs sm:text-sm font-medium">
                                  {index + 1}
                                </span>
                                <SROnly>{step.title}</SROnly>
                              </>
                            )}
                          </div>
                          <span
                            className={`text-[10px] sm:text-xs mt-1 font-medium font-Urbanist ${getStepStatus(index) === "current"
                              ? "text-[#010794]"
                              : getStepStatus(index) === "completed"
                                ? "text-green-500"
                                : "text-gray-400"
                              }`}
                          >
                            {getStepDisplay(index)}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-Urbanist">{step.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}

                <div className="absolute top-6 h-0.5 bg-gray-200 w-full -z-0" style={{ transform: "translateY(-50%)" }} />
                <div
                  className="absolute top-6 h-0.5 bg-green-500 -z-0 transition-all duration-300"
                  style={{
                    transform: "translateY(-50%)",
                    width: `${(currentStep / (visibleSteps.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {generalError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4"
                >
                  <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-sm font-Urbanist">
                      {generalError}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <div className="p-0">
                <motion.div
                  key={currentStep}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={animations.fadeInUp}
                >
                  <div className="mb-6">
                    <h3 className="text-xl font-medium text-[#010794] mb-1 font-Urbanist">
                      {visibleSteps[currentStep].title}
                    </h3>
                    <p className="text-gray-500 text-sm font-Urbanist">
                      {visibleSteps[currentStep].description}
                    </p>
                  </div>

                  {/* Step 1: Plan Selection */}
                  {visibleSteps[currentStep].title === "Choose Your Plan" ? (
                    <div className="space-y-4">
                      {(visibleSteps[currentStep].fields[0] as SelectField).options.map((option, idx) => (
                        <motion.div
                          key={option.value}
                          onClick={() => handleInputChange("plan", option.value)}
                          className={`p-4 border-2 rounded-xl relative transition-all cursor-pointer ${formData.plan === option.value
                            ? "border-[#010794] bg-[#010794]/5"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                          variants={animations.listItem}
                          initial="initial"
                          animate="animate"
                          custom={idx}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium font-Urbanist">
                                  {option.label}
                                </h4>
                                {option.badge && (
                                  <Badge className="bg-blue-500">
                                    {option.badge}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1 font-Urbanist">
                                {option.description}
                              </p>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.plan === option.value
                                ? "border-[#010794]"
                                : "border-gray-300"
                                }`}
                            >
                              {formData.plan === option.value && (
                                <div className="w-3 h-3 rounded-full bg-[#010794]" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {errors.plan && (
                        <p className="text-xs text-red-500 flex items-center mt-2 font-Urbanist" role="alert">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.plan}
                        </p>
                      )}
                    </div>
                  ) : visibleSteps[currentStep].title === "Course Selection" ? (
                    <div className="space-y-4">
                      {visibleSteps[currentStep].fields.map((field, idx) => (
                        <motion.div
                          key={field.name}
                          variants={animations.listItem}
                          initial="initial"
                          animate="animate"
                          custom={idx}
                        >
                          <div className="flex justify-between">
                            <Label htmlFor={field.name} className="mb-1.5 text-sm font-medium text-gray-700">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            {errors[field.name] && (
                              <span className="text-xs text-red-500 flex items-center" id={`${field.name}-error`} role="alert">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {errors[field.name]}
                              </span>
                            )}
                          </div>
                          <CourseSelectionField
                            field={field as SelectField}
                            selectedModeForHybrid={selectedModeForHybrid}
                            setSelectedModeForHybrid={setSelectedModeForHybrid}
                            error={errors[field.name]}
                            courses={courses}
                            setCourses={setCourses}
                            value={formData[field.name] as string | null}
                            onCourseChange={handleInputChange}
                            deliveryMode={deliveryMode}
                            setDeliveryMode={setDeliveryMode}
                          />
                        </motion.div>
                      ))}
                    </div>
                  ) : visibleSteps[currentStep].title === "Payment Details" ? (
                    <div className="space-y-6">
                      <PaymentInformation formData={formData} courses={courses} />

                      <div className="space-y-5">
                        {visibleSteps[currentStep].fields.map((field, idx) => (
                          <motion.div
                            key={field.name}
                            variants={animations.listItem}
                            initial="initial"
                            animate="animate"
                            custom={idx}
                          >
                            <div className="flex justify-between mb-1.5">
                              <Label htmlFor={field.name} className="text-sm font-medium text-gray-700 font-Urbanist">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                              </Label>
                            </div>

                            <FileUploadField
                              field={field as InputField}
                              error={errors[field.name]}
                              value={formData[field.name] as FileData | null}
                              onFileChange={handleFileChange}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : visibleSteps[currentStep].title === "Citizenship Verification" ? (
                    <div className="space-y-5">
                      {visibleSteps[currentStep].fields.map((field, idx) => (
                        <motion.div
                          key={field.name}
                          variants={animations.listItem}
                          initial="initial"
                          animate="animate"
                          custom={idx}
                        >
                          <div className="flex justify-between mb-1.5">
                            <Label htmlFor={field.name} className="text-sm font-medium text-gray-700 font-Urbanist">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                          </div>

                          <FileUploadField
                            field={field as InputField}
                            error={errors[field.name]}
                            value={formData[field.name] as FileData | null}
                            onFileChange={handleFileChange}
                          />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {visibleSteps[currentStep].fields.map((field, idx) => (
                        <motion.div
                          key={field.name}
                          variants={animations.listItem}
                          initial="initial"
                          animate="animate"
                          custom={idx}
                        >
                          <div className="flex justify-between">
                            <Label htmlFor={field.name} className="mb-1.5 text-sm font-medium text-gray-700 font-Urbanist">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            {errors[field.name] && (
                              <span className="text-xs text-red-500 flex items-center font-Urbanist" id={`${field.name}-error`} role="alert">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {errors[field.name]}
                              </span>
                            )}
                          </div>

                          {field.type === "password" ? (
                            <div className="relative">
                              <div className="absolute left-3 -top-1 h-12 flex items-center pointer-events-none z-10">
                                {field.icon}
                              </div>
                              <Input
                                id={field.name}
                                type={
                                  field.name === "password"
                                    ? showPassword
                                      ? "text"
                                      : "password"
                                    : showConfirmPassword
                                      ? "text"
                                      : "password"
                                }
                                className={`pl-10 pr-10 font-Urbanist ${errors[field.name] ? "border-red-300 bg-red-50" : ""
                                  }`}
                                placeholder={field.placeholder}
                                value={(formData[field.name] as string) || ""}
                                onChange={(e) =>
                                  handleInputChange(field.name, e.target.value)
                                }
                                aria-invalid={!!errors[field.name]}
                                aria-describedby={
                                  errors[field.name] ? `${field.name}-error` : undefined
                                }
                              />
                              

                              {field.name === "password" && formData.password && (
                                <div className="mt-2">
                                  <div className="flex justify-between mb-1">
                                    <span className="text-xs text-gray-500 font-Urbanist">
                                      Password Strength
                                    </span>
                                    <span className="text-xs text-gray-500 font-Urbanist">
                                      {passwordStrength < 50
                                        ? "Weak"
                                        : passwordStrength < 100
                                          ? "Good"
                                          : "Strong"}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full ${getStrengthColor()}`}
                                      style={{ width: `${passwordStrength}%` }}
                                    />
                                  </div>
                                  {passwordHint && (
                                    <p className="text-xs text-red-500 mt-1 font-Urbanist">
                                      {passwordHint}
                                    </p>
                                  )}
                                </div>
                              )}

                              {field.name === "confirmPassword" &&
                                formData.confirmPassword && (
                                  <p
                                    className={`text-xs mt-1 font-Urbanist ${passwordMatchStatus === "Passwords match"
                                      ? "text-green-500"
                                      : "text-red-500"
                                      }`}
                                  >
                                    {passwordMatchStatus}
                                  </p>
                                )}
                            </div>
                          ) : field.type === "select" ? (
                            <Select
                              onValueChange={(value) =>
                                handleInputChange(field.name, value)
                              }
                              value={(formData[field.name] as string) || ""}
                            >
                              <SelectTrigger
                                className={`pl-10 ${errors[field.name] ? "border-red-300 bg-red-50" : ""
                                  }`}
                              >
                                <div className="absolute left-3 -top-1 h-10 flex items-center pointer-events-none z-10">
                                  {field.icon}
                                </div>
                                <SelectValue
                                  placeholder={field.placeholder || "Select an option"}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {(field as SelectField).options.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span>{option.label}</span>
                                      {option.badge && (
                                        <Badge variant="secondary">
                                          {option.badge}
                                        </Badge>
                                      )}
                                    </div>
                                    {option.description && (
                                      <p className="text-xs text-gray-500 mt-1 font-Urbanist">
                                        {option.description}
                                      </p>
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="relative">
                              <div className="absolute left-3 -top-1 h-12 flex items-center pointer-events-none z-10">
                                {field.icon}
                              </div>
                              <Input
                                id={field.name}
                                type={field.type}
                                className={`pl-10 font-Urbanist ${errors[field.name] ? "border-red-300 bg-red-50" : ""
                                  }`}
                                placeholder={field.placeholder}
                                value={(formData[field.name] as string) || ""}
                                onChange={(e) =>
                                  handleInputChange(field.name, e.target.value)
                                }
                                aria-invalid={!!errors[field.name]}
                                aria-describedby={
                                  errors[field.name] ? `${field.name}-error` : undefined
                                }
                              />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                </motion.div>
              </div>

              <div className="flex justify-between pt-4">
                <div className="flex space-x-3">
                  {currentStep > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                      className="rounded-full w-26 px-6 py-3 h-auto font-Urbanist"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!allFieldsValid || isLoading}
                  className={`rounded-full bg-[#010794] w-26 px-6 py-3 h-auto font-Urbanist ${isLoading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                >
                  {isLoading ? (
                    "Processing..."
                  ) : currentStep === visibleSteps.length - 1 ? (
                    "Submit"
                  ) : (
                    <>
                      Next <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </>
  );
};

export default RegistrationForm;