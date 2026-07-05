'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Check,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Trash2,
  Edit,
  Key,
  X,
  Image as ImageIcon,
  FileText,
  UserCheck,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { UserApiService, User } from '../../../../apiCalls/verifyUsers';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface Batch {
  _id: string;
  batch_name: string;
}

interface Course {
  _id: string;
  title: string;
}

interface ExamResult {
  examName: string;
  totalQuestions: number;
  correctAnswers: number;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  limit: number;
}

interface UsersResponse {
  users: User[];
  count: number;
}

interface SearchUsersResponse {
  data: {
    users: User[];
    totalPages: number;
  };
}

interface BatchesResponse {
  data: Batch[];
  meta: {
    totalPages: number;
  };
}

interface UpdateUserResponse {
  user: User;
}

interface UserApiServiceType {
  getUnverifiedUsers: (page: number, limit: number) => Promise<UsersResponse>;
  getVerifiedUsers: (page: number, limit: number) => Promise<UsersResponse>;
  searchUsers: (query: string, page: number, limit: number) => Promise<SearchUsersResponse>;
  getBatches: (page: number, limit: number) => Promise<BatchesResponse>;
  verifyUser: (userId: string, batchId: string) => Promise<any>;
  deleteUser: (userId: string) => Promise<any>;
  updateUser: (userId: string, data: EditFormState) => Promise<UpdateUserResponse>;
  resetPassword: (userId: string, newPassword: string) => Promise<any>;
}

interface EditFormState {
  fullname: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  plan: string;
  batch: string;
}

export default function AdminVerifyUsersPage() {
  const [activeTab, setActiveTab] = useState<'unverified' | 'verified' | 'search'>('unverified');
  const [unverifiedUsers, setUnverifiedUsers] = useState<User[]>([]);
  const [verifiedUsers, setVerifiedUsers] = useState<User[]>([]);
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const [isLoadingUnverified, setIsLoadingUnverified] = useState<boolean>(true);
  const [isLoadingVerified, setIsLoadingVerified] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState<boolean>(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedImageTitle, setSelectedImageTitle] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isResettingPassword, setIsResettingPassword] = useState<boolean>(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [isLoadingBatches, setIsLoadingBatches] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [editForm, setEditForm] = useState<EditFormState>({
    fullname: '',
    email: '',
    phone: '',
    role: '',
    status: '',
    plan: '',
    batch: '',
  });
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState<boolean>(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState<string>('');

  const [unverifiedPagination, setUnverifiedPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });

  const [verifiedPagination, setVerifiedPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });

  const [searchPagination, setSearchPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });

  const [batchPagination, setBatchPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });

  const [isLoadingEditBatches, setIsLoadingEditBatches] = useState<boolean>(false);
  const [editBatches, setEditBatches] = useState<Batch[]>([]);
  const [editBatchPagination, setEditBatchPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    limit: 10,
  });

  const verifiedUsersLoaded = useRef<boolean>(false);
  const router = useRouter();

  const fetchUnverifiedUsers = async (page = 1) => {
    setIsLoadingUnverified(true);
    try {
      const response = await UserApiService.getUnverifiedUsers(page, unverifiedPagination.limit);
      setUnverifiedUsers(response.users);
      setUnverifiedPagination({
        ...unverifiedPagination,
        currentPage: page,
        totalPages: Math.ceil(response.count / unverifiedPagination.limit),
      });
    } catch (error) {
      toast.error('Failed to fetch unverified users');
      console.error('Error fetching unverified users:', error);
    } finally {
      setIsLoadingUnverified(false);
    }
  };

  const fetchVerifiedUsers = async (page = 1) => {
    setIsLoadingVerified(true);
    try {
      const response = await UserApiService.getVerifiedUsers(page, verifiedPagination.limit);
      setVerifiedUsers(response.users);
      setVerifiedPagination({
        ...verifiedPagination,
        currentPage: page,
        totalPages: Math.ceil(response.count / verifiedPagination.limit),
      });
      verifiedUsersLoaded.current = true;
    } catch (error) {
      toast.error('Failed to fetch verified users');
      console.error('Error fetching verified users:', error);
    } finally {
      setIsLoadingVerified(false);
    }
  };

  const handleSearch = async (page = 1) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await UserApiService.searchUsers(
        searchQuery,
        page,
        searchPagination.limit
      );
      setSearchedUsers(response.data.users);
      setSearchPagination({
        ...searchPagination,
        currentPage: page,
        totalPages: response.data.totalPages,
      });
    } catch (error) {
      toast.error('Failed to search users');
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const fetchBatches = async (page = 1) => {
    setIsLoadingBatches(true);
    try {
      const response = await UserApiService.getBatches(page, batchPagination.limit);
      setBatches(response.data);
      setBatchPagination({
        ...batchPagination,
        currentPage: page,
        totalPages: response.meta.totalPages || 1,
      });
      if (page === 1 && response.data.length > 0 && !selectedBatchId) {
        setSelectedBatchId(response.data[0]._id);
      }
    } catch (error) {
      toast.error('Failed to fetch batches');
      console.error('Error fetching batches:', error);
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const handleBatchPageChange = (page: number) => {
    fetchBatches(page);
  };

  const fetchEditBatches = async (page = 1) => {
    setIsLoadingEditBatches(true);
    try {
      const response = await UserApiService.getBatches(page, editBatchPagination.limit);
      setEditBatches(response.data);
      setEditBatchPagination({
        ...editBatchPagination,
        currentPage: page,
        totalPages: response.meta.totalPages || 1,
      });
    } catch (error) {
      toast.error('Failed to fetch batches');
      console.error('Error fetching batches:', error);
    } finally {
      setIsLoadingEditBatches(false);
    }
  };

  const handleEditBatchPageChange = (page: number) => {
    fetchEditBatches(page);
  };

  useEffect(() => {
    fetchUnverifiedUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'verified' && !verifiedUsersLoaded.current) {

      fetchVerifiedUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (isConfirmDialogOpen) {
      fetchBatches(1);
      setSelectedBatchId('');
    }
  }, [isConfirmDialogOpen]);

  useEffect(() => {
    if (isEditDialogOpen) {
      fetchEditBatches(1);
    }
  }, [isEditDialogOpen]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'unverified' | 'verified' | 'search');
  };

  const handleVerifyClick = (user: User) => {
    setSelectedUser(user);
    setIsConfirmDialogOpen(true);
  };

  const handleViewDetailsClick = (user: User) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      fullname: user.fullname || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || '',
      status: user.status || '',
      plan: user.plan || '',
      batch: user.batch?._id || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenImage = (imageUrl: string, title: string) => {
    setSelectedImage(imageUrl);
    setSelectedImageTitle(title);
    setIsImageDialogOpen(true);
  };

  const confirmVerification = async () => {
    if (!selectedUser || !selectedBatchId) {
      toast.error('Please select a batch');
      return;
    }

    setIsVerifying(true);
    try {
      await UserApiService.verifyUser(selectedUser._id, selectedBatchId);
      toast.success(`${selectedUser.fullname} has been verified successfully`);
      setUnverifiedUsers(prevUsers => prevUsers.filter(user => user._id !== selectedUser._id));
      verifiedUsersLoaded.current = false;
      setIsConfirmDialogOpen(false);
    } catch (error) {
      toast.error('Failed to verify user');
      console.error('Error verifying user:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    setIsDeleteConfirmDialogOpen(true);
    setDeleteConfirmName('');
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    try {
      await UserApiService.deleteUser(selectedUser._id);
      toast.success(`${selectedUser.fullname} has been deleted successfully`);

      if (activeTab === 'unverified') {
        setUnverifiedUsers(prevUsers => prevUsers.filter(user => user._id !== selectedUser._id));
      } else if (activeTab === 'verified') {
        setVerifiedUsers(prevUsers => prevUsers.filter(user => user._id !== selectedUser._id));
      } else {
        setSearchedUsers(prevUsers => prevUsers.filter(user => user._id !== selectedUser._id));
      }

      setIsDeleteConfirmDialogOpen(false);
      setIsDetailsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to delete user');
      console.error('Error deleting user:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      const response = await UserApiService.updateUser(selectedUser._id, editForm);
      toast.success(`${response.user.fullname} has been updated successfully`);

      const updateUserInList = (users: User[]) =>
        users.map(user => user._id === selectedUser._id ? response.user : user);

      if (activeTab === 'unverified') {
        setUnverifiedUsers(updateUserInList(unverifiedUsers));
      } else if (activeTab === 'verified') {
        setVerifiedUsers(updateUserInList(verifiedUsers));
      } else {
        setSearchedUsers(updateUserInList(searchedUsers));
      }

      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update user');
      console.error('Error updating user:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    setIsResettingPassword(true);
    try {
      await UserApiService.resetPassword(selectedUser._id, newPassword);
      toast.success(`Password for ${selectedUser.fullname} has been reset successfully`);
      setIsResetPasswordDialogOpen(false);
      setNewPassword('');
    } catch (error) {
      toast.error('Failed to reset password');
      console.error('Error resetting password:', error);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handlePageChange = (tab: string, page: number) => {
    if (tab === 'unverified') {
      fetchUnverifiedUsers(page);
    } else if (tab === 'verified') {
      fetchVerifiedUsers(page);
    } else {
      handleSearch(page);
    }
  };

  // Helper function to safely render payment images
  const renderPaymentImages = (user: User) => {
    if (!user.paymentImage || !Array.isArray(user.paymentImage) || user.paymentImage.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {user.paymentImage.map((images, index) => {
          // Check if images is an array before mapping
          if (!Array.isArray(images)) return null;

          return images.map((image, imgIndex) => {
            if (!image) return null;

            return (
              <button
                key={`${index}-${imgIndex}`}
                onClick={() => handleOpenImage(image, `Payment ${index + 1}`)}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-md text-xs flex items-center shadow-sm transition-colors duration-150"
              >
                <ImageIcon className="h-3 w-3 mr-1.5" />
                Payment {index + 1}
              </button>
            );
          });
        })}
      </div>
    );
  };

  const PaginationControls = ({ tab, pagination }: { tab: string, pagination: PaginationState }) => {
    const { currentPage, totalPages } = pagination;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-2">
        <div>
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
        </div>
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(tab, 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0 rounded-md"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(tab, currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0 rounded-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(tab, currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0 rounded-md"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(tab, totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0 rounded-md"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Enhanced responsive user card with premium styling
  const ResponsiveUserCard = ({ user, showActions = true }: { user: User, showActions?: boolean }) => {
    return (
      <div className="mb-4 p-5 border rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-medium text-lg">{user.fullname}</h3>
          <Badge variant={user.status === 'verified' ? 'default' : 'destructive'} className="px-2.5 py-1">
            {user.status}
          </Badge>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-600">
            <div className="w-28 font-medium text-gray-700">Email:</div>
            <div className="break-all">{user.email}</div>
          </div>
          <div className="flex items-center text-gray-600">
            <div className="w-28 font-medium text-gray-700">Phone:</div>
            <div>{user.phone}</div>
          </div>
          <div className="flex items-center text-gray-600">
            <div className="w-28 font-medium text-gray-700">Plan:</div>
            <Badge variant="outline" className="capitalize ml-1 px-2.5 py-0.5">
              {user.plan}
            </Badge>
          </div>
          {user.planUpgradedFrom && (
            <div className="flex items-center text-gray-600">
              <div className="w-28 font-medium text-gray-700">Previous Plan:</div>
              <Badge variant="outline" className="capitalize ml-1 px-2.5 py-0.5">
                {user.planUpgradedFrom}
              </Badge>
            </div>
          )}
          {user.examsAttended && (
            <div className="flex items-center text-gray-600">
              <div className="w-28 font-medium text-gray-700">Exams Taken:</div>
              <div>{user.examsAttended.length || 0}</div>
            </div>
          )}
          {user.createdAt && (
            <div className="flex items-center text-gray-600">
              <div className="w-28 font-medium text-gray-700">Registered:</div>
              <div>{new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
          )}
          {renderPaymentImages(user) && (
            <div className="mt-2">
              <div className="w-full font-medium text-gray-700 mb-2">Payment Images:</div>
              {renderPaymentImages(user)}
            </div>
          )}
        </div>

        {showActions && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewDetailsClick(user)}
              className="rounded-md h-9 border-gray-300 hover:bg-gray-50 transition-colors duration-150"
            >
              <Eye className="h-4 w-4 mr-1.5 text-gray-600" /> Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditClick(user)}
              className="rounded-md h-9 border-gray-300 hover:bg-gray-50 transition-colors duration-150"
            >
              <Edit className="h-4 w-4 mr-1.5 text-gray-600" /> Edit
            </Button>
            {user.status !== 'verified' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleVerifyClick(user)}
                className="rounded-md h-9 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-colors duration-150"
              >
                <Check className="h-4 w-4 mr-1.5" /> Verify
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-10 min-h-screen bg-gray-50 font-Urbanist">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800 ">User Verification Dashboard</h1>
          <p className="text-gray-500 mb-4">Manage and verify user registrations</p>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
            <Tabs
              defaultValue="unverified"
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full sm:w-auto"
            >
              <TabsList className="w-full sm:w-auto rounded-lg bg-gray-100 p-1">
                <TabsTrigger value="unverified" className="flex-1 sm:flex-none rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Unverified Users
                  {unverifiedUsers.length > 0 && (
                    <Badge className="ml-2" variant="destructive">
                      {unverifiedUsers.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="verified" className="flex-1 sm:flex-none rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Verified Users
                  {verifiedUsers.length > 0 && (
                    <Badge className="ml-2" variant="default">
                      {verifiedUsers.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center space-x-2 w-full sm:w-auto p-1">
              <Input
                placeholder="Search users by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              <Button onClick={() => {
                setActiveTab('search');
                handleSearch();
              }}
                disabled={!searchQuery.trim()}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-colors duration-150 rounded-md"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {activeTab === 'search' ? (
          <Card className="shadow-sm border-gray-200 rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b pb-4">
              <CardTitle className="text-xl text-gray-800">Search Results</CardTitle>
              <CardDescription className="text-gray-500">
                Users matching your search query
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isSearching ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-3 text-gray-600">Searching users...</span>
                </div>
              ) : searchedUsers.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  {searchQuery ? 'No users found matching your search' : 'Enter a search query to find users'}
                </div>
              ) : (
                <>
                  {/* Responsive design - show cards on small screens and table on larger screens */}
                  <div className="block md:hidden">
                    {searchedUsers.map(user => (
                      <ResponsiveUserCard key={user._id} user={user} />
                    ))}
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="font-semibold text-gray-700">Name</TableHead>
                          <TableHead className="font-semibold text-gray-700">Email</TableHead>
                          <TableHead className="font-semibold text-gray-700">Phone</TableHead>
                          <TableHead className="font-semibold text-gray-700">Status</TableHead>
                          <TableHead className="font-semibold text-gray-700">Plan</TableHead>
                          <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchedUsers.map((user) => (
                          <TableRow key={user._id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{user.fullname}</TableCell>
                            <TableCell className="text-gray-600">{user.email}</TableCell>
                            <TableCell className="text-gray-600">{user.phone}</TableCell>
                            <TableCell>
                              <Badge variant={user.status === 'verified' ? 'default' : 'destructive'} className="px-2.5 py-1">
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize px-2.5 py-0.5">
                                {user.plan}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                className="mr-2 rounded-md border-gray-300 hover:bg-gray-50"
                                onClick={() => handleViewDetailsClick(user)}
                              >
                                <Eye className="h-4 w-4 mr-1 text-gray-600" /> Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mr-2 rounded-md border-gray-300 hover:bg-gray-50"
                                onClick={() => handleEditClick(user)}
                              >
                                <Edit className="h-4 w-4 mr-1 text-gray-600" /> Edit
                              </Button>
                              {user.status !== 'verified' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleVerifyClick(user)}
                                  className="rounded-md bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                >
                                  <Check className="h-4 w-4 mr-1" /> Verify
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <PaginationControls
                    tab="search"
                    pagination={searchPagination}
                  />
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsContent value="unverified">
              <Card className="shadow-sm border-gray-200 rounded-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b pb-4">
                  <CardTitle className="text-xl text-gray-800">Unverified Users</CardTitle>
                  <CardDescription className="text-gray-500">
                    Review and verify new user registrations
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoadingUnverified ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <span className="ml-3 text-gray-600">Loading users...</span>
                    </div>
                  ) : unverifiedUsers.length === 0 ? (
                    <div className="text-center py-16 text-gray-500 flex flex-col items-center justify-center">
                      <FileText className="h-12 w-12 text-gray-300 mb-3" />
                      <p>No unverified users found</p>
                    </div>
                  ) : (
                    <>
                      {/* Responsive design - show cards on small screens and table on larger screens */}
                      <div className="block md:hidden">
                        {unverifiedUsers.map(user => (
                          <ResponsiveUserCard key={user._id} user={user} />
                        ))}
                      </div>
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                              <TableHead className="font-semibold text-gray-700">Name</TableHead>
                              <TableHead className="font-semibold text-gray-700">Email</TableHead>
                              <TableHead className="font-semibold text-gray-700">Phone</TableHead>
                              <TableHead className="font-semibold text-gray-700">Payment</TableHead>
                              <TableHead className="font-semibold text-gray-700">Previous Plan</TableHead>
                              <TableHead className="hidden lg:table-cell font-semibold text-gray-700">Preferred Platform</TableHead>
                              <TableHead className="font-semibold text-gray-700">Plan</TableHead>
                              <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {unverifiedUsers.map((user) => (
                              <TableRow key={user._id} className="hover:bg-gray-50">
                                <TableCell className="font-medium">{user.fullname}</TableCell>
                                <TableCell className="text-gray-600">{user.email}</TableCell>
                                <TableCell className="text-gray-600">{user.phone}</TableCell>
                                <TableCell>
                                  {renderPaymentImages(user)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize px-2.5 py-0.5">
                                    {user.planUpgradedFrom || 'N/A'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-gray-600">
                                  {user.platformPreference}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize px-2.5 py-0.5">
                                    {user.plan}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mr-2 rounded-md border-gray-300 hover:bg-gray-50"
                                    onClick={() => handleViewDetailsClick(user)}
                                  >
                                    <Eye className="h-4 w-4 mr-1 text-gray-600" /> Details
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleVerifyClick(user)}
                                    className="rounded-md bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                  >
                                    <Check className="h-4 w-4 mr-1" /> Verify
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <PaginationControls
                        tab="unverified"
                        pagination={unverifiedPagination}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verified">
              <Card className="shadow-sm border-gray-200 rounded-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b pb-4">
                  <CardTitle className="text-xl text-gray-800">Verified Users</CardTitle>
                  <CardDescription className="text-gray-500">
                    List of all verified users in the system
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoadingVerified ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <span className="ml-3 text-gray-600">Loading users...</span>
                    </div>
                  ) : verifiedUsers.length === 0 ? (
                    <div className="text-center py-16 text-gray-500 flex flex-col items-center justify-center">
                      <UserCheck className="h-12 w-12 text-gray-300 mb-3" />
                      <p>No verified users found</p>
                    </div>
                  ) : (
                    <>
                      {/* Responsive design - show cards on small screens and table on larger screens */}
                      <div className="block md:hidden">
                        {verifiedUsers.map(user => (
                          <ResponsiveUserCard key={user._id} user={user} />
                        ))}
                      </div>
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50 hover:bg-gray-50">
                              <TableHead className="font-semibold text-gray-700">Name</TableHead>
                              <TableHead className="font-semibold text-gray-700">Email</TableHead>
                              <TableHead className="font-semibold text-gray-700">Phone</TableHead>
                              <TableHead className="font-semibold text-gray-700">Exams</TableHead>
                              <TableHead className="font-semibold text-gray-700">Payment</TableHead>
                              <TableHead className="hidden lg:table-cell font-semibold text-gray-700">Previous Plan</TableHead>
                              <TableHead className="font-semibold text-gray-700">Plan</TableHead>
                              <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {verifiedUsers.map((user) => (
                              <TableRow key={user._id} className="hover:bg-gray-50">
                                <TableCell className="font-medium">{user.fullname}</TableCell>
                                <TableCell className="text-gray-600">{user.email}</TableCell>
                                <TableCell className="text-gray-600">{user.phone}</TableCell>
                                <TableCell className="text-gray-600">{user.examsAttended?.length || 0}</TableCell>
                                <TableCell>
                                  {renderPaymentImages(user)}
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <Badge variant="outline" className="capitalize px-2.5 py-0.5">
                                    {user.planUpgradedFrom || 'N/A'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize px-2.5 py-0.5">
                                    {user.plan}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mr-2 rounded-md border-gray-300 hover:bg-gray-50"
                                    onClick={() => handleViewDetailsClick(user)}
                                  >
                                    <Eye className="h-4 w-4 mr-1 text-gray-600" /> Details
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-md border-gray-300 hover:bg-gray-50"
                                    onClick={() => handleEditClick(user)}
                                  >
                                    <Edit className="h-4 w-4 mr-1 text-gray-600" /> Edit
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <PaginationControls
                        tab="verified"
                        pagination={verifiedPagination}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent className="sm:max-w-md max-w-[90vw] rounded-xl overflow-hidden border-0 shadow-lg">
            <DialogHeader className="pb-2 border-b">
              <DialogTitle className="text-xl font-bold text-gray-800 font-Urbanist">Confirm User Verification</DialogTitle>
              <DialogDescription className="pt-2 text-gray-500 font-Urbanist">
                Verify {selectedUser?.fullname} and assign them to a batch
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4 font-Urbanist">
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 font-medium">Name:</span>
                    <p className="font-semibold text-gray-800">{selectedUser?.fullname}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Email:</span>
                    <p className="truncate text-gray-800">{selectedUser?.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Phone:</span>
                    <p className="text-gray-800">{selectedUser?.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Plan:</span>
                    <p className="capitalize text-gray-800">{selectedUser?.plan}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-500 font-medium">Previous Plan:</span>
                    <p className="capitalize text-gray-800">{selectedUser?.planUpgradedFrom || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 font-Urbanist">Select Batch</label>
                {isLoadingBatches ? (
                  <div className="flex items-center justify-center p-4 bg-gray-50 rounded-md border border-gray-200">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin text-blue-500" />
                    <span className="text-gray-600">Loading batches...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="flex font-Urbanist h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Select a Batch</option>
                      {batches.map((batch) => (
                        <option key={batch._id} value={batch._id}>
                          {batch.batch_name}
                        </option>
                      ))}
                    </select>

                    <div className="flex justify-between items-center text-xs bg-gray-50 rounded-md p-2">
                      <span className="text-gray-600 font-medium">
                        Page {batchPagination.currentPage} of {batchPagination.totalPages}
                      </span>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 font-Urbanist"
                          onClick={() => handleBatchPageChange(1)}
                          disabled={batchPagination.currentPage === 1}
                          aria-label="First page"
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 font-Urbanist"
                          onClick={() => handleBatchPageChange(batchPagination.currentPage - 1)}
                          disabled={batchPagination.currentPage === 1}
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 font-Urbanist"
                          onClick={() => handleBatchPageChange(batchPagination.currentPage + 1)}
                          disabled={batchPagination.currentPage === batchPagination.totalPages}
                          aria-label="Next page"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 font-Urbanist"
                          onClick={() => handleBatchPageChange(batchPagination.totalPages)}
                          disabled={batchPagination.currentPage === batchPagination.totalPages}
                          aria-label="Last page"
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2 border-t flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsConfirmDialogOpen(false)}
                disabled={isVerifying}
                className="border-gray-300 hover:bg-gray-50 rounded-md w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmVerification}
                disabled={isVerifying || !selectedBatchId}
                className="ml-0 sm:ml-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-md w-full sm:w-auto"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Verify User
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Details Dialog - Made responsive and premium */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="w-[90vw] max-w-[95vw] sm:max-w-[85vw] md:max-w-[37rem] max-h-[90vh] overflow-y-auto rounded-xl shadow-lg border-0">
            <DialogHeader className="pb-2 border-b">
              <DialogTitle className="font-bold text-xl text-gray-800 font-Urbanist">User Details</DialogTitle>
              <DialogDescription className="text-gray-500 pt-1 font-Urbanist">
                Complete information for {selectedUser?.fullname}
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-5 pt-2 font-Urbanist">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Personal Information</h3>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-500 font-medium">Full Name:</span>
                        <span className="font-semibold text-gray-800">{selectedUser.fullname}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 font-medium">Email:</span>
                        <span className="break-all text-gray-800">{selectedUser.email}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 font-medium">Phone:</span>
                        <span className="text-gray-800">{selectedUser.phone}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 font-medium">Role:</span>
                        <Badge className="mt-1 w-fit">{selectedUser.role}</Badge>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 font-medium">Course:</span>
                        <span className="text-gray-800">{selectedUser.courseEnrolled?.title || 'None'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 font-medium">Batch:</span>
                        <span className="text-gray-800">{selectedUser.batch?.batch_name || 'Not assigned'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 font-medium">Status:</span>
                        <Badge variant={selectedUser.status === 'verified' ? 'default' : 'destructive'} className="mt-1 w-fit">
                          {selectedUser.status}
                        </Badge>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 font-medium">Current Plan:</span>
                        <Badge variant="outline" className="capitalize mt-1 w-fit">{selectedUser.plan}</Badge>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 font-medium">Previous Plan:</span>
                        <Badge variant="outline" className="capitalize mt-1 w-fit">{selectedUser.planUpgradedFrom || 'N/A'}</Badge>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 font-medium">User Preferred Plan:</span>
                        <Badge variant="outline" className="capitalize mt-1 w-fit">{selectedUser.platformPreference}</Badge>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500 font-medium">Registered:</span>
                        <span className="text-gray-800">{new Date(selectedUser.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Identification Document</h3>
                    <div className="mt-2 border rounded-lg overflow-hidden shadow-sm bg-gray-50">
                      {selectedUser.citizenshipImageUrl ? (
                        <div
                          className="relative aspect-video cursor-pointer transition-transform hover:scale-[0.99]"
                          onClick={() => handleOpenImage(selectedUser.citizenshipImageUrl || '', 'Identification Document')}
                        >
                          <img
                            src={selectedUser.citizenshipImageUrl}
                            alt="Citizenship Document"
                            className="object-contain w-full h-64 md:h-80 lg:h-96 rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                            <div className="bg-white p-1.5 rounded-full opacity-0 hover:opacity-100 transform translate-y-1 hover:translate-y-0 transition-all duration-200">
                              <Search className="h-4 w-4 text-gray-600" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center text-gray-500 flex flex-col items-center justify-center">
                          <FileText className="h-10 w-10 text-gray-300 mb-2" />
                          <p>No identification document available</p>
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-medium text-gray-800 mt-5 mb-3">Payment Images</h3>
                    {selectedUser.paymentImage && Array.isArray(selectedUser.paymentImage) && selectedUser.paymentImage.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {selectedUser.paymentImage.map((images, index) => {
                          if (!Array.isArray(images)) return null;

                          return images.map((image, imgIndex) => {
                            if (!image) return null;

                            return (
                              <div
                                key={`${index}-${imgIndex}`}
                                className="border rounded-lg overflow-hidden shadow-sm bg-gray-50 cursor-pointer transition-transform hover:scale-[0.98]"
                                onClick={() => handleOpenImage(image, `Payment ${index + 1}`)}
                              >
                                <div className="aspect-video relative">
                                  <img
                                    src={image}
                                    alt={`Payment ${index + 1}`}
                                    className="object-contain w-full h-full max-h-[80vh] max-w-full rounded-lg"
                                    style={{ display: 'block', margin: '0 auto' }}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                                    <div className="bg-white p-1.5 rounded-full opacity-0 hover:opacity-100 transform translate-y-1 hover:translate-y-0 transition-all duration-200">
                                      <Search className="h-4 w-4 text-gray-600" />
                                    </div>
                                  </div>
                                </div>
                                <div className="p-2 text-center text-sm font-medium bg-white border-t">
                                  Payment {index + 1}
                                </div>
                              </div>
                            );
                          });
                        })}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-500 mt-2 border rounded-lg bg-gray-50 flex flex-col items-center justify-center">
                        <FileText className="h-10 w-10 text-gray-300 mb-2" />
                        <p>No payment images available</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedUser.examsAttended && selectedUser.examsAttended.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-medium text-gray-800 mb-3 border-b pb-2">Exam History</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-white hover:bg-white">
                            <TableHead className="font-semibold text-gray-700">Exam Name</TableHead>
                            <TableHead className="text-right font-semibold text-gray-700">Questions</TableHead>
                            <TableHead className="text-right font-semibold text-gray-700">Correct Answers</TableHead>
                            <TableHead className="text-right font-semibold text-gray-700">Score (%)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedUser.examsAttended.map((exam, index) => (
                            <TableRow key={index} className="hover:bg-white">
                              <TableCell className="break-all">{exam.examName}</TableCell>
                              <TableCell className="text-right">{exam.totalQuestions}</TableCell>
                              <TableCell className="text-right">{exam.correctAnswers}</TableCell>
                              <TableCell className="text-right">
                                {exam.totalQuestions > 0
                                  ? ((exam.correctAnswers / exam.totalQuestions) * 100).toFixed(1)
                                  : 0}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between pt-4 gap-2 border-t">
                  <div>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteUser}
                      className="w-full sm:w-auto rounded-md"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete User
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">


                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDetailsDialogOpen(false);
                        setIsResetPasswordDialogOpen(true);
                      }}
                      className="w-full sm:w-auto rounded-md border-gray-300 hover:bg-gray-50"
                    >
                      <Key className="h-4 w-4 mr-2 text-gray-600" />
                      Reset Password
                    </Button>

                    {selectedUser.status !== 'verified' && (
                      <Button
                        onClick={() => {
                          setIsDetailsDialogOpen(false);
                          setIsConfirmDialogOpen(true);
                        }}
                        className="w-full sm:w-auto rounded-md bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Verify User
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[90vw] max-w-[95vw] sm:max-w-[85vw] md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-lg border-0">
            <DialogHeader className="pb-2 border-b">
              <DialogTitle className="font-bold text-xl text-gray-800">Edit User</DialogTitle>
              <DialogDescription className="text-gray-500 pt-1">
                Update information for {selectedUser?.fullname}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <Input
                  value={editForm.fullname || ''}
                  onChange={(e) => setEditForm({ ...editForm, fullname: e.target.value })}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <Input
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <Input
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={editForm.role || ''}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="user">User</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={editForm.status || ''}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="unverified">Unverified</option>
                  <option value="verified">Verified</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Plan</label>
                <select
                  value={editForm.plan || ''}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                  <option value="full">Full</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Course Enrolled</label>
                <Input
                  value={selectedUser?.courseEnrolled?.title || 'None'}
                  readOnly
                  className="bg-gray-50 border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Batch</label>
                {isLoadingEditBatches ? (
                  <div className="flex items-center justify-center p-4 bg-gray-50 rounded-md border border-gray-200">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin text-blue-500" />
                    <span className="text-gray-600">Loading batches...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={editForm.batch || ''}
                      onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">Select a Batch</option>
                      {editBatches.map((batch) => (
                        <option key={batch._id} value={batch._id}>
                          {batch.batch_name}
                        </option>
                      ))}
                    </select>

                    <div className="flex justify-between items-center text-xs bg-gray-50 rounded-md p-2">
                      <span className="text-gray-600 font-medium">
                        Page {editBatchPagination.currentPage} of {editBatchPagination.totalPages}
                      </span>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          onClick={() => handleEditBatchPageChange(1)}
                          disabled={editBatchPagination.currentPage === 1}
                          aria-label="First page"
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          onClick={() => handleEditBatchPageChange(editBatchPagination.currentPage - 1)}
                          disabled={editBatchPagination.currentPage === 1}
                          aria-label="Previous page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          onClick={() => handleEditBatchPageChange(editBatchPagination.currentPage + 1)}
                          disabled={editBatchPagination.currentPage === editBatchPagination.totalPages}
                          aria-label="Next page"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                          onClick={() => handleEditBatchPageChange(editBatchPagination.totalPages)}
                          disabled={editBatchPagination.currentPage === editBatchPagination.totalPages}
                          aria-label="Last page"
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t">
              <Button
                variant="outline"
                className="w-full sm:w-auto rounded-md border-gray-300 hover:bg-gray-50"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUser}
                className="w-full sm:w-auto rounded-md bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Update User
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <DialogContent className="w-[90vw] max-w-[95vw] sm:max-w-md rounded-xl shadow-lg border-0">
            <DialogHeader className="pb-2 border-b">
              <DialogTitle className="text-xl font-bold text-gray-800">Reset Password</DialogTitle>
              <DialogDescription className="pt-2 text-gray-500">
                Set a new password for {selectedUser?.fullname}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => setIsResetPasswordDialogOpen(false)}
                disabled={isResettingPassword}
                className="w-full sm:w-auto rounded-md border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={isResettingPassword || !newPassword}
                className="w-full sm:w-auto rounded-md bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Reset Password
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteConfirmDialogOpen} onOpenChange={setIsDeleteConfirmDialogOpen}>
          <DialogContent className="w-[90vw] max-w-[95vw] sm:max-w-md rounded-xl shadow-lg border-0">
            <DialogHeader className="pb-2 border-b">
              <DialogTitle className="text-xl font-bold text-gray-800 font-Urbanist">Confirm Delete User</DialogTitle>
              <DialogDescription className="pt-2 text-gray-500">
                This action cannot be undone. Please type <span className="font-medium text-red-500">{selectedUser?.fullname}</span> to confirm.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4 font-Urbanist">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">Warning: This action will permanently delete the user</p>
                    <p className="mt-1">All user data, including exam history and payment information, will be lost.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 font-Urbanist">
                  Type the full name to confirm
                </label>
                <Input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={`Type "${selectedUser?.fullname}" to confirm`}
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500 font-Urbanist"
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t">
              <Button
                variant="outline"
                onClick={() => setIsDeleteConfirmDialogOpen(false)}
                disabled={isDeleting}
                className="w-full sm:w-auto rounded-md font-Urbanist border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteUser}
                disabled={isDeleting || deleteConfirmName !== (selectedUser?.fullname || '')}
                className="w-full sm:w-auto rounded-md font-Urbanist"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Viewing Dialog - Fixed with proper title to solve accessibility error */}
        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-w-[95vw] p-0 overflow-hidden rounded-xl shadow-lg border-0">
            <DialogHeader className="sr-only">
              <DialogTitle>{selectedImageTitle || "Image View"}</DialogTitle>
              <DialogDescription>High resolution view of the selected image</DialogDescription>
            </DialogHeader>

            <div className="relative">
              {/* Close button positioned over the image */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 h-8 w-8"
                onClick={() => setIsImageDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="relative h-[80vh] w-full">
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt={selectedImageTitle || "Image"}
                    className="object-contain w-full h-full max-h-[80vh] max-w-full rounded-lg"
                    style={{ display: 'block', margin: '0 auto' }}
                  />
                )}
              </div>

              <div className="bg-black/80 text-white p-3 flex items-center justify-between">
                <span className="font-medium">{selectedImageTitle || "Image View"}</span>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
                  onClick={() => {
                    // Create an anchor element to trigger download
                    const link = document.createElement('a');
                    link.href = selectedImage;
                    link.download = `${selectedImageTitle || 'image'}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  title="Download image"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  );
}