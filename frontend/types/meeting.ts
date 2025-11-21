/**
 * Vexa.ai Meeting TypeScript Types
 * Complete type definitions for meetings, transcripts, and AI summaries
 */

export type MeetingPlatform = 'google_meet' | 'teams' | 'zoom';

export type MeetingStatus =
  | 'requested'
  | 'joining'
  | 'awaiting_admission'
  | 'active'
  | 'stopping'
  | 'completed'
  | 'failed';

export interface Meeting {
  id: number;
  userId: number;
  platform: MeetingPlatform;
  platformSpecificId: string;
  status: MeetingStatus;
  botContainerId?: string;
  startTime: string; // ISO 8601
  endTime?: string;
  duration?: number; // seconds
  createdAt: string;
  updatedAt: string;
  data?: MeetingData;

  // Relationships
  participants: Participant[];
  transcriptions?: Transcription[];
  summary?: AISummary;

  // Computed properties
  title?: string;
  tags?: string[];
  isStarred?: boolean;
  isArchived?: boolean;
}

export interface MeetingData {
  title?: string;
  description?: string;
  organizer?: string;
  participants?: string[];
  meetingUrl?: string;
  recordingUrl?: string;
  thumbnailUrl?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role?: 'organizer' | 'participant' | 'guest';
  joinTime?: string;
  leaveTime?: string;
  speakingTime?: number; // seconds
  wordCount?: number;
  color: string; // Hex color for UI (e.g., '#3B82F6')
}

export interface Transcription {
  id: number;
  meetingId: number;
  text: string;
  speaker: string;
  language: string;
  startTime: number; // seconds from meeting start
  endTime: number;
  sessionUid: string;
  createdAt: string;

  // UI properties
  isHighlighted?: boolean;
  searchMatch?: boolean;
}

export interface TranscriptionSegment {
  text: string;
  speaker: string;
  absoluteStartTime: string; // ISO 8601
  absoluteEndTime: string;
  updatedAt: string;
}

export interface AISummary {
  overview: string;
  keyDecisions: Decision[];
  actionItems: ActionItem[];
  questions: Question[];
  highlights: Highlight[];
  topics?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  generatedAt: string;
}

export interface Decision {
  id: string;
  text: string;
  timestamp?: number; // seconds from meeting start
  participants?: string[];
  importance?: 'high' | 'medium' | 'low';
}

export interface ActionItem {
  id: string;
  text: string;
  owner?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
  completed: boolean;
  timestamp?: number;
}

export interface Question {
  id: string;
  text: string;
  askedBy?: string;
  answeredBy?: string;
  answered: boolean;
  timestamp?: number;
}

export interface Highlight {
  id: string;
  text: string;
  type?: 'insight' | 'concern' | 'opportunity' | 'risk';
  timestamp?: number;
  speaker?: string;
}

// API Request/Response types
export interface CreateBotRequest {
  platform: MeetingPlatform;
  native_meeting_id: string;
  config?: {
    auto_join?: boolean;
    record_video?: boolean;
    record_audio?: boolean;
  };
}

export interface CreateBotResponse {
  meeting_id: number;
  status: MeetingStatus;
  message: string;
}

export interface BotStatus {
  platform: MeetingPlatform;
  native_meeting_id: string;
  status: MeetingStatus;
  bot_container_id?: string;
  start_time: string;
}

export interface GetMeetingsParams {
  limit?: number;
  offset?: number;
  status?: MeetingStatus;
  platform?: MeetingPlatform;
  search?: string;
  tags?: string[];
  starred?: boolean;
  archived?: boolean;
  start_date?: string;
  end_date?: string;
}

export interface MeetingListResponse {
  meetings: Meeting[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetTranscriptResponse {
  meeting: Meeting;
  transcriptions: Transcription[];
  total_segments: number;
}

// WebSocket message types
export interface WSSubscribeMessage {
  action: 'subscribe';
  meetings: Array<{
    platform: MeetingPlatform;
    native_id: string;
  }>;
}

export interface WSPingMessage {
  action: 'ping';
}

export interface WSTranscriptEvent {
  event: 'transcript.mutable';
  data: TranscriptionSegment;
}

export interface WSMeetingStatusEvent {
  event: 'meeting.status';
  data: {
    platform: MeetingPlatform;
    native_id: string;
    status: MeetingStatus;
  };
}

export interface WSSubscribedEvent {
  event: 'subscribed';
  data: {
    meeting_ids: string[];
  };
}

export interface WSErrorEvent {
  event: 'error';
  data: {
    message: string;
    code?: string;
  };
}

export interface WSPongEvent {
  event: 'pong';
}

export type WSEvent =
  | WSTranscriptEvent
  | WSMeetingStatusEvent
  | WSSubscribedEvent
  | WSErrorEvent
  | WSPongEvent;

// UI State types
export interface MeetingFilters {
  search: string;
  status: MeetingStatus | 'all';
  platform: MeetingPlatform | 'all';
  tags: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  starred: boolean;
  archived: boolean;
}

export interface MeetingSort {
  field: 'startTime' | 'duration' | 'createdAt' | 'title';
  direction: 'asc' | 'desc';
}

export type MeetingViewMode = 'grid' | 'list';

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}
