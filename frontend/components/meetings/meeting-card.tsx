/**
 * MeetingCard Component - Fireflies.ai Style
 * Premium card component for meeting library
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  Users,
  Calendar,
  MoreVertical,
  Star,
  Share2,
  Download,
  Archive,
  Trash2,
} from 'lucide-react';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import type { Meeting } from '@/types/meeting';
import { cn } from '@/lib/utils';

interface MeetingCardProps {
  meeting: Meeting;
  locale?: 'en' | 'ru';
  onStar?: (meetingId: number) => void;
  onArchive?: (meetingId: number) => void;
  onDelete?: (meetingId: number) => void;
  onShare?: (meetingId: number) => void;
  onDownload?: (meetingId: number) => void;
}

export function MeetingCard({
  meeting,
  locale = 'en',
  onStar,
  onArchive,
  onDelete,
  onShare,
  onDownload,
}: MeetingCardProps) {
  const router = useRouter();
  const dateLocale = locale === 'ru' ? ru : enUS;

  // Format date
  const formattedDate = format(new Date(meeting.startTime), 'PPP', {
    locale: dateLocale,
  });

  // Format duration
  const getDurationText = () => {
    if (!meeting.duration) return '--';

    const duration = intervalToDuration({ start: 0, end: meeting.duration * 1000 });
    const hours = duration.hours || 0;
    const minutes = duration.minutes || 0;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Get status color
  const getStatusColor = (status: Meeting['status']) => {
    const colors = {
      completed: 'bg-green-500/10 text-green-600 dark:text-green-400',
      active: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      failed: 'bg-red-500/10 text-red-600 dark:text-red-400',
      requested: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
      joining: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      awaiting_admission: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      stopping: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    };
    return colors[status] || colors.requested;
  };

  // Get status label
  const getStatusLabel = (status: Meeting['status']) => {
    const labels = {
      completed: locale === 'ru' ? 'Завершена' : 'Completed',
      active: locale === 'ru' ? 'Активна' : 'Active',
      failed: locale === 'ru' ? 'Ошибка' : 'Failed',
      requested: locale === 'ru' ? 'Запрошена' : 'Requested',
      joining: locale === 'ru' ? 'Подключение' : 'Joining',
      awaiting_admission: locale === 'ru' ? 'Ожидание доступа' : 'Awaiting',
      stopping: locale === 'ru' ? 'Остановка' : 'Stopping',
    };
    return labels[status] || status;
  };

  // Navigate to meeting detail
  const handleClick = () => {
    router.push(`/meeting/${meeting.id}`);
  };

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative"
    >
      <Card
        className={cn(
          'overflow-hidden cursor-pointer border-2 hover:border-primary/50 transition-all',
          'bg-card hover:bg-accent/5',
          meeting.isStarred && 'border-amber-500/30'
        )}
        onClick={handleClick}
      >
        <CardContent className="p-6">
          {/* Header with title and status */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold line-clamp-1 mb-1">
                {meeting.title ||
                  meeting.data?.title ||
                  `${meeting.platform} Meeting`}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {getDurationText()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              {meeting.isStarred && (
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              )}
              <Badge
                variant="secondary"
                className={cn('text-xs', getStatusColor(meeting.status))}
              >
                {getStatusLabel(meeting.status)}
              </Badge>

              {/* More actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onStar && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onStar(meeting.id);
                      }}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      {meeting.isStarred ? 'Unstar' : 'Star'}
                    </DropdownMenuItem>
                  )}
                  {onShare && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onShare(meeting.id);
                      }}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                  )}
                  {onDownload && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(meeting.id);
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {onArchive && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchive(meeting.id);
                      }}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      {meeting.isArchived ? 'Unarchive' : 'Archive'}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(meeting.id);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex items-center gap-1">
              {/* Avatar stack */}
              <div className="flex -space-x-2">
                {meeting.participants.slice(0, 4).map((participant) => (
                  <Avatar
                    key={participant.id}
                    className="w-8 h-8 border-2 border-background ring-2 ring-background"
                  >
                    <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                    <AvatarFallback
                      style={{ backgroundColor: participant.color }}
                      className="text-white text-xs font-medium"
                    >
                      {participant.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {meeting.participants.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background ring-2 ring-background">
                    +{meeting.participants.length - 4}
                  </div>
                )}
              </div>

              {/* Participant names (hidden on small screens) */}
              <span className="hidden md:inline text-sm text-muted-foreground ml-2">
                {meeting.participants
                  .slice(0, 2)
                  .map((p) => p.name.split(' ')[0])
                  .join(', ')}
                {meeting.participants.length > 2 &&
                  ` ${locale === 'ru' ? 'и' : 'and'} ${meeting.participants.length - 2} ${
                    locale === 'ru' ? 'ещё' : 'more'
                  }`}
              </span>
            </div>
          </div>

          {/* Summary preview */}
          {meeting.summary?.overview && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {meeting.summary.overview}
            </p>
          )}

          {/* Tags */}
          {meeting.tags && meeting.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {meeting.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
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

          {/* Platform badge (absolute positioned) */}
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="text-xs capitalize">
              {meeting.platform.replace('_', ' ')}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
