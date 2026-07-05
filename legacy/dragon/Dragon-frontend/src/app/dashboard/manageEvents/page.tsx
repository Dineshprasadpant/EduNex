"use client";
import { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
    getEventsByMonthAndYear,
    getEventById,
    updateEvent,
    deleteEvent,
    handleApiError,
} from "../../../../apiCalls/manageEvents";
import { format, parseISO, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import EventModal from "../../../components/events/eventModal";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeft, ArrowRight } from "lucide-react";

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear + i).map(String);

export default function ManageEvents() {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedDayEvents, setSelectedDayEvents] = useState<any[]>([]);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    const monthName = months[currentDate.getMonth()];
    const year = currentDate.getFullYear().toString();

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            try {
                const eventsData = await getEventsByMonthAndYear(monthName, year);
                setEvents(eventsData);
            } catch (error) {
                handleApiError(error, "Failed to load events");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, [monthName, year]);

    const handlePrevMonth = () => {
        setCurrentDate(subMonths(currentDate, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(months.indexOf(e.target.value));
        setCurrentDate(newDate);
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDate = new Date(currentDate);
        newDate.setFullYear(parseInt(e.target.value));
        setCurrentDate(newDate);
    };

    const handleEventClick = async (eventId: string) => {
        try {
            setIsLoading(true);
            const event = await getEventById(eventId);
            setSelectedEvent(event);
            setIsModalOpen(true);
        } catch (error) {
            handleApiError(error, "Failed to load event details");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateEvent = async (updatedEvent: any) => {
        try {
            setIsLoading(true);
            const result = await updateEvent(updatedEvent._id, updatedEvent);
            setEvents(events.map(e => e._id === result._id ? result : e));
            setSelectedEvent(result);
            setIsEditing(false);
            toast.success("Event updated successfully!");
        } catch (error) {
            handleApiError(error, "Failed to update event");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;
        
        try {
            setIsLoading(true);
            await deleteEvent(selectedEvent._id);
            setEvents(events.filter(e => e._id !== selectedEvent._id));
            setIsModalOpen(false);
            toast.success("Event deleted successfully!");
        } catch (error) {
            handleApiError(error, "Failed to delete event");
        } finally {
            setIsLoading(false);
        }
    };

    const handleShowMoreEvents = (day: Date, dayEvents: any[]) => {
        setSelectedDay(day);
        setSelectedDayEvents(dayEvents);
    };

    const renderCalendarDays = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // Group events by day
        const eventsByDay: { [key: string]: any[] } = {};
        events.forEach(event => {
            const eventDate = format(parseISO(event.start_date), 'yyyy-MM-dd');
            if (!eventsByDay[eventDate]) {
                eventsByDay[eventDate] = [];
            }
            eventsByDay[eventDate].push(event);
        });

        return (
            <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-medium py-2 bg-gray-100">
                        {day}
                    </div>
                ))}
                
                {daysInMonth.map(day => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const dayEvents = eventsByDay[dayKey] || [];
                    
                    return (
                        <div
                            key={day.toString()}
                            className={`min-h-24 p-1 border border-gray-200 ${isSameMonth(day, currentDate) ? 'bg-white' : 'bg-gray-50'}`}
                        >
                            <div className={`text-right p-1 ${isSameDay(day, new Date()) ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center ml-auto' : ''}`}>
                                {format(day, 'd')}
                            </div>
                            <div className="space-y-1 mt-1">
                                {dayEvents.slice(0, 2).map(event => (
                                    <div
                                        key={event._id}
                                        onClick={() => handleEventClick(event._id)}
                                        className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate cursor-pointer hover:bg-blue-200"
                                    >
                                        {event.title}
                                    </div>
                                ))}
                                {dayEvents.length > 2 && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button
                                                onClick={() => handleShowMoreEvents(day, dayEvents)}
                                                className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                                            >
                                                +{dayEvents.length - 2} more
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 font-Urbanist">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">
                                                    Events on {format(day, 'MMMM d, yyyy')}
                                                </h4>
                                                <div className="space-y-1">
                                                    {dayEvents.map(event => (
                                                        <div
                                                            key={event._id}
                                                            onClick={() => handleEventClick(event._id)}
                                                            className="text-sm p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                                                        >
                                                            <div className="font-medium">{event.title}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {format(parseISO(event.start_date), 'h:mm a')} - {format(parseISO(event.end_date), 'h:mm a')}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4 h-screen">
            <Toaster position="top-right" />
            
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Event Management</h1>
                <p className="text-gray-600">
                    View, edit, and manage all your events in one place. Click on any event to see details.
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4">
                        <Button onClick={handleToday} variant="outline">
                            Today
                        </Button>
                        <Button onClick={handlePrevMonth} variant="ghost" size="icon" className="bg-gray-100">
                            <ArrowLeft/>
                        </Button>
                        <Button onClick={handleNextMonth} variant="ghost" size="icon" className="bg-gray-100">
                        <ArrowRight/>
                        </Button>
                        <h2 className="text-xl font-semibold">
                            {format(currentDate, 'MMMM yyyy')}
                        </h2>
                    </div>
                    <div className="flex space-x-2">
                        <select
                            value={monthName}
                            onChange={handleMonthChange}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        >
                            {months.map(month => (
                                <option key={month} value={month}>{month}</option>
                            ))}
                        </select>
                        <select
                            value={year}
                            onChange={handleYearChange}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    renderCalendarDays()
                )}
            </div>

            {isModalOpen && selectedEvent && (
                <EventModal
                    event={selectedEvent}
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setIsEditing(false);
                    }}
                    onUpdate={handleUpdateEvent}
                    onDelete={handleDeleteEvent}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
}