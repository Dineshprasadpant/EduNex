"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, Clock, Link, Clock3, CalendarX, Trash2, ChevronRight } from "lucide-react";
import {
    getBatchWithMeetings,
    updateBatchMeeting,
    deleteBatchMeeting,
    MeetingData,
    BatchWithMeetings
} from "../../../../apiCalls/manageMeetings";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Create a client component that safely uses useSearchParams
function EditMeetingContent() {
    const searchParams = useSearchParams();
    const batchId = searchParams.get("batchId");
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [batchData, setBatchData] = useState<BatchWithMeetings | null>(null);
    const [selectedMeeting, setSelectedMeeting] = useState<MeetingData | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!batchId) return;

            setIsLoading(true);
            try {
                const result = await getBatchWithMeetings(batchId as string);

                if (result.success && result.data) {
                    setBatchData(result.data);

                    // If there's only one meeting, auto-select it
                    if (result.data.scheduled_meetings.length === 1) {
                        setSelectedMeeting(result.data.scheduled_meetings[0]);
                    }
                } else {
                    toast.error(result.error || "Failed to load batch data");
                    router.push(`/dashboard/manageBatch`);
                }
            } catch (error) {
                toast.error("An error occurred while loading batch data");
                console.error(error);
                router.push(`/dashboard/manageBatch`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [batchId, router]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (timeString: string) => {
        // Convert 24-hour format to 12-hour format if needed
        if (timeString.includes(':')) {
            const [hours, minutes] = timeString.split(':');
            const hourNum = parseInt(hours);
            const ampm = hourNum >= 12 ? 'PM' : 'AM';
            const hour12 = hourNum % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
        }
        return timeString;
    };

    const handleEditMeeting = (meeting: MeetingData) => {
        setSelectedMeeting(meeting);
        setIsEditing(true);
    };

    const handleBackToList = () => {
        setSelectedMeeting(null);
        setIsEditing(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedMeeting) return;

        const { name, value } = e.target;
        setSelectedMeeting((prev) => ({ ...prev!, [name]: value }));
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedMeeting) return;

        const value = parseInt(e.target.value);
        setSelectedMeeting((prev) => ({
            ...prev!,
            duration_minutes: isNaN(value) ? 0 : value,
        }));
    };

    const calculateExpiryTime = (date: string, time: string, duration: number) => {
        if (!date || !time || !duration) return "";

        try {
            // Parse the date and time inputs
            const [hours, minutes] = time.split(':').map(Number);

            // Create a Date object for the meeting start time
            const meetingDate = new Date(date);
            meetingDate.setHours(hours, minutes, 0, 0);

            // Create a Date object for the meeting end time by adding duration
            const expiryDate = new Date(meetingDate.getTime() + duration * 60000);

            // Format the end time for display
            // For the display, we'll use a more readable format
            return formatDateTimeForDisplay(expiryDate);
        } catch (error) {
            console.error("Error calculating expiry time:", error);
            return "";
        }
    };

    // Helper function to format date for display
    const formatDateTimeForDisplay = (date: Date): string => {
        try {
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.error("Error formatting date for display:", error);
            return "";
        }
    };
    const calculateNewExpiryTime = (date: string, time: string, duration: number) => {
        if (!date || !time || !duration) return "";

        try {
            const [hours, minutes] = time.split(':').map(Number);
            const meetingDate = new Date(date);
            meetingDate.setHours(hours, minutes);

            // Add duration
            const expiryDate = new Date(meetingDate.getTime() + duration * 60000);

            // Format to local ISO string (without timezone 'Z')
            const year = expiryDate.getFullYear();
            const month = String(expiryDate.getMonth() + 1).padStart(2, '0');
            const day = String(expiryDate.getDate()).padStart(2, '0');
            const hour = String(expiryDate.getHours()).padStart(2, '0');
            const min = String(expiryDate.getMinutes()).padStart(2, '0');

            return `${year}-${month}-${day}T${hour}:${min}:00`;
        } catch (error) {
            console.error("Error calculating expiry time:", error);
            return "";
        }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedMeeting || !batchId || !selectedMeeting._id) return;

        // Calculate expiry time before submission
        const expiryTime = calculateNewExpiryTime(
            selectedMeeting.date,
            selectedMeeting.time,
            selectedMeeting.duration_minutes
        );

        if (!expiryTime) {
            toast.error("Please check your date and time inputs");
            return;
        }

        const dataToSubmit = {
            ...selectedMeeting,
            expiryTime
        };

        setIsSubmitting(true);
        try {
            const result = await updateBatchMeeting(
                batchId as string,
                selectedMeeting._id,
                dataToSubmit
            );

            if (result.success) {
                toast.success("Meeting updated successfully!");
                // Refresh the data
                const refreshResult = await getBatchWithMeetings(batchId as string);
                if (refreshResult.success && refreshResult.data) {
                    setBatchData(refreshResult.data);
                    handleBackToList();
                }
            } else {
                toast.error(result.error || "Failed to update meeting");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!batchId || !selectedMeeting?._id) return;

        setIsDeleting(true);
        try {
            const result = await deleteBatchMeeting(batchId as string, selectedMeeting._id);

            if (result.success) {
                toast.success("Meeting deleted successfully!");
                // Refresh the data
                const refreshResult = await getBatchWithMeetings(batchId as string);
                if (refreshResult.success && refreshResult.data) {
                    setBatchData(refreshResult.data);
                    handleBackToList();
                }
            } else {
                toast.error(result.error || "Failed to delete meeting");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading || !batchData) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin h-12 w-12 rounded-full border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (isEditing && selectedMeeting) {
        return (
            <div className="container mx-auto py-8 px-4 font-Urbanist">
                <Toaster position="top-right" />

                <div className="max-w-2xl mx-auto">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-2xl flex items-center gap-2">
                                        <Calendar className="text-[#082c34]" />
                                        Update Meeting
                                    </CardTitle>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Update meeting details for {batchData.batch_name} batch
                                    </p>
                                </div>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 size={16} className="mr-1" />
                                            Delete Meeting
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="font-Urbanist">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete this meeting? This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDelete}
                                                className="bg-red-600 hover:bg-red-700"
                                                disabled={isDeleting}
                                            >
                                                {isDeleting ? "Deleting..." : "Delete"}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardHeader>

                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-6">
                                {/* Meeting Title */}
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="font-medium">
                                        Meeting Title
                                    </Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={selectedMeeting.title}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., Introduction to React, Weekly Review, etc."
                                        className="mt-1"
                                    />
                                </div>

                                {/* Meeting Link */}
                                <div className="space-y-2">
                                    <Label htmlFor="meeting_link" className="flex items-center gap-2">
                                        <Link size={16} />
                                        <span className="font-medium">Meeting Link</span>
                                    </Label>
                                    <Input
                                        id="meeting_link"
                                        name="meeting_link"
                                        type="url"
                                        value={selectedMeeting.meeting_link}
                                        onChange={handleChange}
                                        required
                                        placeholder="https://zoom.us/j/123456789 or https://meet.google.com/abc-defg-hij"
                                        className="mt-1"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Meeting Date */}
                                    <div className="space-y-2">
                                        <Label htmlFor="date" className="flex items-center gap-2">
                                            <Calendar size={16} />
                                            <span className="font-medium">Meeting Date</span>
                                        </Label>
                                        <Input
                                            id="date"
                                            name="date"
                                            type="date"
                                            value={selectedMeeting.date}
                                            onChange={handleChange}
                                            required
                                            className="mt-1"
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    {/* Meeting Time */}
                                    <div className="space-y-2">
                                        <Label htmlFor="time" className="flex items-center gap-2">
                                            <Clock size={16} />
                                            <span className="font-medium">Start Time</span>
                                        </Label>
                                        <Input
                                            id="time"
                                            name="time"
                                            type="time"
                                            value={selectedMeeting.time}
                                            onChange={handleChange}
                                            required
                                            className="mt-1"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Duration */}
                                    <div className="space-y-2">
                                        <Label htmlFor="duration_minutes" className="flex items-center gap-2">
                                            <Clock3 size={16} />
                                            <span className="font-medium">Duration (minutes)</span>
                                        </Label>
                                        <Input
                                            id="duration_minutes"
                                            name="duration_minutes"
                                            type="number"
                                            value={selectedMeeting.duration_minutes}
                                            onChange={handleDurationChange}
                                            required
                                            min="1"
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Expiry Time (readonly) */}
                                    <div className="space-y-2">
                                        <Label htmlFor="expiryTime" className="flex items-center gap-2">
                                            <CalendarX size={16} />
                                            <span className="font-medium">Meeting End Time</span>
                                        </Label>
                                        <Input
                                            id="expiryTime"
                                            name="expiryTime"
                                            value={calculateExpiryTime(
                                                selectedMeeting.date,
                                                selectedMeeting.time,
                                                selectedMeeting.duration_minutes
                                            ) || "Will be calculated automatically"}
                                            readOnly
                                            className="mt-1 bg-gray-100"
                                        />
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="flex justify-between border-t pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBackToList}
                                >
                                    Back to List
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-[#082c34] hover:bg-[#093a45]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full"></div>
                                            Updating...
                                        </>
                                    ) : (
                                        "Update Meeting"
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        );
    }

    // Meeting selection view
    return (
        <div className="container mx-auto py-8 px-4 font-Urbanist">
            <Toaster position="top-right" />

            <div className="max-w-4xl mx-auto">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Calendar className="text-[#082c34]" />
                            Edit Meetings for {batchData.batch_name}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                            Select a meeting to edit or delete
                        </p>
                    </CardHeader>

                    <CardContent>
                        {batchData.scheduled_meetings.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No scheduled meetings found</p>
                                
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {batchData.scheduled_meetings.map((meeting) => (
                                    <div
                                        key={meeting._id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                        onClick={() => handleEditMeeting(meeting)}
                                    >
                                        <div>
                                            <h3 className="font-medium">{meeting.title}</h3>
                                            <p className="text-sm text-gray-500">
                                                {formatDate(meeting.date)} at {formatTime(meeting.time)} • {meeting.duration_minutes} mins
                                            </p>
                                        </div>
                                        <ChevronRight className="text-gray-400" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex justify-between border-t pt-6">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/dashboard/manageBatch`)}
                        >
                            Back to Batch
                        </Button>
                       
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}

// This ensures we don't import useSearchParams at the top level
import { useSearchParams } from "next/navigation";

// Main component that provides the Suspense boundary
export default function EditMeetingPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin h-12 w-12 rounded-full border-t-2 border-b-2 border-gray-900"></div>
            </div>
        }>
            <EditMeetingContent />
        </Suspense>
    );
}