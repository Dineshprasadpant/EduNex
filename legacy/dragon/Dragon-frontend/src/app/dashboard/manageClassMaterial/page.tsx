"use client";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getClassMaterials,
  getBatches,
  updateClassMaterial,
  deleteClassMaterial,
  handleApiError,
} from "../../../../apiCalls/manageClassMaterial";
import { deleteUploadedFile, uploadFile } from "../../../../apiCalls/fileUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  X, Edit, Trash2, ChevronLeft, ChevronRight, FileText, Link as LinkIcon,
  AlertTriangle, Upload, Loader, File, CheckCircle, Info, Download, Eye, Check
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

// Define interfaces to avoid TypeScript errors
interface Batch {
  _id: string;
  batch_name: string;
  [key: string]: any;
}

// Interface for Material when fetching from API
interface MaterialWithBatchObjects {
  _id: string;
  material_id: string;
  title: string;
  description: string;
  file_url: string;
  batches: Batch[];
  [key: string]: any;
}

// Interface for Material when editing (batches as string IDs)
interface MaterialWithBatchIds {
  _id: string;
  material_id: string;
  title: string;
  description: string;
  file_url: string;
  batches: string[];
  [key: string]: any;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface FileUploadInputProps {
  id: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  accept?: string;
}

// API response types
interface ClassMaterialsResponse {
  materials: MaterialWithBatchObjects[];
  meta: PaginationMeta;
}

interface BatchesResponse {
  data: Batch[];
  meta?: {
    page: number;
    totalPages: number;
  };
}

interface UploadFileResponse {
  success: boolean;
  data: {
    url: string;
  };
  message?: string;
}

// Main component
export default function ManageClassMaterials() {
  const [materials, setMaterials] = useState<MaterialWithBatchObjects[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Batch pagination state
  const [batchPage, setBatchPage] = useState(1);
  const [batchTotalPages, setBatchTotalPages] = useState(1);
  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentMaterial, setCurrentMaterial] = useState<MaterialWithBatchIds | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // File upload states
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [fileChanged, setFileChanged] = useState<boolean>(false);
  const [fileMode, setFileMode] = useState<"view" | "edit" | "add">("view");

  // Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      setIsLoading(true);
      try {
        const materialsRes = await getClassMaterials(pagination.page, pagination.limit) as ClassMaterialsResponse;
        setMaterials(materialsRes.materials);
        setPagination({
          page: materialsRes.meta.page,
          limit: materialsRes.meta.limit,
          total: materialsRes.meta.total,
          totalPages: materialsRes.meta.totalPages,
          hasNextPage: materialsRes.meta.hasNextPage,
          hasPreviousPage: materialsRes.meta.hasPreviousPage,
        });
      } catch (error) {
        handleApiError(error, "Failed to load materials");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, [pagination.page]);

  // Fetch batches for dropdown
  const fetchBatches = async (page: number = 1) => {
    setIsLoadingBatches(true);
    try {
      const result = await getBatches(page) as BatchesResponse;
      if (result.data) {
        setBatches(result.data);
        setBatchTotalPages(result.meta?.totalPages || 1);
        setBatchPage(page);
      }
    } catch (error) {
      toast.error("Failed to load batches");
      console.error(error);
    } finally {
      setIsLoadingBatches(false);
    }
  };

  // Handle material pagination
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Extract filename from URL for display
  const getFileNameFromUrl = (url: string): string => {
    if (!url) return "";
    try {
      const path = new URL(url).pathname;
      const filename = path.split('/').pop();
      // URL decode the filename in case it contains special characters
      return decodeURIComponent(filename || "");
    } catch (e) {
      return url.split('/').pop() || "Unknown file";
    }
  };

  // Check if a file can be previewed in browser
  const canPreviewFile = (url: string): boolean => {
    if (!url) return false;

    const extension = url.split('.').pop()?.toLowerCase();
    // Most browsers can preview these file types
    const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg'];

    return previewableTypes.includes(extension || "");
  };

  // Open file preview
  const openPreview = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  // Open edit modal
  const handleEdit = (material: MaterialWithBatchObjects) => {
    // Convert material.batches from Batch[] to string[] of batch IDs
    const batchIds = material.batches.map(b => b._id);

    setCurrentMaterial({
      ...material,
      batches: batchIds
    });

    // Handle file information
    if (material.file_url) {
      const filename = getFileNameFromUrl(material.file_url);
      setUploadedFileName(filename);
      setFileMode("view"); // Initially show the existing file
    } else {
      setUploadedFileName("");
      setFileMode("add"); // No file exists, so go to add mode
    }

    setFileChanged(false);
    setIsEditing(true);
    setIsModalOpen(true);

    // Fetch batches for the dropdown when the edit modal opens
    fetchBatches(1);
  };

  // Open delete confirmation
  const handleDelete = (material: MaterialWithBatchObjects) => {
    // Convert material.batches from Batch[] to string[] of batch IDs
    const batchIds = material.batches.map(b => b._id);

    setCurrentMaterial({
      ...material,
      batches: batchIds
    });
    setIsDeleting(true);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setIsDeleting(false);
    setCurrentMaterial(null);
    setUploadedFileName("");
    setFileMode("view");
    setFileChanged(false);
    setIsBatchDropdownOpen(false);
  };

  // Close preview
  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewUrl("");
  };

  // Update form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (currentMaterial) {
      setCurrentMaterial(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  // Toggle batch selection
  const toggleBatchSelection = (batchId: string) => {
    if (!currentMaterial) return;

    setCurrentMaterial(prev => {
      if (!prev) return null;

      const batches = prev.batches.includes(batchId)
        ? prev.batches.filter(id => id !== batchId)
        : [...prev.batches, batchId];

      return { ...prev, batches };
    });
  };

  const handleReplaceFile = async () => {
    if (!currentMaterial?.file_url) {
      setFileMode("edit");
      return;
    }

    try {
      setIsLoading(true);
      await deleteUploadedFile(currentMaterial.file_url);

      // Clear the current file
      setCurrentMaterial(prev => prev ? { ...prev, file_url: "" } : null);
      setUploadedFileName("");
      setFileMode("edit");
      setFileChanged(true);

      toast.success("Previous file removed. You can now upload a new file.");
    } catch (error) {
      console.error("Error replacing file:", error);
      toast.error("Failed to remove previous file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // File upload input component
  const FileUploadInput: React.FC<FileUploadInputProps> = ({
    id,
    onChange,
    isUploading,
    accept = '*/*'
  }) => (
    <div className="w-full">
      {isUploading ? (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 sm:p-4 flex items-center justify-center h-24 sm:h-32">
          <div className="flex flex-col items-center gap-2 text-blue-700">
            <Loader className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
            <span className="text-sm sm:text-base font-medium">Uploading file...</span>
          </div>
        </div>
      ) : (
        <Label htmlFor={id} className="cursor-pointer block w-full">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-6 hover:border-gray-400 transition-colors flex flex-col items-center justify-center h-24 sm:h-32">
            <div className="flex flex-col items-center gap-1 sm:gap-2 text-gray-700 mb-1 sm:mb-2">
              <div className="bg-gray-100 h-8 w-8 sm:h-12 sm:w-12 rounded-full flex items-center justify-center">
                <Upload className="h-4 w-4 sm:h-6 sm:w-6 text-gray-600" />
              </div>
              <span className="font-medium text-center text-xs sm:text-sm">Click to upload new file</span>
              <p className="text-xs text-gray-500 text-center mt-0.5 sm:mt-1 max-w-xs">
                Upload a PDF, Word, PowerPoint or other file (Max: 10MB)
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

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    const maxSize = 100 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size exceeds 100MB limit");
      return;
    }

    try {
      setUploadingFile(true);

      // Upload the new file
      const result = await uploadFile(file) as UploadFileResponse;

      if (result.success) {
        // Set the new file URL
        if (currentMaterial) {
          setCurrentMaterial(prev => prev ? {
            ...prev,
            file_url: result.data.url
          } : null);
        }

        setUploadedFileName(file.name);
        setFileChanged(true);
        setFileMode("view"); // Switch back to view mode after upload
        toast.success("File replaced successfully!");
      } else {
        toast.error(result.message || "Failed to upload file");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setUploadingFile(false);
      if (e.target) {
        e.target.value = ''; // Reset the file input
      }
    }
  };

  // Submit updated material
  const handleUpdate = async () => {
    if (!currentMaterial) return;

    if (!currentMaterial.file_url) {
      toast.error("Please upload a file or provide a URL");
      return;
    }

    try {
      setIsLoading(true);
      let updatedMaterial = await updateClassMaterial(currentMaterial._id, {
        material_id: currentMaterial.material_id,
        title: currentMaterial.title,
        description: currentMaterial.description,
        file_url: currentMaterial.file_url,
        batches: currentMaterial.batches,
      }) as MaterialWithBatchObjects;

      updatedMaterial._id = updatedMaterial.id
      setMaterials(materials.map(m =>
        m._id === updatedMaterial._id ? updatedMaterial : m
      ));

      toast.success("Material updated successfully");
      closeModal();
    } catch (error) {
      handleApiError(error, "Failed to update material");
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm deletion
  const confirmDelete = async () => {
    if (!currentMaterial) return;

    try {
      setIsLoading(true);
      await deleteClassMaterial(currentMaterial._id);
      setMaterials(materials.filter(m => m._id !== currentMaterial._id));
      toast.success("Material deleted successfully");
      closeModal();
    } catch (error) {
      handleApiError(error, "Failed to delete material");
    } finally {
      setIsLoading(false);
    }
  };

  // Determine file extension for icon
  const getFileIcon = (filename: string) => {
    if (!filename) return <File className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />;

    const extension = filename.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'pdf':
        return <File className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />;
      case 'doc':
      case 'docx':
        return <File className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <File className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <File className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />;
      default:
        return <File className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />;
    }
  };

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 mx-auto py-10">
      <Toaster position="top-right" />

      <div className="mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2 font-Urbanist">Manage Learning Materials</h1>
        <p className="text-sm sm:text-base text-gray-600 font-Urbanist">
          View, edit, and delete learning materials assigned to different batches
        </p>
      </div>

      {/* Materials Table */}
      <Card className="border border-gray-200 shadow-sm overflow-hidden">
        {isLoading && materials.length === 0 ? (
          <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 sm:h-12 w-full" />
            ))}
          </CardContent>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-Urbanist text-xs sm:text-sm">Material ID</TableHead>
                    <TableHead className="font-Urbanist text-xs sm:text-sm">Title</TableHead>
                    <TableHead className="font-Urbanist text-xs sm:text-sm">Description</TableHead>
                    <TableHead className="font-Urbanist text-xs sm:text-sm">Assigned Batches</TableHead>
                    <TableHead className="font-Urbanist text-xs sm:text-sm text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.length > 0 ? (
                    materials.map((material) => (
                      <TableRow key={material._id} className="hover:bg-gray-50">
                        <TableCell className="font-medium font-Urbanist text-xs sm:text-sm py-2 sm:py-4">
                          {material.material_id}
                        </TableCell>
                        <TableCell className="font-Urbanist text-xs sm:text-sm py-2 sm:py-4">
                          <div className="flex items-center gap-2">
                            {material.file_url ? (
                              <div className="flex flex-col">
                                <span>{material.title}</span>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {canPreviewFile(material.file_url) && (
                                    <button
                                      onClick={() => openPreview(material.file_url)}
                                      className="text-xs text-blue-600 hover:underline flex items-center"
                                      type="button"
                                    >
                                      <Eye size={10} className="mr-1" />
                                      Preview
                                    </button>
                                  )}
                                  <a
                                    href={material.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline flex items-center"
                                  >
                                    <Download size={10} className="mr-1" />
                                    <span className="truncate max-w-[100px] sm:max-w-[200px]">
                                      {getFileNameFromUrl(material.file_url)}
                                    </span>
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <span>{material.title}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="truncate max-w-[100px] sm:max-w-xs font-Urbanist text-xs sm:text-sm py-2 sm:py-4">
                          {material.description}
                        </TableCell>
                        <TableCell className="py-2 sm:py-4">
                          <div className="flex flex-wrap gap-1">
                            {material.batches.map((batch) => (
                              <Badge key={batch._id} variant="outline" className="font-Urbanist bg-gray-100 text-xs px-1.5 py-0.5">
                                {batch.batch_name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-2 sm:py-4">
                          <div className="flex justify-end space-x-1 sm:space-x-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(material)}
                              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                              type="button"
                            >
                              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(material)}
                              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                              type="button"
                            >
                              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : null
                  }
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {materials.length > 0 && (
              <div className="flex items-center justify-between p-3 sm:p-4 border-t border-gray-200">
                <div className="text-xs sm:text-sm text-gray-500 font-Urbanist">
                  Showing page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPreviousPage || isLoading}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-md"
                    type="button"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="sr-only">Previous page</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNextPage || isLoading}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-md"
                    type="button"
                  >
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="sr-only">Next page</span>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* File Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={closePreview}>
        <DialogContent className="w-[95vw] max-w-4xl sm:max-w-5xl max-h-[90vh] p-0 sm:p-6">
          <DialogHeader className="p-4 sm:p-0">
            <DialogTitle className="text-base sm:text-xl font-Urbanist flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="truncate max-w-[200px] sm:max-w-md">File Preview: {getFileNameFromUrl(previewUrl)}</span>
              <div className="flex items-center gap-2 mr-4 mt-4">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs sm:text-sm text-blue-600 hover:underline flex items-center"
                >
                  <Download size={12} className="mr-1" /> Download
                </a>

              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="w-full h-[50vh] sm:h-[70vh] overflow-hidden bg-gray-100 rounded-md border border-gray-200 m-4 sm:m-0">
            {previewUrl && (
              <>
                {previewUrl.toLowerCase().endsWith('.pdf') ? (
                  <object
                    data={previewUrl}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                    className="w-full h-full"
                  >
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                      <p className="text-gray-500 mb-4 text-sm sm:text-base">Unable to display PDF directly.</p>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded text-xs sm:text-sm hover:bg-blue-700"
                      >
                        Open PDF in new tab
                      </a>
                    </div>
                  </object>
                ) : previewUrl.match(/\.(jpe?g|png|gif|svg)$/i) ? (
                  <div className="flex items-center justify-center h-full p-4">
                    <img
                      src={previewUrl}
                      alt="File preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <File className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-3 sm:mb-4" />
                    <p className="text-gray-700 mb-2 text-sm sm:text-base">Preview not available for this file type</p>
                    <p className="text-gray-500 mb-4 text-xs sm:text-sm">You can download the file to view it.</p>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded text-xs sm:text-sm hover:bg-blue-700"
                    >
                      Download File
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isModalOpen && isEditing} onOpenChange={closeModal}>
        <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl md:max-w-2xl p-4 sm:p-6">
          {currentMaterial && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl font-Urbanist">Edit Learning Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4 py-2 sm:py-4 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="material_id" className="font-Urbanist text-sm">Material ID</Label>
                    <Input
                      id="material_id"
                      name="material_id"
                      value={currentMaterial.material_id}
                      onChange={handleChange}
                      placeholder="Unique identifier"
                      className="font-Urbanist text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title" className="font-Urbanist text-sm">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      value={currentMaterial.title}
                      onChange={handleChange}
                      placeholder="Material title"
                      className="font-Urbanist text-sm mt-1"
                    />
                  </div>
                </div>

                <Separator className="my-1 sm:my-2" />

                <div>
                  <Label htmlFor="description" className="font-Urbanist text-sm">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={currentMaterial.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Description of what this material covers"
                    className="font-Urbanist text-sm mt-1 resize-none"
                  />
                </div>

                <Separator className="my-1 sm:my-2" />

                {/* File Upload/View Section */}
                <div>
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <Label className="font-Urbanist text-sm">Material File</Label>
                   
                  </div>

                
{fileMode === "view" && currentMaterial.file_url && (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
    <div className="flex items-center">
      <div className="bg-gray-100 p-1.5 sm:p-2 rounded-full mr-2 sm:mr-3">
        {getFileIcon(uploadedFileName)}
      </div>
      <div className="flex-grow min-w-0">
        <p className="text-xs sm:text-sm font-medium text-gray-800 mb-0.5 truncate">{uploadedFileName}</p>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          {canPreviewFile(currentMaterial.file_url) && (
            <button
              onClick={() => openPreview(currentMaterial.file_url)}
              className="text-xs inline-flex items-center text-blue-600 hover:underline"
              type="button"
            >
              <Eye size={10} className="mr-1" /> Preview
            </button>
          )}
          <a
            href={currentMaterial.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs inline-flex items-center text-blue-600 hover:underline"
          >
            <Download size={10} className="mr-1" /> Download
          </a>
          {fileChanged && (
            <span className="text-xs inline-flex items-center text-green-600">
              <CheckCircle size={10} className="mr-1" /> Updated
            </span>
          )}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleReplaceFile}
        className="text-xs h-7 px-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader className="h-3 w-3 mr-1 animate-spin" />
        ) : (
          <Edit className="h-3 w-3 mr-1" />
        )}
        Replace File
      </Button>
    </div>
  </div>
)}
                  {/* Edit file section */}
                  {fileMode === "edit" && (
                    <>
                      {/* Show file upload component */}
                      <FileUploadInput
                        id="material-file-upload"
                        onChange={handleFileUpload}
                        isUploading={uploadingFile}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt"
                      />

                      {/* Option to go back to view mode */}
                      {currentMaterial.file_url && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFileMode("view")}
                          className="mt-2 text-xs h-7"
                        >
                          Cancel replacement</Button>
                      )}
                    </>
                  )}

                  {/* Add file section (no file exists) */}
                  {fileMode === "add" && (
                    <>
                      <div className="bg-amber-50 p-2 sm:p-3 border border-amber-100 rounded-md mb-3 sm:mb-4">
                        <div className="flex">
                          <Info className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 mr-1.5 sm:mr-2 flex-shrink-0 mt-0.5" />
                          <p className="text-xs sm:text-sm text-amber-700">
                            No file is currently associated with this material. Please upload a file or provide a URL.
                          </p>
                        </div>
                      </div>

                      {/* File upload option */}
                      <FileUploadInput
                        id="material-file-upload"
                        onChange={handleFileUpload}
                        isUploading={uploadingFile}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt"
                      />

                      {/* OR divider */}
                      <div className="flex items-center my-3 sm:my-4">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="mx-3 sm:mx-4 text-gray-500 text-xs sm:text-sm">OR</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                      </div>

                      {/* URL Input Option */}
                      <div>
                        <Label htmlFor="file_url" className="font-Urbanist text-sm mb-1 sm:mb-2 block">Provide a URL</Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <LinkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                          </div>
                          <Input
                            id="file_url"
                            name="file_url"
                            type="url"
                            value={currentMaterial.file_url}
                            onChange={handleChange}
                            placeholder="https://example.com/materials/file.pdf"
                            className="pl-10 font-Urbanist text-sm"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Separator className="my-1 sm:my-2" />

                {/* Enhanced Batch Assignment with Backend Pagination */}
                <div className="space-y-2 sm:space-y-4">
                  <Label className="font-Urbanist text-sm">Assign to Batches</Label>

                  {/* Batch selection dropdown with pagination */}
                  <div className="relative">
                    <button
                      type="button"
                      className="flex items-center justify-between w-full p-2 border rounded-md bg-white text-xs sm:text-sm"
                      onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
                    >
                      <span className="font-Urbanist">
                        {currentMaterial.batches.length > 0
                          ? `${currentMaterial.batches.length} batches selected`
                          : "Select batches"}
                      </span>
                      <ChevronRight className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-200 ${isBatchDropdownOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {isBatchDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full max-h-40 sm:max-h-60 overflow-auto border rounded-md bg-white shadow-lg">
                        {isLoadingBatches ? (
                          <div className="flex items-center justify-center p-3 sm:p-4">
                            <div className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-2 border-gray-500 rounded-full border-t-transparent"></div>
                            <span className="ml-2 text-xs sm:text-sm text-gray-500 font-Urbanist">Loading batches...</span>
                          </div>
                        ) : (
                          <div className="p-1 sm:p-2 space-y-0.5 sm:space-y-1">
                            {batches.map(batch => (
                              <div
                                key={batch._id}
                                className="flex items-center p-1.5 sm:p-2 hover:bg-gray-50 rounded-md transition-colors group"
                              >
                                <Checkbox
                                  id={`batch-${batch._id}`}
                                  checked={currentMaterial.batches.includes(batch._id)}
                                  onCheckedChange={() => toggleBatchSelection(batch._id)}
                                  className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <label
                                  htmlFor={`batch-${batch._id}`}
                                  className="flex-grow text-xs sm:text-sm cursor-pointer font-Urbanist"
                                >
                                  {batch.batch_name}
                                </label>
                                {currentMaterial.batches.includes(batch._id) && (
                                  <span className="text-xs text-blue-600 bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded group-hover:bg-blue-100">
                                    Selected
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Enhanced pagination controls */}
                        <div className="border-t py-1.5 sm:py-2 px-2 sm:px-3 bg-gray-50 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => fetchBatches(batchPage - 1)}
                            disabled={batchPage === 1 || isLoadingBatches}
                            className={`inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-md shadow-sm transition-colors
                              ${batchPage === 1 || isLoadingBatches
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                          >
                            <ChevronLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" />
                            Prev
                          </button>

                          <span className="text-xs text-gray-500 font-Urbanist">
                            Page {batchPage} of {batchTotalPages}
                          </span>

                          <button
                            type="button"
                            onClick={() => fetchBatches(batchPage + 1)}
                            disabled={batchPage >= batchTotalPages || isLoadingBatches}
                            className={`inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-md shadow-sm transition-colors
                              ${batchPage >= batchTotalPages || isLoadingBatches
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
                          >
                            Next
                            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-0.5 sm:ml-1" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected batches display */}
                  <div className="mt-2 sm:mt-3">
                    <div className="text-xs text-gray-500 font-Urbanist mb-1">Selected batches:</div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 p-2 sm:p-3 bg-gray-50 rounded-md min-h-10 sm:min-h-12 border border-gray-200">
                      {currentMaterial.batches.length > 0 ? (
                        currentMaterial.batches.map(batchId => {
                          const batchName = batches.find(b => b._id === batchId)?.batch_name ||
                            "Unknown Batch";
                          return (
                            <Badge
                              key={batchId}
                              variant="outline"
                              className="pl-2 sm:pl-3 py-0.5 sm:py-1 pr-0.5 sm:pr-1 bg-blue-50 text-blue-700 border-blue-100 text-xs"
                            >
                              {batchName}
                              <button
                                type="button"
                                onClick={() => toggleBatchSelection(batchId)}
                                className="ml-0.5 sm:ml-1 rounded-full p-0.5 sm:p-1 hover:bg-blue-100"
                              >
                                <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                <span className="sr-only">Remove {batchName}</span>
                              </button>
                            </Badge>
                          );
                        })
                      ) : (
                        <div className="text-xs sm:text-sm text-gray-500 w-full text-center font-Urbanist py-1">
                          No batches selected
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="font-Urbanist w-full sm:w-auto text-xs sm:text-sm"
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={isLoading || uploadingFile}
                  className="bg-gray-800 hover:bg-gray-700 font-Urbanist w-full sm:w-auto text-xs sm:text-sm"
                  type="button"
                >
                  {isLoading ? "Updating..." : "Update Material"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isModalOpen && isDeleting} onOpenChange={closeModal}>
        <DialogContent className="w-[95vw] max-w-md p-4 sm:p-6">
          {currentMaterial && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl font-Urbanist flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  Confirm Deletion
                </DialogTitle>
              </DialogHeader>
              <div className="py-2 sm:py-4">
                <div className="p-3 sm:p-4 border border-red-100 bg-red-50 rounded-md mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-gray-700 font-Urbanist">
                    Are you sure you want to delete the material <strong>{currentMaterial.title}</strong>?
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700 mt-1.5 sm:mt-2 font-Urbanist">
                    This action cannot be undone and will remove access for all assigned batches.
                  </p>
                </div>

                <div className="bg-gray-50 p-2 sm:p-3 rounded-md">
                  <div className="text-xs text-gray-500 font-Urbanist mb-1">Material details:</div>
                  <div className="text-xs sm:text-sm font-medium font-Urbanist">{currentMaterial.material_id} - {currentMaterial.title}</div>
                  <div className="text-xs text-gray-500 font-Urbanist mt-1">
                    Assigned to {currentMaterial.batches.length} {currentMaterial.batches.length === 1 ? 'batch' : 'batches'}
                  </div>
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={closeModal}
                  className="font-Urbanist w-full sm:w-auto text-xs sm:text-sm"
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={isLoading}
                  className="font-Urbanist w-full sm:w-auto text-xs sm:text-sm"
                  type="button"
                >
                  {isLoading ? "Deleting..." : "Delete Material"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}