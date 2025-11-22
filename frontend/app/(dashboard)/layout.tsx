'use client';

/**
 * Horizon UI Dashboard Layout
 * Full-width layout with sidebar navigation
 */

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSidebarState } from '@/lib/stores/app';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebarState();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={cn(
          'transition-all duration-300',
          'lg:ml-[280px]',
          collapsed && 'lg:ml-[80px]'
        )}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="horizon-container py-horizon-xl min-h-[calc(100vh-var(--header-height))]">
          {children}
        </main>
      </div>
    </div>
  );
}
