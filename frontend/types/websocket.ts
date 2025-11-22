/**
 * WebSocket Message Types for Real-time Transcription
 * Based on provided user specification
 */

export type WebSocketMessageType = 'transcript' | 'summary' | 'status';

export interface TranscriptLine {
  meeting_id: string;
  speaker: string;
  text: string;
  timestamp: number; // Seconds from meeting start
  final: boolean; // true = final, false = interim
}

export interface SummaryUpdate {
  meeting_id: string;
  overview?: string;
  key_decisions?: string[];
  action_items?: string[];
  questions?: string[];
}

export interface StatusUpdate {
  meeting_id: string;
  status: 'joining' | 'active' | 'ending' | 'completed' | 'failed';
  message?: string;
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: TranscriptLine | SummaryUpdate | StatusUpdate;
}

// Client-side processed types
export interface ProcessedTranscriptLine extends TranscriptLine {
  id: string; // Generated client-side for React keys
  receivedAt: Date;
}

export interface LiveMeetingState {
  meetingId: string | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
  lines: ProcessedTranscriptLine[];
  summary: {
    overview: string;
    keyDecisions: string[];
    actionItems: string[];
    questions: string[];
  };
  meetingStatus: StatusUpdate['status'] | null;
}
