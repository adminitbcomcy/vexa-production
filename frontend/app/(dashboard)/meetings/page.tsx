'use client';

import { useMeetings } from '@/hooks/use-meetings';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function MeetingsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useMeetings({ search: search || undefined });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Meetings</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your recorded meetings
          </p>
        </div>

        <Link href="/record">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Start Recording
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search meetings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Meetings Grid */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load meetings</p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        </div>
      )}

      {data && data.meetings && data.meetings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <h3 className="font-semibold text-lg">{meeting.platform}</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Status: {meeting.status}
              </p>
              {meeting.start_time && (
                <p className="text-xs text-muted-foreground mt-1">
                  Started: {new Date(meeting.start_time).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No meetings found</p>
            <Link href="/record">
              <Button className="mt-4" variant="outline">
                Start Your First Recording
              </Button>
            </Link>
          </div>
        )
      )}
    </div>
  );
}
