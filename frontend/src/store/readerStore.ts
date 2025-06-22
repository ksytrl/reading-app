// src/store/readerStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ReaderSettings {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontFamily: 'default' | 'serif' | 'sans';
  lineHeight: number;
  theme: 'light' | 'dark' | 'sepia';
  backgroundColor: string;
  textColor: string;
  maxWidth: string;
  pageMargin: number;
}

export interface ReadingProgress {
  bookId: number;
  chapterId: number;
  scrollPosition: number;
  progressPercentage: number;
  lastReadAt: string;
}

interface ReaderState {
  settings: ReaderSettings;
  isSettingsOpen: boolean;
  isFullscreen: boolean;
  showCatalog: boolean;
  readingProgress: Record<string, ReadingProgress>;
  
  // Settings actions
  updateSettings: (settings: Partial<ReaderSettings>) => void;
  toggleSettings: () => void;
  toggleFullscreen: () => void;
  toggleCatalog: () => void;
  
  // Progress actions
  saveProgress: (bookId: number, chapterId: number, scrollPosition: number, progressPercentage: number) => void;
  getProgress: (bookId: number, chapterId: number) => ReadingProgress | null;
  
  // Theme presets
  applyTheme: (theme: 'light' | 'dark' | 'sepia') => void;
}

const defaultSettings: ReaderSettings = {
  fontSize: 'medium',
  fontFamily: 'default',
  lineHeight: 1.8,
  theme: 'light',
  backgroundColor: '#ffffff',
  textColor: '#333333',
  maxWidth: '800px',
  pageMargin: 40,
};

const themePresets = {
  light: {
    backgroundColor: '#ffffff',
    textColor: '#333333',
  },
  dark: {
    backgroundColor: '#1a1a1a',
    textColor: '#e5e5e5',
  },
  sepia: {
    backgroundColor: '#f7f3e9',
    textColor: '#5c4b37',
  },
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      isSettingsOpen: false,
      isFullscreen: false,
      showCatalog: false,
      readingProgress: {},

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      toggleSettings: () =>
        set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

      toggleFullscreen: () =>
        set((state) => ({ isFullscreen: !state.isFullscreen })),

      toggleCatalog: () =>
        set((state) => ({ showCatalog: !state.showCatalog })),

      saveProgress: (bookId, chapterId, scrollPosition, progressPercentage) =>
        set((state) => ({
          readingProgress: {
            ...state.readingProgress,
            [`${bookId}-${chapterId}`]: {
              bookId,
              chapterId,
              scrollPosition,
              progressPercentage,
              lastReadAt: new Date().toISOString(),
            },
          },
        })),

      getProgress: (bookId, chapterId) => {
        const progress = get().readingProgress[`${bookId}-${chapterId}`];
        return progress || null;
      },

      applyTheme: (theme) =>
        set((state) => ({
          settings: {
            ...state.settings,
            theme,
            ...themePresets[theme],
          },
        })),
    }),
    {
      name: 'reader-storage',
    }
  )
);