"use client"
import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  format,
  parseISO,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getDay
} from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  ArrowUpRight,
  MapPin,
  User,
  Circle,
  Star,
  Tag
} from "lucide-react";
import EventDetailModal from "../../components/events/userEventModel";
import { fetchEvents, fetchEventById, type Event } from "../../../apiCalls/fetchEvents";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear + i - 2).map(String);

const EventsCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("month");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const monthName = months[currentDate.getMonth()];
  const year = currentDate.getFullYear().toString();

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const currentMonthName = format(currentDate, 'MMMM');
        const currentYear = format(currentDate, 'yyyy');
        const eventsData = await fetchEvents(currentMonthName, currentYear);
        setEvents(eventsData);
      } catch (error) {
        toast.error("Failed to load events");
        console.error("Error loading events:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    loadEvents();
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleMonthChange = (value: string) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(months.indexOf(value));
    setCurrentDate(newDate);
  };

  const handleYearChange = (value: string) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(parseInt(value));
    setCurrentDate(newDate);
  };

  const handleEventClick = async (eventId: string) => {
    try {
      setIsLoading(true);
      const eventData = await fetchEventById(eventId);
      if (eventData) {
        setSelectedEvent(eventData);
        setIsModalOpen(true);
      }
    } catch (error) {
      toast.error("Failed to load event details");
      console.error("Error loading event details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowMoreEvents = (day: Date, dayEvents: Event[]) => {
    setSelectedDay(day);
    setSelectedDayEvents(dayEvents);
  };

  const getMonthEvents = () => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date);
      return eventDate.getMonth() === currentDate.getMonth() && 
            eventDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const getEventColor = (event: Event) => {
    const colors = {
      default: {
        bg: "bg-blue-50",
        text: "text-blue-800",
        border: "border-blue-200",
        dot: "bg-blue-600",
        gradient: "from-blue-50 to-blue-100"
      }
    };
    
    return colors[event.priority as keyof typeof colors] || colors.default;
  };

  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const startDay = getDay(monthStart);
    
    const daysFromPrevMonth = startDay;
    const prevMonthDays = [];
    if (daysFromPrevMonth > 0) {
      for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
        const day = new Date(monthStart);
        day.setDate(day.getDate() - i - 1);
        prevMonthDays.push(day);
      }
    }
    
    const totalDaysDisplayed = Math.ceil((daysInMonth.length + startDay) / 7) * 7;
    const daysFromNextMonth = totalDaysDisplayed - daysInMonth.length - startDay;
    const nextMonthDays = [];
    if (daysFromNextMonth > 0) {
      for (let i = 0; i < daysFromNextMonth; i++) {
        const day = new Date(monthEnd);
        day.setDate(day.getDate() + i + 1);
        nextMonthDays.push(day);
      }
    }
    
    const eventsByDay: Record<string, Event[]> = {};
    getMonthEvents().forEach(event => {
      const eventDate = format(parseISO(event.start_date), 'yyyy-MM-dd');
      if (!eventsByDay[eventDate]) {
        eventsByDay[eventDate] = [];
      }
      eventsByDay[eventDate].push(event);
    });

    const allDays = [...prevMonthDays, ...daysInMonth, ...nextMonthDays];

    return (
      <div className="grid grid-cols-7 gap-px bg-blue-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
          <div key={index} className="text-center font-medium py-2 text-blue-700 bg-blue-50 text-xs sm:text-sm">
            {day}
          </div>
        ))}
        
        {allDays.map((day, index) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDay[dayKey] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          const isWeekend = getDay(day) === 0 || getDay(day) === 6;
          
          return (
            <div
              key={index}
              className={`min-h-16 xs:min-h-24 sm:min-h-28 md:min-h-32 lg:min-h-36 ${isCurrentMonth ? 'bg-white' : 'bg-blue-50'} 
                ${isCurrentDay ? 'ring-2 ring-blue-500' : ''} 
                ${isWeekend && isCurrentMonth ? 'bg-blue-50/30' : ''}
                ${!isCurrentMonth ? 'opacity-60' : ''}`}
            >
              <div className="p-0.5 xs:p-1 h-full flex flex-col">
                <div className="flex justify-between items-center mb-0.5 xs:mb-1">
                  <div 
                    className={`w-5 h-5 xs:w-6 xs:h-6 flex items-center justify-center rounded-full text-xs
                        ${isCurrentDay 
                          ? 'bg-blue-600 text-white font-medium' 
                          : isWeekend && isCurrentMonth
                            ? 'text-blue-800 bg-blue-100'
                            : !isCurrentMonth
                              ? 'text-blue-400'
                              : 'text-blue-800'
                        }`}
                  >
                    {format(day, 'd')}
                  </div>
                  {dayEvents.length > 0 && isCurrentMonth && (
                    <div className="text-xs px-1 h-4 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 hidden xs:flex">
                      {dayEvents.length}
                    </div>
                  )}
                </div>
                
                {isCurrentMonth && (
                  <div className="space-y-0.5 xs:space-y-1 flex-grow overflow-hidden">
                    {dayEvents.slice(0, 1).map((event, i) => {
                      const colorScheme = getEventColor(event);
                      return (
                        <div
                          key={i}
                          onClick={() => handleEventClick(event._id)}
                          className={`flex items-center text-2xs xs:text-xs p-0.5 xs:p-1 rounded cursor-pointer transition-all hover:shadow-md 
                          bg-gradient-to-r ${colorScheme.gradient} ${colorScheme.text} border ${colorScheme.border}`}
                        >
                          <div className={`w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full ${colorScheme.dot} mr-0.5 xs:mr-1 flex-shrink-0`}></div>
                          <div className="truncate text-2xs xs:text-xs">
                            {format(parseISO(event.start_date), 'h:mm')} {event.title}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Only show the second event on larger screens */}
                    {dayEvents.length > 1 && (
                      <div className="hidden sm:block">
                        {dayEvents.slice(1, 2).map((event, i) => {
                          const colorScheme = getEventColor(event);
                          return (
                            <div
                              key={i}
                              onClick={() => handleEventClick(event._id)}
                              className={`flex items-center text-2xs xs:text-xs p-0.5 xs:p-1 rounded cursor-pointer transition-all hover:shadow-md 
                              bg-gradient-to-r ${colorScheme.gradient} ${colorScheme.text} border ${colorScheme.border}`}
                            >
                              <div className={`w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full ${colorScheme.dot} mr-0.5 xs:mr-1 flex-shrink-0`}></div>
                              <div className="truncate text-2xs xs:text-xs">
                                {format(parseISO(event.start_date), 'h:mm')} {event.title}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {((dayEvents.length > 1 && window.innerWidth < 640) || dayEvents.length > 2) && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            onClick={() => handleShowMoreEvents(day, dayEvents)}
                            className="flex items-center justify-center text-2xs xs:text-xs text-blue-600 hover:text-blue-800 w-full pb-0.5 xs:pb-1"
                          >
                            {window.innerWidth < 640 ? 
                              `+${dayEvents.length - 1}` : 
                              `+${dayEvents.length - 2}`}
                            <ArrowUpRight className="h-2 w-2 xs:h-2.5 xs:w-2.5 ml-0.5 xs:ml-1" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 sm:w-80 p-0 shadow-xl border-blue-200 rounded-lg">
                          <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-100 to-blue-50 rounded-t-lg">
                            <h4 className="text-xs sm:text-sm font-medium text-blue-900 flex items-center">
                              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-2 text-blue-600" />
                              Events on {format(day, 'MMMM d, yyyy')}
                            </h4>
                          </div>
                          <div className="p-2 max-h-60 sm:max-h-72 overflow-y-auto bg-white rounded-b-lg">
                            <div className="space-y-1.5">
                              {dayEvents.map((event, i) => {
                                const colorScheme = getEventColor(event);
                                return (
                                  <div
                                    key={i}
                                    onClick={() => handleEventClick(event._id)}
                                    className={`p-2 rounded-lg cursor-pointer hover:shadow-md transition-all 
                                    bg-gradient-to-r ${colorScheme.gradient} ${colorScheme.text} border ${colorScheme.border}
                                    hover:translate-y-[-1px]`}
                                  >
                                    <div className="font-medium text-xs sm:text-sm">{event.title}</div>
                                    <div className="text-2xs xs:text-xs flex items-center mt-1.5">
                                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                      {format(parseISO(event.start_date), 'h:mm a')} - {format(parseISO(event.end_date), 'h:mm a')}
                                    </div>
                                    {event.location && (
                                      <div className="text-2xs xs:text-xs mt-1 flex items-center">
                                        <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> {event.location}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderEventList = () => {
    
    const eventsByDate: Record<string, Event[]> = {};
    events.forEach(event => {
      const eventDate = format(parseISO(event.start_date), 'yyyy-MM-dd');
      if (!eventsByDate[eventDate]) {
        eventsByDate[eventDate] = [];
      }
      eventsByDate[eventDate].push(event);
    });

    const sortedDates = Object.keys(eventsByDate).sort();

    return (
      <div className="space-y-4">
        {sortedDates.length > 0 ? (
          sortedDates.map(date => (
            <Card key={date} className="overflow-hidden shadow-sm border border-none p-0 rounded-none">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 p-2 sm:p-3">
                <div className="flex items-center">
                  <div className="bg-white p-1.5 sm:p-2 px-2 sm:px-4 rounded-lg shadow-sm mr-2 sm:mr-3 border border-blue-100">
                    <div className="text-base sm:text-xl font-bold text-blue-600">
                      {format(new Date(date), 'd')}
                    </div>
                    <div className="text-2xs xs:text-xs text-blue-500 uppercase tracking-wide">
                      {format(new Date(date), 'MMM')}
                    </div>
                  </div>
                  <h3 className="text-blue-900">
                    <span className="text-sm sm:text-lg font-medium">{format(new Date(date), 'EEEE')}</span>
                    <div className="text-xs sm:text-sm opacity-80">{format(new Date(date), 'MMMM d, yyyy')}</div>
                  </h3>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-blue-100 bg-white">
                {eventsByDate[date].map(event => {
                  const colorScheme = getEventColor(event);
                  return (
                    <div 
                      key={event._id}
                      onClick={() => handleEventClick(event._id)}
                      className="p-2 sm:p-3 hover:bg-blue-50 cursor-pointer transition-all"
                    >
                      <div className="flex items-start">
                        <div className={`w-1 self-stretch ${colorScheme.dot} mr-2 sm:mr-3 rounded-full`}></div>
                        <div className="flex-grow">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                            <h4 className="font-medium text-sm sm:text-base text-black">{event.title}</h4>
                            <div className="text-2xs xs:text-xs bg-blue-100 px-2 py-1 rounded-full text-blue-700 mt-1 sm:mt-0 inline-block sm:inline">
                              {format(parseISO(event.start_date), 'h:mm a')}
                            </div>
                          </div>
                          {event.description && (
                            <div className="text-2xs xs:text-xs text-[#3e3e3e] mt-1 line-clamp-2">
                              {event.description}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
                            <div className="text-2xs xs:text-xs text-blue-700 flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-50 rounded-full">
                              <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 text-blue-500" />
                              <span>{event.organizer.name}</span>
                            </div>
                            {event.location && (
                              <div className="text-2xs xs:text-xs text-blue-700 flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-50 rounded-full">
                                <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 text-blue-500" />
                                <span className="truncate max-w-20 sm:max-w-none">{event.location}</span>
                              </div>
                            )}
                            <div className="text-2xs xs:text-xs text-blue-700 flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-50 rounded-full">
                              <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 text-blue-500" />
                              <span>{event.event_type}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-10 sm:py-16 bg-blue-50 rounded-lg">
            <div className="bg-white w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center rounded-full mb-3 sm:mb-4 shadow-sm border border-blue-100">
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500" />
            </div>
            <p className="text-sm sm:text-base text-blue-700">No events found for the selected criteria</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
    <Navbar/>
    <div className="w-full min-h-screen bg-white font-Urbanist">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center mb-1 sm:mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-black">Events</h1>
          </div>
          <p className="text-sm sm:text-base text-black">
            Discover exciting events happening in your community
          </p>
        </div>

        <div className="bg-white shadow-md border border-blue-100 overflow-hidden">
          <div className="p-2 sm:p-4 border-b border-blue-100 bg-white">
            {/* Calendar Controls */}
            <div className="flex flex-col space-y-4 mb-4">
              {/* Month navigation */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Button 
                  onClick={handleToday} 
                  variant="outline"
                  className="h-7 sm:h-9 px-2 sm:px-4 text-xs sm:text-sm rounded-md bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700"
                >
                  Today
                </Button>
                <div className="flex items-center rounded-md bg-white overflow-hidden h-7 sm:h-9 border border-blue-200">
                  <Button 
                    onClick={handlePrevMonth} 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 sm:h-9 w-7 sm:w-9 rounded-none text-blue-700 hover:bg-blue-50"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <div className="px-2 sm:px-3 text-xs sm:text-sm font-medium text-blue-900">
                    {format(currentDate, 'MMM')}
                  </div>
                  <Button 
                    onClick={handleNextMonth} 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 sm:h-9 w-7 sm:w-9 rounded-none text-blue-700 hover:bg-blue-50"
                  >
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
                <h2 className="text-base sm:text-xl font-semibold ml-0 sm:ml-1 text-blue-900">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
              </div>
              
              {/* View mode and date selection */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="border border-blue-200 rounded-md bg-blue-50">
                  <Tabs defaultValue={viewMode} onValueChange={(value) => setViewMode(value as "month" | "list")}>
                    <TabsList className="grid grid-cols-2 h-7 sm:h-9 bg-transparent gap-1">
                      <TabsTrigger value="month" className="text-2xs xs:text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 rounded-sm">
                        Month View
                      </TabsTrigger>
                      <TabsTrigger value="list" className="text-2xs xs:text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 rounded-sm">
                        List View
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={monthName} onValueChange={handleMonthChange}>
                    <SelectTrigger className="w-24 sm:w-36 h-7 sm:h-9 text-xs sm:text-sm border-blue-200 bg-white rounded-md">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      {months.map(month => (
                        <SelectItem key={month} value={month} className="text-xs sm:text-sm">
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={year} onValueChange={handleYearChange}>
                    <SelectTrigger className="w-20 sm:w-28 h-7 sm:h-9 text-xs sm:text-sm border-blue-200 bg-white rounded-md">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md">
                      {years.map(year => (
                        <SelectItem key={year} value={year} className="text-xs sm:text-sm">
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-b-lg">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center h-48 sm:h-96">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-2 border-blue-600 border-t-transparent"></div>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-blue-700">Loading your events...</p>
              </div>
            ) : viewMode === "month" ? (
              <div className="p-0 overflow-auto">
                {renderCalendarDays()}
              </div>
            ) : (
              <div className="p-1 sm:p-0">
                {renderEventList()}
              </div>
            )}
          </div>
        </div>
        
        <EventDetailModal 
          event={selectedEvent} 
          isOpen={isModalOpen} 
          onOpenChange={setIsModalOpen} 
        />
      </div>
    </div>
    <Footer/>
    </>
  );
};

export default EventsCalendar;