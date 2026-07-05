import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  const mergedOptions = { ...defaultOptions, ...options };

  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  if (isNaN(date.getTime())) {
    console.error('Invalid date:', dateString);
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat('en-US', mergedOptions).format(date);
}

// Optional: Add some preset formats
formatDate.short = (dateString: string | Date) =>
  formatDate(dateString, { month: 'short', day: 'numeric' });

formatDate.long = (dateString: string | Date) =>
  formatDate(dateString, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

formatDate.time = (dateString: string | Date) =>
  formatDate(dateString, {
    hour: '2-digit',
    minute: '2-digit'
  });
