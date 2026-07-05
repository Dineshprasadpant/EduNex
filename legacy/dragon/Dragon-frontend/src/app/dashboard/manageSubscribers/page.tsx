// components/SubscriberDashboard.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { Loader2, Search, Trash2 } from 'lucide-react';
import {
    fetchSubscribers,
    searchSubscriber,
    deleteSubscriber,
} from '../../../../apiCalls/manageSubscribers';

export default function SubscriberDashboard() {
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [searchEmail, setSearchEmail] = useState('');
    const [searchedSubscriber, setSearchedSubscriber] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
    });

    useEffect(() => {
        loadSubscribers();
    }, [pagination.page]);

    const loadSubscribers = async () => {
        setIsLoading(true);
        try {
            const data = await fetchSubscribers(pagination.page, pagination.limit);
            setSubscribers(data.data);
            setPagination(prev => ({
                ...prev,
                total: data.meta.total,
                totalPages: data.meta.totalPages,
                hasNext: data.meta.hasNext,
                hasPrevious: data.meta.hasPrevious,
            }));
        } catch (error) {
            console.error('Error loading subscribers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchEmail.trim()) {
            toast.error('Please enter an email to search');
            return;
        }

        setIsSearching(true);
        try {
            const subscriber = await searchSubscriber(searchEmail);
            setSearchedSubscriber(subscriber);
            toast.success('Subscriber found!');
        } catch (error) {
            setSearchedSubscriber(null);
        } finally {
            setIsSearching(false);
        }
    };

    const handleDelete = async (email: string) => {
        if (window.confirm('Are you sure you want to delete this subscriber?')) {
            try {
                await deleteSubscriber(email);
                // Refresh the list after deletion
                if (searchedSubscriber?.email === email) {
                    setSearchedSubscriber(null);
                }
                loadSubscribers();
            } catch (error) {
                console.error('Error deleting subscriber:', error);
            }
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    return (
        <div className="py-8 mx-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-800">
                        Subscriber Management
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="relative flex-1">
                                <Input
                                    type="email"
                                    placeholder="Search by email..."
                                    value={searchEmail}
                                    onChange={(e) => setSearchEmail(e.target.value)}
                                    className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            </div>
                            <Button
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {isSearching ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    'Search'
                                )}
                            </Button>
                        </div>

                        {searchedSubscriber && (
                            <div className="mb-6 border rounded-lg p-4 bg-gray-50">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-semibold">Search Result</h3>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setSearchedSubscriber(null)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        Clear
                                    </Button>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Joined Date</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>{searchedSubscriber.email}</TableCell>
                                            <TableCell>
                                                {new Date(searchedSubscriber.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(searchedSubscriber.email)}
                                                    className="gap-1"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <div className="border rounded-lg overflow-hidden">
                            <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
                                <h3 className="text-lg font-semibold">
                                    Subscribers ({pagination.total})
                                </h3>
                                <div className="text-sm text-gray-500">
                                    Page {pagination.page} of {pagination.totalPages}
                                </div>
                            </div>
                            {isLoading ? (
                                <div className="flex justify-center items-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                </div>
                            ) : subscribers.length > 0 ? (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {subscribers.map((subscriber) => (
                                                <TableRow key={subscriber._id}>
                                                    <TableCell>{subscriber.email}</TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDelete(subscriber.email)}
                                                            className="gap-1"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            Delete
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="p-4 border-t">
                                        <Pagination>
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <Button
                                                        variant="outline"
                                                        disabled={!pagination.hasPrevious}
                                                        onClick={() => handlePageChange(pagination.page - 1)}
                                                    >
                                                        <PaginationPrevious />
                                                    </Button>
                                                </PaginationItem>
                                                <PaginationItem>
                                                    <span className="px-4 py-2">
                                                        Page {pagination.page} of {pagination.totalPages}
                                                    </span>
                                                </PaginationItem>
                                                <PaginationItem>
                                                    <Button
                                                        variant="outline"
                                                        disabled={!pagination.hasNext}
                                                        onClick={() => handlePageChange(pagination.page + 1)}
                                                    >
                                                        <PaginationNext />
                                                    </Button>
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    </div>
                                </>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    No subscribers found
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}