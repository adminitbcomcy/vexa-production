'use client';

/**
 * Horizon UI Sidebar Component
 * Professional navigation with icons, active states, and animations
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Video,
  PlayCircle,
  BarChart3,
  Settings,
  X,
  ChevronLeft,
  Mic,
  MessageSquare,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarState } from '@/lib/stores/app';
import { UserButton } from '@clerk/nextjs';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Meetings', href: '/meetings', icon: Video },
  { name: 'Record', href: '/record', icon: PlayCircle },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, toggle, toggleMobile } = useSidebarState();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // Desktop sidebar
  const DesktopSidebar = () => (
    <motion.aside
      initial={false}
      animate={{
        width: collapsed ? '80px' : '280px',
      }}
      className="hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white dark:bg-navy-900 border-r border-gray-200 dark:border-gray-800 z-40"
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-[var(--header-height)] px-6 border-b border-gray-200 dark:border-gray-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Mic className="w-6 h-6 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xl font-display font-bold text-gray-900 dark:text-white"
              >
                Vexa.ai
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft
            className={cn(
              'w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'sidebar-link',
                active && 'sidebar-link-active'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-10 h-10',
              },
            }}
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  User
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  user@example.com
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );

  // Mobile sidebar
  const MobileSidebar = () => (
    <AnimatePresence>
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleMobile}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 h-screen w-[280px] bg-white dark:bg-navy-900 z-50 lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-[var(--header-height)] px-6 border-b border-gray-200 dark:border-gray-800">
              <Link href="/dashboard" className="flex items-center gap-3" onClick={toggleMobile}>
                <div className="w-10 h-10 rounded-lg bg-gradient-brand flex items-center justify-center">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-display font-bold text-gray-900 dark:text-white">
                  Vexa.ai
                </span>
              </Link>

              <button
                onClick={toggleMobile}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={toggleMobile}
                    className={cn(
                      'sidebar-link',
                      active && 'sidebar-link-active'
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Profile */}
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'w-10 h-10',
                    },
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    User
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    user@example.com
                  </p>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
}
