// app/batches/schedule-meeting/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, Clock, Link, Clock3, CalendarX } from "lucide-react";
import { scheduleBatchMeeting } from "../../../../apiCalls/addMeetings";

// Loading component
const LoadingState = () => (
    <div className="container mx-auto py-8 px-4 font-Urbanist">
        <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg min-h-[400px] flex justify-center items-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-500">Loading meeting form...</p>
                </div>
            </Card>
        </div>
    </div>
);

// Meeting form content that uses searchParams
function MeetingFormContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const batchId = searchParams.get("batchId");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [meetingData, setMeetingData] = useState({
        title: "",
        meeting_link: "",
        date: "",
        time: "",
        expiryTime: "",
        duration_minutes: 60,
    });

    useEffect(() => {
        if (!batchId) {
            toast.error("No batch ID provided");
            router.push("/batches");
        }
    }, [batchId, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMeetingData((prev) => ({ ...prev, [name]: value }));
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        setMeetingData((prev) => ({ ...prev, duration_minutes: isNaN(value) ? 0 : value }));
    };

    // Fixed function to properly calculate end time
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


    // Function to get ISO string for API submission
    const getISOExpiryTime = (date: string, time: string, duration: number): string => {
        if (!date || !time || !duration) return "";

        try {
            const [hours, minutes] = time.split(':').map(Number);
            const meetingDate = new Date(date);
            meetingDate.setHours(hours, minutes, 0, 0);

            const expiryDate = new Date(meetingDate.getTime() + duration * 60000);
            return expiryDate.toISOString();
        } catch (error) {
            console.error("Error calculating ISO expiry time:", error);
            return "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!batchId) return;

        // Calculate expiry time in ISO format for API submission
        const expiryTime = calculateNewExpiryTime(
            meetingData.date,
            meetingData.time,
            meetingData.duration_minutes
        );

        if (!expiryTime) {
            toast.error("Please check your date and time inputs");
            return;
        }

        const dataToSubmit = {
            ...meetingData,
            expiryTime
        };

        setIsSubmitting(true);
        try {
            const result = await scheduleBatchMeeting(batchId, dataToSubmit);

            if (result.success) {
                toast.success("Meeting scheduled successfully!");
                router.push(`/dashboard/manageBatch`);
            } else {
                toast.error(result.error || "Failed to schedule meeting");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!batchId) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Invalid Batch</h2>
                    <p className="text-gray-600 mb-6">No batch ID provided or batch not found.</p>
                    <Button onClick={() => router.push("/batches")}>Back to Batches</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 font-Urbanist">
            <div className="max-w-2xl mx-auto">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Calendar className="text-blue-600" />
                            Schedule New Meeting
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                            Fill in the details below to schedule a meeting for this batch
                        </p>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            {/* Meeting Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title" className="flex items-center gap-2">
                                    <span className="font-medium">Meeting Title</span>
                                </Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={meetingData.title}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Introduction to React, Weekly Review, etc."
                                    className="mt-1"
                                />
                                <p className="text-sm text-gray-500">
                                    A descriptive title for the meeting that participants will see
                                </p>
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
                                    value={meetingData.meeting_link}
                                    onChange={handleChange}
                                    required
                                    placeholder="https://zoom.us/j/123456789 or https://meet.google.com/abc-defg-hij"
                                    className="mt-1"
                                />
                                <p className="text-sm text-gray-500">
                                    The URL where participants will join the meeting
                                </p>
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
                                        value={meetingData.date}
                                        onChange={handleChange}
                                        required
                                        className="mt-1"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    <p className="text-sm text-gray-500">
                                        Select the date when the meeting will occur
                                    </p>
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
                                        value={meetingData.time}
                                        onChange={handleChange}
                                        required
                                        className="mt-1"
                                    />
                                    <p className="text-sm text-gray-500">
                                        The time when the meeting will start
                                    </p>
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
                                        value={meetingData.duration_minutes}
                                        onChange={handleDurationChange}
                                        required
                                        min="1"
                                        className="mt-1"
                                    />
                                    <p className="text-sm text-gray-500">
                                        How long the meeting will last (in minutes)
                                    </p>
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
                                        value={
                                            meetingData.date && meetingData.time
                                                ? calculateExpiryTime(
                                                    meetingData.date,
                                                    meetingData.time,
                                                    meetingData.duration_minutes
                                                )
                                                : "Will be calculated automatically"
                                        }
                                        readOnly
                                        className="mt-1 bg-gray-50"
                                    />
                                    <p className="text-sm text-gray-500">
                                        Calculated based on start time and duration
                                    </p>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex justify-between border-t pt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push(`/dashboard/manageBatch`)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-[#082c34] hover:bg-[#294349]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full"></div>
                                        Scheduling...
                                    </>
                                ) : (
                                    "Schedule Meeting"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}

// Main component that wraps everything in a Suspense boundary
export default function ScheduleMeetingPage() {
    return (
        <>
            <Toaster position="top-right" />
            <Suspense fallback={<LoadingState />}>
                <MeetingFormContent />
            </Suspense>
        </>
    );
}