// app/news/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    getNewsList,
    deleteNews,
    getNewsById,
    PaginatedNewsResponse,
    NewsListItem,
    NewsData
} from "../../../../apiCalls/manageNews";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, FileText, Search, ChevronUp, ChevronDown, Filter } from "lucide-react";
import { EditNewsModal } from "../../../components/news/newsModal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function NewsListPage() {
    const router = useRouter();
    const [newsData, setNewsData] = useState<PaginatedNewsResponse | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [editingNews, setEditingNews] = useState<NewsData | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const limit: number = 10;

    // Fetch news data
    const fetchNews = async (page: number): Promise<void> => {
        setIsLoading(true);
        try {
            const response = await getNewsList(page, limit);
            setNewsData(response);
        } catch (error) {
            toast.error("Failed to fetch news");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNews(currentPage);
    }, [currentPage]);

    // Handle page change
    const handlePageChange = (page: number): void => {
        setCurrentPage(page);
    };

    // Handle edit news
    const handleEditNews = async (id: string): Promise<void> => {
        try {
            const newsItem = await getNewsById(id);
            if (newsItem) {
                // Convert ISO date to YYYY-MM-DD for date input
                if (newsItem.publishedDate) {
                    newsItem.publishedDate = new Date(newsItem.publishedDate).toISOString().split('T')[0];
                }
                setEditingNews(newsItem);
                setIsEditModalOpen(true);
            }
        } catch (error) {
            toast.error("Failed to load news for editing");
            console.error(error);
        }
    };

    // Handle save after editing
    const handleSaveEditedNews = (updatedNews: NewsData): void => {
        if (!newsData) return;

        // Update the news list if the edited news is in the current page
        setNewsData(prev => {
            if (!prev) return prev;

            const updatedData = prev.data.map(item =>
                item._id === updatedNews._id ? {
                    ...item,
                    title: updatedNews.title,
                    publisher: updatedNews.publisher,
                    publishedDate: updatedNews.publishedDate
                } : item
            );

            return {
                ...prev,
                data: updatedData
            };
        });
    };

    // Handle delete news
    const handleDeleteNews = async (): Promise<void> => {
        if (!deleteId) return;

        setIsDeleting(true);
        try {
            const result = await deleteNews(deleteId);
            if (result.success) {
                toast.success(result.message || "News deleted successfully");
                // Refresh the news list
                fetchNews(currentPage);
            } else {
                toast.error(result.error || "Failed to delete news");
            }
        } catch (error) {
            toast.error("An error occurred while deleting news");
            console.error(error);
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    // Handle create new news
    const handleCreateNews = (): void => {
        router.push("/dashboard/addNews");
    };

    // Format date
    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Generate page numbers for pagination
    const getPaginationItems = (): number[] => {
        if (!newsData) return [];

        const { totalPages, page } = newsData.pagination;

        // For 5 or fewer pages, show all pages
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        // For more than 5 pages, show current page and adjacent pages
        if (page <= 3) {
            return [1, 2, 3, 4, 5];
        } else if (page >= totalPages - 2) {
            return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            return [page - 2, page - 1, page, page + 1, page + 2];
        }
    };

    return (
        <div className="mw-full mx-auto py-6 px-10">
            <Toaster />

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                <div className="mb-4 md:mb-0">
                    <h1 className="text-3xl font-Urbanist font-semibold text-gray-800">News Management</h1>
                    <p className="text-base font-Urbanist text-gray-500 mt-1">Manage and organize all your published news articles</p>
                </div>
                <Button 
                    onClick={handleCreateNews} 
                    className="bg-gray-800 hover:bg-gray-700 px-5 py-6 font-Urbanist"
                >
                    <Plus size={18} className="mr-2" /> Add New Article
                </Button>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <div className="animate-spin h-10 w-10 rounded-full border-4 border-gray-300 border-t-gray-800"></div>
                        </div>
                    ) : newsData && newsData.data.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50">
                                            <TableHead className="w-[40%] font-Urbanist py-4 text-gray-700">Title</TableHead>
                                            <TableHead className="w-[25%] font-Urbanist py-4 text-gray-700">Publisher</TableHead>
                                            <TableHead className="w-[20%] font-Urbanist py-4 text-gray-700">Published Date</TableHead>
                                            <TableHead className="w-[15%] text-right font-Urbanist py-4 text-gray-700">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {newsData.data.map((news) => (
                                            <TableRow key={news._id} className="font-Urbanist border-t hover:bg-gray-50">
                                                <TableCell className="py-5">
                                                    <div className="flex items-center">
                                                        <div className="h-9 w-9 rounded-md bg-gray-100 flex items-center justify-center text-gray-500 mr-3">
                                                            <FileText size={16} />
                                                        </div>
                                                        <span className="font-medium text-gray-800">{news.title}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-5 text-gray-600">{news.publisher}</TableCell>
                                                <TableCell className="py-5 text-gray-600">{formatDate(news.publishedDate)}</TableCell>
                                                <TableCell className="text-right py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEditNews(news._id)}
                                                            className="h-9 px-3 font-Urbanist text-xs"
                                                        >
                                                            <Pencil size={14} className="mr-1" />
                                                            Edit
                                                        </Button>

                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    className="h-9 px-3 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700 font-Urbanist text-xs"
                                                                    onClick={() => setDeleteId(news._id)}
                                                                >
                                                                    <Trash2 size={14} className="mr-1" />
                                                                    Delete
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent className="font-Urbanist">
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle className="font-Urbanist text-gray-800">Confirm Deletion</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete this news article? This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel 
                                                                        onClick={() => setDeleteId(null)}
                                                                        className="font-Urbanist"
                                                                    >
                                                                        Cancel
                                                                    </AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={handleDeleteNews}
                                                                        className="bg-red-600 hover:bg-red-700 font-Urbanist"
                                                                        disabled={isDeleting}
                                                                    >
                                                                        {isDeleting ? (
                                                                            <>
                                                                                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                                                                Deleting...
                                                                            </>
                                                                        ) : "Delete"}
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {newsData.pagination.totalPages > 1 && (
                                <div className="py-6 border-t flex justify-center">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                                    className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} font-Urbanist`}
                                                />
                                            </PaginationItem>

                                            {getPaginationItems().map((page) => (
                                                <PaginationItem key={page}>
                                                    <PaginationLink
                                                        onClick={() => handlePageChange(page)}
                                                        isActive={currentPage === page}
                                                        className="cursor-pointer font-Urbanist"
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            ))}

                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => currentPage < newsData.pagination.totalPages && handlePageChange(currentPage + 1)}
                                                    className={`${currentPage === newsData.pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} font-Urbanist`}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-16 px-4">
                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <FileText size={24} className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-Urbanist font-medium text-gray-800 mb-2">No news articles found</h3>
                            
                            <Button 
                                className="bg-gray-800 hover:bg-gray-700 py-5 px-6 font-Urbanist"
                                onClick={handleCreateNews}
                            >
                                <Plus size={18} className="mr-2" /> Create Your First Article
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit News Modal */}
            <EditNewsModal
                newsData={editingNews}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveEditedNews}
            />
        </div>
    );
}