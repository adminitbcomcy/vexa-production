/**
 * App State Zustand Store
 * Manages global UI state (sidebar, modals, notifications, etc.)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // Sidebar state
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Locale
  locale: 'en' | 'ru';

  // Current page metadata
  currentPage: {
    title: string;
    breadcrumbs: { label: string; href?: string }[];
  };

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLocale: (locale: 'en' | 'ru') => void;
  setCurrentPage: (title: string, breadcrumbs?: { label: string; href?: string }[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      theme: 'system',
      locale: 'en',
      currentPage: {
        title: '',
        breadcrumbs: [],
      },

      // Sidebar actions
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      toggleMobileSidebar: () =>
        set((state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen })),

      setMobileSidebarOpen: (open) =>
        set({ sidebarMobileOpen: open }),

      // Theme actions
      setTheme: (theme) =>
        set({ theme }),

      // Locale actions
      setLocale: (locale) =>
        set({ locale }),

      // Page metadata
      setCurrentPage: (title, breadcrumbs = []) =>
        set({ currentPage: { title, breadcrumbs } }),
    }),
    {
      name: 'vexa-app-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        locale: state.locale,
      }),
    }
  )
);

// Convenience hooks
export const useSidebarState = () => {
  const collapsed = useAppStore((state) => state.sidebarCollapsed);
  const mobileOpen = useAppStore((state) => state.sidebarMobileOpen);
  const toggle = useAppStore((state) => state.toggleSidebar);
  const toggleMobile = useAppStore((state) => state.toggleMobileSidebar);

  return { collapsed, mobileOpen, toggle, toggleMobile };
};

export const useTheme = () => {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);

  return { theme, setTheme };
};

export const useLocale = () => {
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);

  return { locale, setLocale };
};
