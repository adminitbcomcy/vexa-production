/**
 * TanStack Query Hooks for Meetings
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMeetings,
  getMeeting,
  getTranscript,
  createBot,
  stopBot,
  updateMeeting,
  deleteMeeting,
} from '@/lib/api/meetings';
import type {
  GetMeetingsParams,
  CreateBotRequest,
  Meeting,
} from '@/types/meeting';

// Get meetings list
export function useMeetings(params?: GetMeetingsParams) {
  return useQuery({
    queryKey: ['meetings', params],
    queryFn: () => getMeetings(params),
    staleTime: 30000, // 30 seconds
  });
}

// Get single meeting
export function useMeeting(id: number) {
  return useQuery({
    queryKey: ['meeting', id],
    queryFn: () => getMeeting(id),
    enabled: !!id,
  });
}

// Get transcript
export function useTranscript(platform: string, nativeId: string) {
  return useQuery({
    queryKey: ['transcript', platform, nativeId],
    queryFn: () => getTranscript(platform, nativeId),
    enabled: !!platform && !!nativeId,
  });
}

// Create bot mutation
export function useCreateBot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateBotRequest) => createBot(request),
    onSuccess: () => {
      // Invalidate meetings list to refresh
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}

// Stop bot mutation
export function useStopBot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ platform, nativeId }: { platform: string; nativeId: string }) =>
      stopBot(platform, nativeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}

// Update meeting mutation
export function useUpdateMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      platform,
      nativeId,
      updates,
    }: {
      platform: string;
      nativeId: string;
      updates: Partial<Meeting>;
    }) => updateMeeting(platform, nativeId, updates),
    onSuccess: (data, variables) => {
      // Update cache for this specific meeting
      queryClient.setQueryData(['meeting', data.id], data);
      // Invalidate meetings list
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}

// Delete meeting mutation
export function useDeleteMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ platform, nativeId }: { platform: string; nativeId: string }) =>
      deleteMeeting(platform, nativeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
}
