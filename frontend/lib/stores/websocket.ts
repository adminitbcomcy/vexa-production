/**
 * WebSocket Zustand Store for Real-time Meeting Transcription
 * Based on user-provided specification with enhancements
 */

import { create } from 'zustand';
import type {
  WebSocketMessage,
  TranscriptLine,
  SummaryUpdate,
  StatusUpdate,
  ProcessedTranscriptLine,
  LiveMeetingState,
} from '@/types/websocket';

interface WebSocketStore extends LiveMeetingState {
  ws: WebSocket | null;

  // Actions
  connect: (meetingId: string) => void;
  disconnect: () => void;
  send: (message: any) => void;
  clearTranscript: () => void;
}

// WebSocket endpoint from environment or default
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'wss://voice.axiomic.com.cy/ws';

export const useWebSocket = create<WebSocketStore>((set, get) => ({
  // Initial state
  ws: null,
  meetingId: null,
  status: 'disconnected',
  error: null,
  lines: [],
  summary: {
    overview: '',
    keyDecisions: [],
    actionItems: [],
    questions: [],
  },
  meetingStatus: null,

  // Connect to WebSocket
  connect: (meetingId: string) => {
    const { ws: existingWs, disconnect } = get();

    // Disconnect existing connection
    if (existingWs) {
      disconnect();
    }

    try {
      set({ status: 'connecting', meetingId, error: null });

      const wsUrl = `${WS_URL}?meeting_id=${meetingId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connected to meeting:', meetingId);
        set({ status: 'connected', ws });
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          const { type, data } = message;

          switch (type) {
            case 'transcript': {
              const transcript = data as TranscriptLine;

              // Process transcript line
              const processedLine: ProcessedTranscriptLine = {
                ...transcript,
                id: `${transcript.timestamp}-${Date.now()}`, // Unique ID
                receivedAt: new Date(),
              };

              set((state) => {
                // If interim (not final), replace last interim line from same speaker
                if (!processedLine.final) {
                  const lastIndex = state.lines.length - 1;
                  const lastLine = state.lines[lastIndex];

                  if (
                    lastLine &&
                    !lastLine.final &&
                    lastLine.speaker === processedLine.speaker
                  ) {
                    // Replace last interim line
                    const newLines = [...state.lines];
                    newLines[lastIndex] = processedLine;
                    return { lines: newLines };
                  }
                }

                // Otherwise, append new line
                return {
                  lines: [...state.lines, processedLine],
                };
              });
              break;
            }

            case 'summary': {
              const summaryData = data as SummaryUpdate;

              set((state) => ({
                summary: {
                  overview: summaryData.overview || state.summary.overview,
                  keyDecisions: summaryData.key_decisions || state.summary.keyDecisions,
                  actionItems: summaryData.action_items || state.summary.actionItems,
                  questions: summaryData.questions || state.summary.questions,
                },
              }));
              break;
            }

            case 'status': {
              const statusData = data as StatusUpdate;

              set({
                meetingStatus: statusData.status,
              });

              // Auto-disconnect on completion or failure
              if (statusData.status === 'completed' || statusData.status === 'failed') {
                console.log('[WebSocket] Meeting ended:', statusData.status);
                setTimeout(() => {
                  get().disconnect();
                }, 2000);
              }
              break;
            }

            default:
              console.warn('[WebSocket] Unknown message type:', type);
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        set({
          status: 'error',
          error: 'WebSocket connection error',
        });
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        set({
          status: 'disconnected',
          ws: null,
        });

        // Auto-reconnect after 3 seconds if not a normal closure
        if (event.code !== 1000 && get().meetingId) {
          console.log('[WebSocket] Attempting to reconnect...');
          setTimeout(() => {
            const currentMeetingId = get().meetingId;
            if (currentMeetingId) {
              get().connect(currentMeetingId);
            }
          }, 3000);
        }
      };

      set({ ws });
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  },

  // Disconnect from WebSocket
  disconnect: () => {
    const { ws } = get();

    if (ws) {
      ws.close(1000, 'Client disconnect');
      set({ ws: null, status: 'disconnected' });
    }
  },

  // Send message to WebSocket
  send: (message: any) => {
    const { ws, status } = get();

    if (ws && status === 'connected') {
      ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message: not connected');
    }
  },

  // Clear transcript lines
  clearTranscript: () => {
    set({ lines: [] });
  },
}));

// Export connection status hook
export const useWebSocketStatus = () => {
  const status = useWebSocket((state) => state.status);
  const error = useWebSocket((state) => state.error);
  const meetingStatus = useWebSocket((state) => state.meetingStatus);

  return {
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isDisconnected: status === 'disconnected',
    hasError: status === 'error',
    error,
    meetingStatus,
  };
};

// Export transcript lines hook
export const useTranscriptLines = () => {
  return useWebSocket((state) => state.lines);
};

// Export summary hook
export const useLiveSummary = () => {
  return useWebSocket((state) => state.summary);
};
