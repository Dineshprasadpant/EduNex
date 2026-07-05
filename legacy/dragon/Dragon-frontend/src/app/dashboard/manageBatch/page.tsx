// src/components/BatchManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { toast, Toaster } from 'react-hot-toast';
import { fetchBatches, createBatch, updateBatch, deleteBatch, fetchCoursesSummary } from '../../../../apiCalls/manageBatch';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, ChevronLeft, ChevronRight, Loader2, Plus, Calendar, Edit, Trash2, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface Batch {
  _id: string;
  batch_name: string;
  course?: {
    _id: string;
    title: string;
  };
}

interface Course {
  _id: string;
  title: string;
  studentsEnrolled: number;
  teachersCount: number;
  overallRating: number;
  overallHours: number;
  moduleLeader: string;
  category: string;
  price: number;
}

interface CoursePagination {
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalPages: number;
  page: number;
}

export default function BatchManager() {
  // State for batches and pagination
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchPagination, setBatchPagination] = useState<{
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }>({
    page: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('manage');

  // State for courses dropdown
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesPagination, setCoursesPagination] = useState<CoursePagination>({
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
    totalPages: 1,
    page: 1
  });
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Form handling
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Fetch batches and courses on mount
  useEffect(() => {
    loadBatches();
    loadCourses();
  }, []);

  // Load batches with pagination
  const loadBatches = async (page: number = 1) => {
    try {
      setLoading(true);
      const { batches: fetchedBatches, pagination } = await fetchBatches(page);
      setBatches(fetchedBatches);
      setBatchPagination(pagination);
    } catch (error) {
      console.error('Error loading batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  // Load courses with pagination
  const loadCourses = async (page: number = 1) => {
    try {
      setCoursesLoading(true);
      const { courses: fetchedCourses, pagination } = await fetchCoursesSummary(page);
      // Keep existing courses if loading more pages
      if (page > 1 && dropdownOpen) {
        setCourses(prev => [...prev, ...fetchedCourses]);
      } else {
        setCourses(fetchedCourses);
      }
      setCoursesPagination(pagination);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setCoursesLoading(false);
    }
  };

  // Form submission handler
  const onSubmit = async (data: any) => {
    try {
      await createBatch({
        batch_name: data.batch_name,
        course: data.course
      });
      toast.success('Batch created successfully');
      reset();
      setSelectedCourse('');
      loadBatches();
    } catch (error) {
      console.error('Error creating batch:', error);
      toast.error('Failed to create batch');
    }
  };

  // Update batch handler
  const handleUpdate = async (batchId: string) => {
    try {
      if (!editName.trim()) {
        toast.error('Batch name cannot be empty');
        return;
      }
      await updateBatch(batchId, editName);
      setEditingId(null);
      loadBatches();
      toast.success('Batch updated successfully');
    } catch (error) {
      console.error('Error updating batch:', error);
      toast.error('Failed to update batch');
    }
  };

  // Delete batch handler
  const handleDelete = async (batchId: string) => {
    try {
      await deleteBatch(batchId);
      loadBatches();
      setDeleteId(null);
      toast.success('Batch deleted successfully');
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast.error('Failed to delete batch');
    }
  };

  // Handle dropdown open/close
  const handleDropdownOpen = (open: boolean) => {
    setDropdownOpen(open);
    // Reset pagination when opening dropdown
    if (open && coursesPagination.page === 1) {
      loadCourses(1);
    }
  };

  // Filter batches by search term
  const filteredBatches = batches;

  return (
    <div className="max-w-screen-xl mx-auto py-4 min-h-screen font-Urbanist px-4 md:px-6">
      <div className="mb-6 flex justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 inline-flex">
          <button
            className={`px-6 py-3 rounded-l-lg text-sm font-medium flex items-center gap-2 transition-all
              ${activeTab === 'create'
                ? 'bg-[#082c34] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('create')}
          >
            <Plus size={16} />
            <span>Create Batch</span>
          </button>
          <button
            className={`px-6 py-3 rounded-r-lg text-sm font-medium flex items-center gap-2 transition-all
              ${activeTab === 'manage'
                ? 'bg-[#082c34] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('manage')}
          >
            <BookOpen size={16} />
            <span>Manage Batches</span>
          </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="border-b bg-white pb-4">
            <div className="flex flex-col space-y-1">
              <CardTitle className="text-lg text-[#082c34]">Create New Batch</CardTitle>
              <CardDescription className="text-gray-500">Add a new batch to a specific course</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6 bg-white">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="batch_name" className="text-sm font-medium text-gray-700">Batch Name</Label>
                  <Input
                    id="batch_name"
                    {...register('batch_name', {
                      required: 'Batch name is required',
                      minLength: { value: 3, message: 'Batch name must be at least 3 characters' }
                    })}
                    placeholder="e.g., Morning Batch A-101"
                    className="rounded-md border-gray-200 focus:border-[#082c34] focus:ring-1 focus:ring-[#082c34] h-10"
                  />
                  {errors.batch_name && (
                    <p className="text-red-500 text-xs mt-1">{errors.batch_name.message as string}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course" className="text-sm font-medium text-gray-700">Course</Label>
                  <Select
                    onValueChange={(value) => {
                      setSelectedCourse(value);
                      setValue('course', value);
                    }}
                    value={selectedCourse}
                    onOpenChange={handleDropdownOpen}
                  >
                    <SelectTrigger id="course" className="rounded-md border-gray-200 focus:border-[#082c34] focus:ring-1 focus:ring-[#082c34] h-10 bg-white w-88">
                      <SelectValue placeholder={coursesLoading ? "Loading courses..." : "Select a course"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 ">

                      <SelectGroup>
                        <SelectLabel className="text-xs font-medium text-gray-500 px-2 py-1">Available Courses</SelectLabel>
                        {courses.map((course) => (
                          <SelectItem key={course._id} value={course._id} className="py-2 px-2 text-sm cursor-pointer">
                            <div className="flex flex-col">
                              <span className="font-medium">{course.title}</span>
                              <span className="text-xs text-gray-500">{course.category}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>

                      {(coursesPagination.hasPrevPage || coursesPagination.hasNextPage) && (
                        <div className="p-2 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (coursesPagination.hasPrevPage) {
                                loadCourses(coursesPagination.currentPage - 1);
                              }
                            }}
                            disabled={!coursesPagination.hasPrevPage || coursesLoading}
                            className="h-8 px-2 text-gray-600"
                          >
                            <ChevronLeft size={16} />
                          </Button>
                          <span className="text-xs text-gray-500">
                            Page {coursesPagination.currentPage} of {coursesPagination.totalPages}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (coursesPagination.hasNextPage) {
                                loadCourses(coursesPagination.currentPage + 1);
                              }
                            }}
                            disabled={!coursesPagination.hasNextPage || coursesLoading}
                            className="h-8 px-2 text-gray-600"
                          >
                            <ChevronRight size={16} />
                          </Button>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.course && (
                    <p className="text-red-500 text-xs mt-1">{errors.course.message as string}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-[#082c34] hover:bg-[#164956] transition-all duration-200 text-white h-10 px-4 flex items-center gap-2 rounded-md"
                >
                  <Plus size={16} />
                  Create Batch
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'manage' && (
        <Card className="shadow-sm border border-gray-100">
          <CardHeader className="border-b bg-white pb-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col space-y-1">
              <CardTitle className="text-lg text-[#082c34]">Batch Management</CardTitle>
              <CardDescription className="text-gray-500">Manage your existing batches</CardDescription>
            </div>

          </CardHeader>
          <CardContent className="p-0 bg-white">
            {loading && batches.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Loading batches...</p>
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center justify-center text-gray-500">
                <BookOpen className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">No batches found</p>
                <p className="text-sm">Try different search terms or create a new batch</p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <div className="grid grid-cols-1 divide-y border-b">
                  {filteredBatches.map((batch) => (
                    <div key={batch._id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 flex-grow">
                          <div className="w-full md:w-1/3">
                            {editingId === batch._id ? (
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-9 rounded-md text-sm"
                                autoFocus
                              />
                            ) : (
                              <div className="font-medium text-gray-900">{batch.batch_name}</div>
                            )}
                          </div>
                          <div className="w-full md:w-2/3">
                            {batch.course ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-normal">
                                {batch.course.title}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 font-normal">
                                No course
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-end">
                          {editingId === batch._id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleUpdate(batch._id)}
                                className="bg-green-600 hover:bg-green-700 h-8 rounded-md px-3 text-xs"
                              >
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingId(null)}
                                className="h-8 rounded-md px-3 text-xs"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                className='bg-[#082c34] hover:bg-[#164956] h-8 rounded-md px-3 text-xs flex items-center gap-1'
                                onClick={() => {
                                  router.push(`/dashboard/manageMeetings?batchId=${batch._id}`);
                                }}
                              >
                                <Calendar size={14} />
                                <span>Manage meetings</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className='h-8 rounded-md px-3 text-xs flex items-center gap-1 border-gray-200 text-gray-700 hover:bg-gray-50'
                                onClick={() => {
                                  router.push(`/dashboard/addMeetings?batchId=${batch._id}`);
                                }}
                              >
                                <Plus size={14} />
                                <span>Add meetings</span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className='h-8 rounded-md px-3 text-xs flex items-center gap-1 text-gray-700 border-gray-200 hover:bg-gray-50'
                                onClick={() => {
                                  setEditingId(batch._id);
                                  setEditName(batch.batch_name);
                                }}
                              >
                                <Edit size={14} />
                                <span>Edit</span>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className='h-8 rounded-md px-3 text-xs flex items-center gap-1 text-red-600 border-red-100 hover:bg-red-50'
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-lg">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete this batch?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the
                                      batch and all associated meetings.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-md">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700 rounded-md"
                                      onClick={() => batch._id && handleDelete(batch._id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          {batches.length > 0 && filteredBatches.length > 0 && (
            <CardFooter className="flex justify-between py-4 border-t border-gray-100 bg-gray-50">
              <Button
                variant="outline"
                size="sm"
                disabled={!batchPagination.hasPrev || loading}
                onClick={() => loadBatches(batchPagination.page - 1)}
                className="flex items-center gap-2 h-8 text-xs rounded-md border-gray-200"
              >
                <ChevronLeft size={14} />
                Previous
              </Button>
              <div className="text-xs text-gray-500">
                Page {batchPagination.page} of {batchPagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!batchPagination.hasNext || loading}
                onClick={() => loadBatches(batchPagination.page + 1)}
                className="flex items-center gap-2 h-8 text-xs rounded-md border-gray-200"
              >
                Next
                <ChevronRight size={14} />
              </Button>
            </CardFooter>
          )}
        </Card>
      )}

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '8px',
            background: '#FFFFFF',
            color: '#111',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            fontSize: '14px',
            padding: '12px 16px',
          },
          success: {
            icon: '✅',
            style: {
              border: '1px solid #E6F4EA',
              borderLeft: '4px solid #34A853',
            },
          },
          error: {
            icon: '❌',
            style: {
              border: '1px solid #FEEAE8',
              borderLeft: '4px solid #EA4335',
            },
          },
        }}
      />
    </div>
  );
}