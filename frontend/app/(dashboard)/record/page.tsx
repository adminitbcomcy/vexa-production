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
        meetingUrl: meetingUrl,
        platform: 'google_meet',
      });

      toast.success('Bot started successfully!');
      router.push('/meetings');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to start recording');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Start Recording</h1>
        <p className="text-muted-foreground mt-1">
          Enter meeting URL to start recording
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-lg space-y-6">
        <div className="space-y-2">
          <Label>Meeting URL</Label>
          <Input
            placeholder="https://meet.google.com/abc-defg-hij"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Supports Google Meet, Microsoft Teams, and Zoom
          </p>
        </div>

        <Button
          onClick={handleStartRecording}
          disabled={createBot.isPending}
          className="w-full"
          size="lg"
        >
          {createBot.isPending ? 'Starting...' : 'Start Recording'}
        </Button>
      </div>
    </div>
  );
}
