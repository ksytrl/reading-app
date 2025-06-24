// src/store/bookshelfStore.ts
import { create } from 'zustand';
import { api } from '../services/api';

export interface BookshelfItem {
  id: number;
  userId: number;
  bookId: number;
  addedAt: string;
  lastReadAt: string | null;
  isFavorite: boolean;
  book: {
    id: number;
    title: string;
    author: string;
    cover: string | null;
    totalWords: number;
    totalChapters: number;
    category: {
      id: number;
      name: string;
    } | null;
    _count: {
      chapters: number;
    };
  };
  readingProgress: {
    overallProgress: number; // 整体阅读进度百分比
    currentChapter: {
      id: number;
      title: string;
      chapterNumber: number;
    } | null;
    chapterProgress: number; // 当前章节阅读进度百分比
    lastReadAt: string | null;
  };
}

interface BookshelfState {
  bookshelfItems: BookshelfItem[];
  loading: boolean;
  error: string | null;
  filter: 'all' | 'favorites' | 'recent';
  sortBy: 'recent' | 'progress' | 'title' | 'author';

  // Actions
  fetchBookshelf: () => Promise<void>;
  addToBookshelf: (bookId: number) => Promise<void>;
  removeFromBookshelf: (bookId: number) => Promise<void>;
  toggleFavorite: (bookId: number) => Promise<void>;
  checkBookshelfStatus: (bookId: number) => Promise<{ inBookshelf: boolean; isFavorite: boolean }>;
  setFilter: (filter: 'all' | 'favorites' | 'recent') => void;
  setSortBy: (sortBy: 'recent' | 'progress' | 'title' | 'author') => void;
  clearError: () => void;
  
  // Computed
  getFilteredAndSortedItems: () => BookshelfItem[];
}

export const useBookshelfStore = create<BookshelfState>((set, get) => ({
  bookshelfItems: [],
  loading: false,
  error: null,
  filter: 'all',
  sortBy: 'recent',

  fetchBookshelf: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/users/bookshelf');
      set({ 
        bookshelfItems: response.data,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || '获取书架失败', 
        loading: false 
      });
    }
  },

  addToBookshelf: async (bookId: number) => {
    try {
      const response = await api.post('/users/bookshelf', { bookId });
      // 重新获取书架数据
      get().fetchBookshelf();
      return response.data;
    } catch (error: any) {
      set({ error: error.response?.data?.error || '添加到书架失败' });
      throw error;
    }
  },

  removeFromBookshelf: async (bookId: number) => {
    try {
      await api.delete(`/users/bookshelf/${bookId}`);
      // 从当前列表中移除
      set({ 
        bookshelfItems: get().bookshelfItems.filter(item => item.bookId !== bookId)
      });
    } catch (error: any) {
      set({ error: error.response?.data?.error || '从书架移除失败' });
      throw error;
    }
  },

  toggleFavorite: async (bookId: number) => {
    try {
      const response = await api.patch(`/users/bookshelf/${bookId}/favorite`);
      // 更新当前列表中的收藏状态
      set({
        bookshelfItems: get().bookshelfItems.map(item => 
          item.bookId === bookId 
            ? { ...item, isFavorite: response.data.isFavorite }
            : item
        )
      });
      return response.data;
    } catch (error: any) {
      set({ error: error.response?.data?.error || '切换收藏状态失败' });
      throw error;
    }
  },

  checkBookshelfStatus: async (bookId: number) => {
    try {
      const response = await api.get(`/users/bookshelf/check/${bookId}`);
      return response.data;
    } catch (error: any) {
      console.error('Check bookshelf status error:', error);
      return { inBookshelf: false, isFavorite: false };
    }
  },

  setFilter: (filter) => {
    set({ filter });
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
  },

  clearError: () => {
    set({ error: null });
  },

  getFilteredAndSortedItems: () => {
    const { bookshelfItems, filter, sortBy } = get();
    
    // 过滤
    let filteredItems = bookshelfItems;
    if (filter === 'favorites') {
      filteredItems = bookshelfItems.filter(item => item.isFavorite);
    } else if (filter === 'recent') {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      filteredItems = bookshelfItems.filter(item => 
        item.lastReadAt && new Date(item.lastReadAt) > threeDaysAgo
      );
    }

    // 排序
    const sortedItems = [...filteredItems].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          const dateA = a.readingProgress.lastReadAt ? new Date(a.readingProgress.lastReadAt).getTime() : 0;
          const dateB = b.readingProgress.lastReadAt ? new Date(b.readingProgress.lastReadAt).getTime() : 0;
          return dateB - dateA;
        
        case 'progress':
          return b.readingProgress.overallProgress - a.readingProgress.overallProgress;
        
        case 'title':
          return a.book.title.localeCompare(b.book.title);
        
        case 'author':
          return a.book.author.localeCompare(b.book.author);
        
        default:
          return 0;
      }
    });

    return sortedItems;
  },
}));