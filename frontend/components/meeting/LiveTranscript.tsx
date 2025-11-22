'use client';

/**
 * LiveTranscript Component
 * Real-time transcript display with WebSocket updates
 * Based on user-provided specification
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Loader2, CheckCircle2 } from 'lucide-react';
import { useWebSocket, useTranscriptLines, useWebSocketStatus } from '@/lib/stores/websocket';
import { cn } from '@/lib/utils';

interface LiveTranscriptProps {
  meetingId: string;
  autoScroll?: boolean;
}

export function LiveTranscript({ meetingId, autoScroll = true }: LiveTranscriptProps) {
  const { connect, disconnect } = useWebSocket();
  const lines = useTranscriptLines();
  const { isConnected, isConnecting, meetingStatus, error } = useWebSocketStatus();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Connect to WebSocket on mount
  useEffect(() => {
    connect(meetingId);

    return () => {
      disconnect();
    };
  }, [meetingId, connect, disconnect]);

  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, autoScroll]);

  // Get initials from speaker name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Generate color from speaker name
  const getSpeakerColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 65%, 50%)`;
  };

  // Format timestamp as MM:SS
  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Mic className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {isConnected && (
              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Live Transcript
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isConnecting && 'Connecting...'}
              {isConnected && 'Connected'}
              {error && 'Connection error'}
              {!isConnecting && !isConnected && !error && 'Disconnected'}
            </p>
          </div>
        </div>

        {meetingStatus && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
            {meetingStatus === 'active' && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Recording
              </span>
            )}
            {meetingStatus === 'ending' && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                Ending
              </span>
            )}
            {meetingStatus === 'completed' && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                <CheckCircle2 className="w-3 h-3" />
                Completed
              </span>
            )}
          </div>
        )}
      </div>

      {/* Transcript Lines */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4"
      >
        <AnimatePresence initial={false}>
          {lines.length === 0 && isConnected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <Mic className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Waiting for speech to be detected...
              </p>
            </motion.div>
          )}

          {lines.map((line, index) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex gap-3"
            >
              {/* Speaker Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                style={{ backgroundColor: getSpeakerColor(line.speaker) }}
              >
                {getInitials(line.speaker)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {line.speaker}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimestamp(line.timestamp)}
                  </span>
                  {!line.final && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      Live
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    'text-sm text-gray-700 dark:text-gray-300',
                    !line.final && 'italic opacity-75'
                  )}
                >
                  {line.text}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              Connection error: {error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
