// src/store/bookStore.ts
import { create } from 'zustand';
import { bookApi } from '../services/api';
import type { Book, BookListResponse } from '../types';

interface BookState {
  books: Book[];
  currentBook: Book | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };

  fetchBooks: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }) => Promise<void>;
  
  fetchBook: (id: number) => Promise<void>;
  clearError: () => void;
}

export const useBookStore = create<BookState>((set) => ({
  books: [],
  currentBook: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  },

  fetchBooks: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response: BookListResponse = await bookApi.getBooks(params);
      set({ 
        books: response.books,
        pagination: response.pagination,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || '获取书籍列表失败', 
        loading: false 
      });
    }
  },

  fetchBook: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const book = await bookApi.getBook(id);
      set({ 
        currentBook: book,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || '获取书籍详情失败', 
        loading: false 
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));