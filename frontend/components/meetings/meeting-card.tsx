'use client';

/**
 * Premium MeetingCard Component
 * Fireflies.ai-style card with animations, avatars, badges
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Clock,
  Calendar,
  Users,
  Star,
  Download,
  Share2,
  Archive,
  Trash2,
  MoreVertical,
  Video,
} from 'lucide-react';
import { format, formatDistance } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';
import type { Meeting } from '@/types/meeting';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MeetingCardProps {
  meeting: Meeting;
  locale?: 'en' | 'ru';
  onStar?: (meeting: Meeting) => void;
  onShare?: (meeting: Meeting) => void;
  onDownload?: (meeting: Meeting) => void;
  onArchive?: (meeting: Meeting) => void;
  onDelete?: (meeting: Meeting) => void;
}

// Status color mapping
const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Completed' },
  processing: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Processing' },
  recording: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: 'Recording' },
  failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Failed' },
  pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Pending' },
  archived: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-400', label: 'Archived' },
  deleted: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-400', label: 'Deleted' },
};

// Platform color mapping
const PLATFORM_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  google_meet: { bg: 'bg-green-500', text: 'text-white', icon: '#0F9D58' },
  microsoft_teams: { bg: 'bg-blue-500', text: 'text-white', icon: '#6264A7' },
  zoom: { bg: 'bg-blue-600', text: 'text-white', icon: '#2D8CFF' },
};

// Generate color from string (for avatars)
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 50%)`;
};

export function MeetingCard({
  meeting,
  locale = 'en',
  onStar,
  onShare,
  onDownload,
  onArchive,
  onDelete,
}: MeetingCardProps) {
  const dateLocale = locale === 'ru' ? ru : enUS;
  const statusInfo = STATUS_COLORS[meeting.status] || STATUS_COLORS.pending;
  const platformInfo = PLATFORM_COLORS[meeting.platform] || PLATFORM_COLORS.zoom;

  // Format duration
  const getDuration = () => {
    if (!meeting.startTime || !meeting.endTime) return '—';
    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);
    const diffMs = end.getTime() - start.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Format relative time
  const getRelativeTime = () => {
    if (!meeting.startTime) return null;
    return formatDistance(new Date(meeting.startTime), new Date(), {
      addSuffix: true,
      locale: dateLocale,
    });
  };

  // Get participant avatars
  const getParticipants = () => {
    if (!meeting.participants || meeting.participants.length === 0) {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Users className="h-4 w-4" />
          <span>No participants</span>
        </div>
      );
    }

    const visible = meeting.participants.slice(0, 4);
    const remaining = meeting.participants.length - 4;

    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {visible.map((participant, idx) => {
            const displayName = participant.name || participant.email || 'Anonymous';
            return (
              <div
                key={idx}
                className="h-8 w-8 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-semibold text-white"
                style={{ backgroundColor: stringToColor(displayName) }}
                title={displayName}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            );
          })}
          {remaining > 0 && (
            <div className="h-8 w-8 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-semibold bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              +{remaining}
            </div>
          )}
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {meeting.participants.length} {meeting.participants.length === 1 ? 'participant' : 'participants'}
        </span>
      </div>
    );
  };

  // Get summary preview
  const getSummaryPreview = () => {
    if (!meeting.summary?.overview) return null;
    const maxLength = 150;
    if (meeting.summary.overview.length <= maxLength) return meeting.summary.overview;
    return meeting.summary.overview.substring(0, maxLength) + '...';
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="relative group"
    >
      <Link href={`/meetings/${meeting.id}`}>
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all duration-200">
          {/* Platform badge (absolute top-right) */}
          <div className="absolute top-4 right-4">
            <Badge
              className={cn(platformInfo.bg, platformInfo.text, 'text-xs font-semibold')}
            >
              <Video className="h-3 w-3 mr-1" />
              {meeting.platform.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 pr-32 line-clamp-2">
            {meeting.title || 'Untitled Meeting'}
          </h3>

          {/* Status badge */}
          <div className="mb-4">
            <Badge className={cn(statusInfo.bg, statusInfo.text, 'text-xs')}>
              {statusInfo.label}
            </Badge>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4 flex-wrap">
            {meeting.startTime && (
              <>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(meeting.startTime), 'MMM d, yyyy', { locale: dateLocale })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{getDuration()}</span>
                </div>
              </>
            )}
            {getRelativeTime() && (
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {getRelativeTime()}
              </span>
            )}
          </div>

          {/* Participants */}
          <div className="mb-4">
            {getParticipants()}
          </div>

          {/* Summary preview */}
          {getSummaryPreview() && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                {getSummaryPreview()}
              </p>
            </div>
          )}

          {/* Tags */}
          {meeting.tags && meeting.tags.length > 0 && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {meeting.tags.slice(0, 3).map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {meeting.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{meeting.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Actions dropdown */}
      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="h-8 w-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); onStar?.(meeting); }}>
              <Star className="h-4 w-4 mr-2" />
              Star
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); onShare?.(meeting); }}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); onDownload?.(meeting); }}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.preventDefault(); onArchive?.(meeting); }}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.preventDefault(); onDelete?.(meeting); }}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
