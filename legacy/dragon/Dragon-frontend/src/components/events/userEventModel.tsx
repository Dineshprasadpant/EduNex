import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Tag,
  Info,
  FileText,
  File as FileIcon
} from "lucide-react";

// Define proper TypeScript interfaces
interface Venue {
  name: string;
  address: string;
}

interface Organizer {
  name: string;
  email: string;
  phone?: string;
}

interface ResourceMaterial {
  materialName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

interface ExtraInformation {
  title?: string;
  description?: string;
}

interface Event {
  _id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  event_type?: string;
  location?: string;
  venue?: Venue;
  organizer: Organizer;
  extraInformation?: ExtraInformation[];
  resourceMaterials?: ResourceMaterial[];
  updatedAt?: string;
  priority?: string;
}

interface EventDetailModalProps {
  event: Event | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const EventDetailModal = ({ event, isOpen, onOpenChange }: EventDetailModalProps) => {
  const [screenWidth, setScreenWidth] = useState<number>(0);
  
  // Track window size for responsive adjustments
  useEffect(() => {
    // Safe check for window object (to avoid SSR issues)
    if (typeof window !== 'undefined') {
      // Set initial width
      setScreenWidth(window.innerWidth);
      
      // Add resize handler
      const handleResize = () => {
        setScreenWidth(window.innerWidth);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Clean up
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);
  
  if (!event) return null;

  // Format utilities
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'h:mm a');
    } catch (e) {
      return 'Invalid time';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Add safety checks for nested objects
  const venueInfo = event.venue || { name: 'Unknown venue', address: 'No address provided' };
  const organizerInfo = event.organizer || { name: 'Unknown organizer', email: 'No email provided' };

  // Safely access venue and organizer properties
  const venueName = typeof venueInfo === 'object' ? venueInfo.name || 'Unknown venue' : 'Invalid venue data';
  const venueAddress = typeof venueInfo === 'object' ? venueInfo.address || 'No address provided' : '';

  const organizerName = typeof organizerInfo === 'object' ? organizerInfo.name || 'Unknown organizer' : 'Invalid organizer data';
  const organizerEmail = typeof organizerInfo === 'object' ? organizerInfo.email || 'No email provided' : '';
  const organizerPhone = typeof organizerInfo === 'object' && organizerInfo.phone ? organizerInfo.phone : '';

  // Check if dates are different days
  const isDifferentDays = () => {
    try {
      return format(parseISO(event.start_date), 'yyyy-MM-dd') !== format(parseISO(event.end_date), 'yyyy-MM-dd');
    } catch (e) {
      return false;
    }
  };

  // Get dimensions for extra small devices
  const isExtraSmall = screenWidth < 450;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`
        w-[95vw] max-h-[90vh] overflow-y-auto
        ${isExtraSmall ? 'max-w-xs' : 'max-w-md sm:max-w-lg md:max-w-xl'}
        rounded-lg border border-blue-100 shadow-lg p-0 font-Urbanist mx-auto
      `}>
        {/* Header Section with Gradient Background */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 sm:p-4 md:p-6">
          <div className="mb-2 sm:mb-4 md:mb-6">
            <div className="bg-white inline-flex px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium text-blue-600 mb-2 sm:mb-3 border border-blue-100">
              <Tag className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
              {event.event_type || 'Event'}
            </div>
            <DialogHeader className="space-y-1 sm:space-y-2">
              <DialogTitle className="text-lg sm:text-xl md:text-2xl font-semibold text-blue-900 leading-tight">
                {event.title || 'Event Details'}
              </DialogTitle>
              <p className="text-xs sm:text-sm text-blue-700 font-normal line-clamp-3 sm:line-clamp-none">
                {event.description || 'No description available'}
              </p>
            </DialogHeader>
          </div>

          {/* Date & Time */}
          <div className="flex flex-wrap gap-2 sm:gap-4 mb-2 sm:mb-4">
            <div className="flex items-center bg-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-sm border border-blue-100">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 mr-1.5 sm:mr-2 flex-shrink-0" />
              <div className="text-xs sm:text-sm text-blue-800">
                <div className="font-medium">{formatDate(event.start_date)}</div>
                {isDifferentDays() && (
                  <div className="text-xs text-blue-600">
                    to {formatDate(event.end_date)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center bg-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-sm border border-blue-100">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 mr-1.5 sm:mr-2 flex-shrink-0" />
              <div className="text-xs sm:text-sm text-blue-800">
                <div className="font-medium">{formatTime(event.start_date)}</div>
                <div className="text-xs text-blue-600">
                  to {formatTime(event.end_date)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-3 sm:p-4 md:p-6 bg-white">
          {/* Venue & Organizer Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Venue Information */}
            <div className="space-y-1 sm:space-y-2">
              <h3 className="text-xs sm:text-sm font-medium text-blue-800 flex items-center">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-500 flex-shrink-0" />
                Venue
              </h3>
              <div className="bg-blue-50 rounded-lg p-2 sm:p-4 border border-blue-100">
                <div className="text-xs sm:text-sm font-medium text-blue-800">
                  {venueName}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {venueAddress}
                </div>
              </div>
            </div>

            {/* Organizer Information */}
            <div className="space-y-1 sm:space-y-2 mt-3 sm:mt-0">
              <h3 className="text-xs sm:text-sm font-medium text-blue-800 flex items-center">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-500 flex-shrink-0" />
                Organizer
              </h3>
              <div className="bg-blue-50 rounded-lg p-2 sm:p-4 space-y-1 sm:space-y-2 border border-blue-100">
                <div className="text-xs sm:text-sm font-medium text-blue-800">
                  {organizerName}
                </div>
                <div className="flex items-center text-xs text-blue-600">
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-500 flex-shrink-0" />
                  <span className="truncate max-w-32 sm:max-w-full overflow-hidden break-all">{organizerEmail}</span>
                </div>
                {organizerPhone && (
                  <div className="flex items-center text-xs text-blue-600">
                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-500 flex-shrink-0" />
                    {organizerPhone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Extra Information */}
          {event.extraInformation && Array.isArray(event.extraInformation) && event.extraInformation.length > 0 && (
            <div className="mt-3 sm:mt-4 md:mt-6">
              <h3 className="text-xs sm:text-sm font-medium text-blue-800 flex items-center mb-1 sm:mb-2">
                <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-500 flex-shrink-0" />
                Additional Information
              </h3>
              <div className="bg-blue-50 rounded-lg p-2 sm:p-4 border border-blue-100">
                <ul className="space-y-2 text-xs sm:text-sm text-blue-700">
                  {(event.extraInformation as ExtraInformation[]).map((info, index) => (
                    <li key={index} className="flex flex-col items-start">
                      {info.title && (
                        <span className="font-medium text-blue-800">{info.title}</span>
                      )}
                      {info.description && (
                        <span className="text-blue-600 text-xs">{info.description}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Resource Materials */}
          {event.resourceMaterials && Array.isArray(event.resourceMaterials) && event.resourceMaterials.length > 0 && (
            <div className="mt-3 sm:mt-4 md:mt-6">
              <h3 className="text-xs sm:text-sm font-medium text-blue-800 flex items-center mb-1 sm:mb-2">
                <FileIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-500 flex-shrink-0" />
                Resource Materials
              </h3>
              <div className="bg-blue-50 rounded-lg p-2 sm:p-4 border border-blue-100">
                <ul className="space-y-2 sm:space-y-3">
                  {event.resourceMaterials.map((resource, index) => (
                    <li key={index} className="flex items-start">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:underline w-full group"
                      >
                        <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-blue-500 flex-shrink-0 group-hover:text-blue-700" />
                        <div className="overflow-hidden w-full">
                          <div className="font-medium truncate">{resource.materialName}</div>
                          <div className="text-xs text-blue-500 group-hover:text-blue-600">
                            {resource.fileType.toUpperCase()} • {formatFileSize(resource.fileSize)}
                          </div>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <Separator className="my-3 sm:my-5 bg-blue-100" />

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="text-xs text-blue-500 mt-2 sm:mt-0 text-center sm:text-left">
              Last updated: {event.updatedAt ? formatDate(event.updatedAt) : 'Unknown'}
            </div>
            <DialogClose asChild>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto h-9 px-3 sm:px-4 py-0 text-xs sm:text-sm border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
              >
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal;