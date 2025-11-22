'use client';

/**
 * Individual Meeting Page with Live Transcript
 * Horizon UI design with 2-column layout
 */

import React from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Download, Share2, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LiveTranscript } from '@/components/meeting/LiveTranscript';
import { useLiveSummary } from '@/lib/stores/websocket';

export default function MeetingPage() {
  const params = useParams();
  const meetingId = params.id as string;
  const summary = useLiveSummary();

  return (
    <div className="space-y-horizon-lg">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/meetings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-heading-2 font-display text-gray-900 dark:text-white">
              Meeting #{meetingId}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Live recording and transcription
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <PlayCircle className="w-4 h-4 mr-2" />
            Play
          </Button>
        </div>
      </div>

      {/* Main Content: 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-horizon-lg">
        {/* Left: Live Transcript (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="horizon-card h-[calc(100vh-16rem)] flex flex-col">
            <LiveTranscript meetingId={meetingId} />
          </div>
        </div>

        {/* Right: AI Summary & Info (1/3 width) */}
        <div className="space-y-horizon">
          {/* AI Summary Card */}
          <div className="horizon-card p-horizon">
            <h3 className="text-heading-5 font-display text-gray-900 dark:text-white mb-4">
              AI Summary
            </h3>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="text-xs">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="decisions" className="text-xs">
                  Decisions
                </TabsTrigger>
                <TabsTrigger value="actions" className="text-xs">
                  Actions
                </TabsTrigger>
                <TabsTrigger value="questions" className="text-xs">
                  Questions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {summary.overview || (
                    <p className="text-gray-500 dark:text-gray-400 italic">
                      Summary will appear here as the meeting progresses...
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="decisions" className="mt-4">
                <div className="space-y-2">
                  {summary.keyDecisions.length > 0 ? (
                    summary.keyDecisions.map((decision, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm text-gray-700 dark:text-gray-300"
                      >
                        {decision}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No decisions detected yet...
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="actions" className="mt-4">
                <div className="space-y-2">
                  {summary.actionItems.length > 0 ? (
                    summary.actionItems.map((action, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-sm text-gray-700 dark:text-gray-300"
                      >
                        {action}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No action items yet...
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="questions" className="mt-4">
                <div className="space-y-2">
                  {summary.questions.length > 0 ? (
                    summary.questions.map((question, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-sm text-gray-700 dark:text-gray-300"
                      >
                        {question}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No questions detected yet...
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Meeting Info Card */}
          <div className="horizon-card p-horizon">
            <h3 className="text-heading-6 font-display text-gray-900 dark:text-white mb-3">
              Meeting Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">ID</span>
                <span className="text-gray-900 dark:text-white font-mono">
                  {meetingId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  Live
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Platform</span>
                <span className="text-gray-900 dark:text-white">Google Meet</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
