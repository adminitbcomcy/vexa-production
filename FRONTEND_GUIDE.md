# Frontend Implementation Guide - Premium Vexa.ai UI

## Overview

This guide provides the complete structure and key code samples for the Fireflies.ai/tl;dv/Jamie.ai level premium frontend.

**Tech Stack:**
- Next.js 15 (App Router)
- TypeScript
- shadcn/ui + Radix UI
- Tailwind CSS
- Framer Motion (animations)
- TanStack Query (data fetching)
- Zustand (state management)
- Clerk (authentication)
- next-intl (i18n: Russian + English)

## Complete File Structure

```
frontend/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/
│   │   │   ├── sign-in/
│   │   │   │   └── [[...sign-in]]/
│   │   │   │       └── page.tsx
│   │   │   └── sign-up/
│   │   │       └── [[...sign-up]]/
│   │   │           └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                    # Dashboard shell with sidebar
│   │   │   ├── meetings/
│   │   │   │   └── page.tsx                  # Main library page
│   │   │   ├── meeting/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx              # Meeting detail view
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx                  # Usage analytics
│   │   │   ├── settings/
│   │   │   │   └── page.tsx                  # User settings
│   │   │   └── record/
│   │   │       └── page.tsx                  # Start recording page
│   │   └── layout.tsx                         # Root layout with providers
│   ├── api/
│   │   └── webhooks/
│   │       └── clerk/
│   │           └── route.ts
│   ├── globals.css
│   └── favicon.ico
├── components/
│   ├── ui/                                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── tabs.tsx
│   │   ├── scroll-area.tsx
│   │   ├── accordion.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── table.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── meetings/
│   │   ├── meeting-card.tsx                  # Grid card for library
│   │   ├── meeting-list.tsx                  # List view with filters
│   │   ├── meeting-filters.tsx               # Search, tags, date filters
│   │   └── meeting-actions.tsx               # Share, Export, Delete
│   ├── transcript/
│   │   ├── transcript-timeline.tsx           # Left panel with speakers
│   │   ├── transcript-line.tsx               # Individual transcript line
│   │   ├── speaker-avatar.tsx                # Colored avatars
│   │   └── transcript-search.tsx             # Search within transcript
│   ├── ai-summary/
│   │   ├── summary-panel.tsx                 # Right panel
│   │   ├── summary-overview.tsx              # Overview card
│   │   ├── summary-decisions.tsx             # Key decisions
│   │   ├── summary-action-items.tsx          # Action items with owners
│   │   ├── summary-questions.tsx             # Questions raised
│   │   └── summary-highlights.tsx            # Highlights
│   ├── chat/
│   │   ├── ai-chat.tsx                       # Chat interface at bottom
│   │   ├── chat-message.tsx                  # Message bubble
│   │   └── chat-input.tsx                    # Input field
│   ├── layout/
│   │   ├── sidebar.tsx                       # Main navigation sidebar
│   │   ├── header.tsx                        # Top bar
│   │   └── theme-toggle.tsx                  # Dark mode switch
│   ├── analytics/
│   │   ├── usage-chart.tsx                   # Time in meetings chart
│   │   ├── speaker-stats.tsx                 # Top speakers
│   │   └── meeting-trends.tsx                # Trends over time
│   └── providers/
│       ├── clerk-provider.tsx
│       ├── theme-provider.tsx
│       ├── query-provider.tsx
│       └── intl-provider.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts                         # Axios instance with interceptors
│   │   ├── meetings.ts                       # Meeting API functions
│   │   ├── transcripts.ts                    # Transcript API
│   │   └── chat.ts                           # AI chat API
│   ├── websocket/
│   │   ├── use-websocket.ts                  # WebSocket hook
│   │   └── use-live-transcript.ts            # Live transcription hook
│   ├── stores/
│   │   ├── use-meeting-store.ts              # Zustand store for meetings
│   │   └── use-ui-store.ts                   # UI state (modals, etc.)
│   ├── utils.ts                               # Utility functions (cn, etc.)
│   └── constants.ts                           # Constants
├── types/
│   ├── meeting.ts                            # Meeting interfaces
│   ├── transcript.ts                         # Transcript types
│   ├── user.ts                               # User types
│   └── api.ts                                # API response types
├── hooks/
│   ├── use-meetings.ts                       # TanStack Query hooks
│   ├── use-transcript.ts
│   ├── use-ai-chat.ts
│   └── use-media-query.ts                    # Responsive hooks
├── messages/
│   ├── en.json                               # English translations
│   └── ru.json                               # Russian translations
├── public/
│   ├── icons/
│   ├── manifest.json                         # PWA manifest
│   └── sw.js                                 # Service worker
├── .env.local.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json                            # shadcn/ui config
└── middleware.ts                              # Clerk + i18n middleware
```

## Key TypeScript Types

**`types/meeting.ts`**:
```typescript
export interface Meeting {
  id: string;
  title: string;
  date: Date;
  duration: number; // seconds
  participants: Participant[];
  status: 'recording' | 'processing' | 'completed' | 'failed';
  thumbnail?: string;
  tags: string[];
  summary?: AISummary;
  transcript?: Transcript;
  audioUrl?: string;
  videoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  speakTime: number; // seconds
  color: string; // for UI differentiation
}

export interface AISummary {
  overview: string;
  keyDecisions: Decision[];
  actionItems: ActionItem[];
  questions: Question[];
  highlights: Highlight[];
}

export interface Decision {
  id: string;
  text: string;
  timestamp: number;
  participants: string[];
}

export interface ActionItem {
  id: string;
  text: string;
  owner: string;
  dueDate?: Date;
  completed: boolean;
  timestamp: number;
}

export interface Question {
  id: string;
  text: string;
  askedBy: string;
  timestamp: number;
  answered: boolean;
}

export interface Highlight {
  id: string;
  text: string;
  timestamp: number;
  speaker: string;
}

export interface Transcript {
  id: string;
  meetingId: string;
  lines: TranscriptLine[];
  language: string;
  diarized: boolean;
}

export interface TranscriptLine {
  id: string;
  speaker: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
}
```

## Premium UI Components

### Meeting Card (Fireflies.ai Style)

**`components/meetings/meeting-card.tsx`**:
```typescript
'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Clock, Users, Calendar, MoreVertical } from 'lucide-react';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import { motion } from 'framer-motion';
import { Meeting } from '@/types/meeting';
import Link from 'next/link';

interface MeetingCardProps {
  meeting: Meeting;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const duration = intervalToDuration({ start: 0, end: meeting.duration * 1000 });
  const formattedDuration = formatDuration(duration, { format: ['hours', 'minutes'] });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/meeting/${meeting.id}`}>
        <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow border-border/50">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg line-clamp-2 mb-2">
                  {meeting.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(meeting.date), 'MMM d, yyyy')}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            {/* Summary Preview */}
            {meeting.summary && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {meeting.summary.overview}
              </p>
            )}

            {/* Participants */}
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="flex -space-x-2">
                {meeting.participants.slice(0, 3).map((participant) => (
                  <Avatar key={participant.id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={participant.avatar} />
                    <AvatarFallback style={{ backgroundColor: participant.color }}>
                      {participant.name[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {meeting.participants.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                    +{meeting.participants.length - 3}
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {meeting.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {meeting.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>

          <CardFooter className="p-6 pt-0 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formattedDuration}</span>
            </div>
            <Badge
              variant={meeting.status === 'completed' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {meeting.status}
            </Badge>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
```

### Meetings Library Page (tl;dv Style)

**`app/[locale]/(dashboard)/meetings/page.tsx`**:
```typescript
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Grid3x3, List, Plus } from 'lucide-react';
import { MeetingCard } from '@/components/meetings/meeting-card';
import { useMeetings } from '@/hooks/use-meetings';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function MeetingsPage() {
  const t = useTranslations('meetings');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: meetings, isLoading } = useMeetings({ search });

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
        </div>
        <Link href="/record">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('newRecording')}
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
          <TabsTrigger value="recent">{t('tabs.recent')}</TabsTrigger>
          <TabsTrigger value="starred">{t('tabs.starred')}</TabsTrigger>
          <TabsTrigger value="archived">{t('tabs.archived')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Grid/List View */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'flex flex-col gap-4'
          }
        >
          {meetings?.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && meetings?.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">{t('noMeetings')}</p>
          <Link href="/record">
            <Button>{t('recordFirst')}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
```

### Meeting Detail Page (Split View)

**`app/[locale]/(dashboard)/meeting/[id]/page.tsx`**:
```typescript
'use client';

import { useParams } from 'next/navigation';
import { useMeeting, useTranscript } from '@/hooks/use-meetings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TranscriptTimeline } from '@/components/transcript/transcript-timeline';
import { SummaryPanel } from '@/components/ai-summary/summary-panel';
import { AIChat } from '@/components/chat/ai-chat';
import { Button } from '@/components/ui/button';
import { Share, Download, Video } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MeetingDetailPage() {
  const params = useParams();
  const meetingId = params.id as string;

  const { data: meeting, isLoading } = useMeeting(meetingId);
  const { data: transcript } = useTranscript(meetingId);

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-8">
        <Skeleton className="h-12 w-1/2 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[600px] lg:col-span-2" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  if (!meeting) {
    return <div>Meeting not found</div>;
  }

  return (
    <div className="container max-w-7xl py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{meeting.title}</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          {meeting.videoUrl && (
            <Button variant="outline" size="sm">
              <Video className="h-4 w-4 mr-2" />
              Play Recording
            </Button>
          )}
        </div>
      </div>

      {/* Split View: Transcript + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left: Transcript Timeline (2/3 width) */}
        <div className="lg:col-span-2">
          <TranscriptTimeline
            transcript={transcript}
            meetingId={meetingId}
          />
        </div>

        {/* Right: AI Summary (1/3 width) */}
        <div>
          <SummaryPanel summary={meeting.summary} />
        </div>
      </div>

      {/* Bottom: AI Chat */}
      <div className="border-t pt-6">
        <AIChat meetingId={meetingId} />
      </div>
    </div>
  );
}
```

## API Client Setup

**`lib/api/client.ts`**:
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_VEXA_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('clerk-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/sign-in';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**`lib/api/meetings.ts`**:
```typescript
import apiClient from './client';
import { Meeting, Transcript, AISummary } from '@/types/meeting';

export const meetingsApi = {
  getAll: async (params?: { search?: string; limit?: number; offset?: number }) => {
    return apiClient.get<Meeting[]>('/meetings', { params });
  },

  getById: async (id: string) => {
    return apiClient.get<Meeting>(`/meetings/${id}`);
  },

  getTranscript: async (id: string) => {
    return apiClient.get<Transcript>(`/meetings/${id}/transcript`);
  },

  getSummary: async (id: string) => {
    return apiClient.get<AISummary>(`/meetings/${id}/summary`);
  },

  create: async (data: { title: string; meetingUrl?: string }) => {
    return apiClient.post<Meeting>('/meetings', data);
  },

  delete: async (id: string) => {
    return apiClient.delete(`/meetings/${id}`);
  },

  export: async (id: string, format: 'pdf' | 'markdown') => {
    return apiClient.get(`/meetings/${id}/export`, {
      params: { format },
      responseType: 'blob',
    });
  },
};
```

## WebSocket Integration

**`lib/websocket/use-live-transcript.ts`**:
```typescript
import { useEffect, useState } from 'use';
import { TranscriptLine } from '@/types/meeting';

export function useLiveTranscript(meetingId: string) {
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001';
    const ws = new WebSocket(`${wsUrl}/transcription/${meetingId}`);

    ws.onopen = () => setStatus('connected');
    ws.onclose = () => setStatus('disconnected');

    ws.onmessage = (event) => {
      const line: TranscriptLine = JSON.parse(event.data);
      setLines((prev) => [...prev, line]);
    };

    return () => ws.close();
  }, [meetingId]);

  return { lines, status };
}
```

## Environment Variables

**`.env.local.example`**:
```env
# Vexa API
NEXT_PUBLIC_VEXA_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:8001

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/meetings
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/meetings
```

## i18n Setup

**`messages/en.json`**:
```json
{
  "meetings": {
    "title": "Meetings",
    "subtitle": "View and manage all your recorded meetings",
    "newRecording": "New Recording",
    "searchPlaceholder": "Search meetings, participants, or keywords...",
    "noMeetings": "No meetings yet",
    "recordFirst": "Record Your First Meeting",
    "tabs": {
      "all": "All Meetings",
      "recent": "Recent",
      "starred": "Starred",
      "archived": "Archived"
    }
  },
  "meeting": {
    "overview": "Overview",
    "transcript": "Transcript",
    "summary": "AI Summary",
    "participants": "Participants",
    "share": "Share Meeting",
    "export": "Export",
    "delete": "Delete"
  }
}
```

**`messages/ru.json`**:
```json
{
  "meetings": {
    "title": "Встречи",
    "subtitle": "Просмотр и управление всеми записанными встречами",
    "newRecording": "Новая Запись",
    "searchPlaceholder": "Поиск встреч, участников или ключевых слов...",
    "noMeetings": "Встреч пока нет",
    "recordFirst": "Записать Первую Встречу",
    "tabs": {
      "all": "Все встречи",
      "recent": "Недавние",
      "starred": "Избранное",
      "archived": "Архив"
    }
  },
  "meeting": {
    "overview": "Обзор",
    "transcript": "Транскрипт",
    "summary": "AI Саммари",
    "participants": "Участники",
    "share": "Поделиться",
    "export": "Экспорт",
    "delete": "Удалить"
  }
}
```

## Getting Started

### 1. Install Dependencies
```bash
cd frontend/
npm install
```

### 2. Install shadcn/ui Components
```bash
npx shadcn@latest init
npx shadcn@latest add button card input tabs scroll-area accordion avatar badge dialog dropdown-menu label select separator skeleton table toast
```

### 3. Configure Environment
```bash
cp .env.local.example .env.local
# Edit .env.local with your Clerk keys and Vexa API URL
```

### 4. Run Development Server
```bash
npm run dev
```

Open `http://localhost:3000` - you'll see the premium Fireflies.ai style UI!

## Design Principles (Matching tl;dv/Fireflies/Jamie.ai)

1. **Lots of White Space** - Cards have generous padding (p-6), margins between elements
2. **Subtle Shadows** - `hover:shadow-lg` on cards for depth
3. **Smooth Animations** - Framer Motion for page transitions, card hovers
4. **Color-Coded Speakers** - Each participant gets a unique color for avatars/transcript lines
5. **Clickable Timestamps** - Jump to exact moment in recording
6. **Clean Typography** - Large, bold headings, muted text for metadata
7. **Grid Layouts** - 3-column grid for meetings library on desktop
8. **Dark Mode Support** - via next-themes, matches system preference
9. **Skeleton Loaders** - Shows loading state elegantly
10. **Micro-interactions** - Buttons have hover states, toast notifications for actions

## Next Steps

To complete the frontend, add:
- Remaining shadcn components (see structure above)
- Additional pages (analytics with recharts, settings, record page)
- More transcript/summary components (see component list)
- WebSocket integration for live updates
- PDF/Markdown export functionality
- PWA manifest and service worker for offline support

All components follow the same premium design pattern shown in the examples above.
