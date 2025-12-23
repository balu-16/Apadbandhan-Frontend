import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a relative time string (e.g., "5 minutes ago")
 */
export function formatTimeAgo(date: string | undefined): string {
  if (!date) return "Never";

  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/**
 * Format a date string to a localized date (e.g., "23 Dec 2024")
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get color class based on status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'online': return 'bg-green-500/20 text-green-500';
    case 'offline': return 'bg-red-500/20 text-red-500';
    case 'available': return 'bg-green-500/20 text-green-500';
    case 'assigned': return 'bg-orange-500/20 text-orange-500';
    default: return 'bg-gray-500/20 text-gray-500';
  }
}

/**
 * Get battery color class based on level
 */
export function getBatteryColor(level: number): string {
  if (level >= 60) return 'text-green-500';
  if (level >= 30) return 'text-yellow-500';
  return 'text-red-500';
}
