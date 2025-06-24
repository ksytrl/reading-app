// frontend/src/store/bookStore.ts
import { create } from 'zustand';
import { api } from '../services/api';
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
    sort?: string; // 🎯 新增排序参数
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
      console.log('🔍 前端发起搜索请求:', params); // 🎯 添加调试日志
      
      const response = await api.get('/books', { params });
      const data: BookListResponse = response.data;
      
      console.log('✅ 前端收到搜索结果:', data); // 🎯 添加调试日志
      
      set({ 
        books: data.books,
        pagination: data.pagination,
        loading: false 
      });
    } catch (error: any) {
      console.error('❌ 前端搜索错误:', error); // 🎯 添加调试日志
      
      const errorMessage = error.response?.data?.error || '获取书籍列表失败';
      console.error('错误详情:', error.response?.data);
      
      set({ 
        error: errorMessage, 
        loading: false,
        books: [] // 🎯 清空书籍列表
      });
    }
  },

  fetchBook: async (id: number) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/books/${id}`);
      const book: Book = response.data;
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