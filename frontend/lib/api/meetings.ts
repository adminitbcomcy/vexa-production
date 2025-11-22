/**
 * Vexa.ai Meetings API
 * API functions for meeting management
 */

import apiClient from './client';
import type {
  Meeting,
  CreateBotRequest,
  CreateBotResponse,
  BotStatus,
  GetMeetingsParams,
  MeetingListResponse,
  GetTranscriptResponse,
} from '@/types/meeting';

// Get all meetings
export const getMeetings = async (
  params?: GetMeetingsParams
): Promise<MeetingListResponse> => {
  const { data } = await apiClient.get('/meetings', { params });
  return data;
};

// Get single meeting
export const getMeeting = async (id: number): Promise<Meeting> => {
  const { data } = await apiClient.get(`/meetings/${id}`);
  return data;
};

// Get meeting transcript
export const getTranscript = async (
  platform: string,
  nativeId: string
): Promise<GetTranscriptResponse> => {
  const { data} = await apiClient.get(
    `/transcripts/${platform}/${nativeId}`
  );
  return data;
};

// Create bot (start recording)
export const createBot = async (
  request: CreateBotRequest
): Promise<CreateBotResponse> => {
  const { data } = await apiClient.post('/bots', request);
  return data;
};

// Stop bot
export const stopBot = async (
  platform: string,
  nativeId: string
): Promise<void> => {
  await apiClient.delete(`/bots/${platform}/${nativeId}`);
};

// Get bot status
export const getBotStatus = async (): Promise<BotStatus[]> => {
  const { data } = await apiClient.get('/bots/status');
  return data;
};

// Update meeting
export const updateMeeting = async (
  platform: string,
  nativeId: string,
  updates: Partial<Meeting>
): Promise<Meeting> => {
  const { data } = await apiClient.patch(
    `/meetings/${platform}/${nativeId}`,
    updates
  );
  return data;
};

// Delete meeting transcripts
export const deleteMeeting = async (
  platform: string,
  nativeId: string
): Promise<void> => {
  await apiClient.delete(`/meetings/${platform}/${nativeId}`);
};

// Generate AI summary (if not auto-generated)
export const generateSummary = async (meetingId: number): Promise<any> => {
  const { data } = await apiClient.post(`/meetings/${meetingId}/summary`);
  return data;
};
