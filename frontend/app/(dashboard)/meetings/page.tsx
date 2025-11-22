'use client';

/**
 * Premium Meetings Library Page
 * Fireflies.ai-style with filters, tabs, view modes, pagination
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useMeetings } from '@/hooks/use-meetings';
import { MeetingCard } from '@/components/meetings/meeting-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Grid3x3,
  List,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Meeting } from '@/types/meeting';

const ITEMS_PER_PAGE = 12;

type ViewMode = 'grid' | 'list';
type TabType = 'all' | 'recent' | 'starred' | 'archived';

export default function MeetingsPage() {
  // State
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentTab, setCurrentTab] = useState<TabType>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch meetings
  const { data, isLoading, error } = useMeetings({
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    platform: platformFilter !== 'all' ? platformFilter as any : undefined,
  });

  // Filter meetings by tab
  const filteredMeetings = useMemo(() => {
    if (!data?.meetings) return [];

    let meetings = [...data.meetings];

    // Tab filtering
    switch (currentTab) {
      case 'recent':
        // Last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        meetings = meetings.filter(
          (m) => m.startTime && new Date(m.startTime) >= weekAgo
        );
        break;
      case 'starred':
        meetings = meetings.filter((m) => m.isStarred);
        break;
      case 'archived':
        meetings = meetings.filter((m) => m.isArchived);
        break;
      // 'all' - no additional filtering
    }

    return meetings;
  }, [data?.meetings, currentTab]);

  // Pagination
  const totalPages = Math.ceil((filteredMeetings?.length || 0) / ITEMS_PER_PAGE);
  const paginatedMeetings = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMeetings.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredMeetings, currentPage]);

  // Reset page when filters change
  const resetPage = () => setCurrentPage(1);

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setPlatformFilter('all');
    resetPage();
  };

  const hasActiveFilters =
    search || statusFilter !== 'all' || platformFilter !== 'all';

  return (
    <div className="space-y-horizon-lg">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-heading-2 font-display text-gray-900 dark:text-white">
            Meetings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View and manage your recorded meetings
          </p>
        </div>

        <Link href="/record">
          <Button size="lg" className="gap-2 btn-brand">
            <Plus className="h-5 w-5" />
            Start Recording
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={(v) => { setCurrentTab(v as TabType); resetPage(); }}>
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="all">All Meetings</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="starred">Starred</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search meetings, participants, keywords..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <SelectValue placeholder="Status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="requested">Requested</SelectItem>
            <SelectItem value="joining">Joining</SelectItem>
            <SelectItem value="stopping">Stopping</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        {/* Platform Filter */}
        <Select value={platformFilter} onValueChange={(v) => { setPlatformFilter(v); resetPage(); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="google_meet">Google Meet</SelectItem>
            <SelectItem value="microsoft_teams">Microsoft Teams</SelectItem>
            <SelectItem value="zoom">Zoom</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className="flex gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8 p-0"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex gap-2 flex-wrap">
          {search && (
            <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
              Search: "{search}"
              <button onClick={() => { setSearch(''); resetPage(); }}>
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {statusFilter !== 'all' && (
            <div className="flex items-center gap-1 px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
              Status: {statusFilter}
              <button onClick={() => { setStatusFilter('all'); resetPage(); }}>
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {platformFilter !== 'all' && (
            <div className="flex items-center gap-1 px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
              Platform: {platformFilter.replace('_', ' ')}
              <button onClick={() => { setPlatformFilter('all'); resetPage(); }}>
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      {!isLoading && filteredMeetings.length > 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredMeetings.length)} of {filteredMeetings.length} meetings
        </p>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className={cn(
          'grid gap-6',
          viewMode === 'grid'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
        )}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12 px-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-600 dark:text-red-400 font-semibold">
            Failed to load meetings
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Request failed with status code 404
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {error.message}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Meetings Grid/List */}
      {!isLoading && !error && paginatedMeetings.length > 0 && (
        <div className={cn(
          viewMode === 'grid' ? 'horizon-grid' : 'grid grid-cols-1 gap-horizon'
        )}>
          {paginatedMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              locale="en"
              onStar={(m) => console.log('Star', m.id)}
              onShare={(m) => console.log('Share', m.id)}
              onDownload={(m) => console.log('Download', m.id)}
              onArchive={(m) => console.log('Archive', m.id)}
              onDelete={(m) => console.log('Delete', m.id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredMeetings.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="max-w-md mx-auto">
            <div className="h-24 w-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {hasActiveFilters ? 'No meetings found' : 'No meetings yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters or search query'
                : 'Get started by recording your first meeting'}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Link href="/record">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Start Your First Recording
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, idx) => {
              const page = idx + 1;
              // Show first page, last page, current page, and pages around current
              const showPage =
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1);

              if (!showPage && page === currentPage - 2) {
                return (
                  <span key={page} className="px-2 py-1 text-gray-400">
                    ...
                  </span>
                );
              }
              if (!showPage && page === currentPage + 2) {
                return (
                  <span key={page} className="px-2 py-1 text-gray-400">
                    ...
                  </span>
                );
              }
              if (!showPage) return null;

              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
