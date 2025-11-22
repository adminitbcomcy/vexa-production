'use client';

import { useState } from 'react';
import { useCreateBot } from '@/hooks/use-meetings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function RecordPage() {
  const router = useRouter();
  const [meetingUrl, setMeetingUrl] = useState('');

  const createBot = useCreateBot();

  const handleStartRecording = async () => {
    if (!meetingUrl) {
      toast.error('Please enter a meeting URL');
      return;
    }

    try {
      await createBot.mutateAsync({
        native_meeting_id: meetingUrl,
        platform: 'google_meet',
      });

      toast.success('Bot started successfully!');
      router.push('/meetings');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to start recording');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-horizon-lg">
        <div className="text-center">
          <h1 className="text-heading-1 font-display text-gray-900 dark:text-white">
            Start Recording
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-4 text-lg">
            Enter meeting URL to start recording and transcription
          </p>
        </div>

        <div className="horizon-card p-horizon-xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Meeting URL</Label>
              <Input
                placeholder="https://meet.google.com/abc-defg-hij"
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                className="text-base"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Supports Google Meet, Microsoft Teams, and Zoom
              </p>
            </div>

            <Button
              onClick={handleStartRecording}
              disabled={createBot.isPending}
              className="w-full btn-brand h-12 text-base"
              size="lg"
            >
              {createBot.isPending ? 'Starting...' : 'Start Recording'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
