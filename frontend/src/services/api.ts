// src/services/api.ts
import axios from 'axios';
import type { Book, BookListResponse, AuthResponse, User, Chapter } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 书籍相关API
export const bookApi = {
  // 获取书籍列表
  getBooks: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<BookListResponse> => {
    const response = await api.get('/books', { params });
    return response.data;
  },

  // 获取书籍详情
  getBook: async (id: number): Promise<Book> => {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },
};

// 认证相关API
export const authApi = {
  // 用户注册
  register: async (data: {
    username: string;
    email?: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // 用户登录
  login: async (data: {
    username: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
};

// 用户相关API
export const userApi = {
  // 获取用户信息
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/profile');
    return response.data;
  },
};

// 章节相关API
export const chapterApi = {
  // 获取章节详情
  getChapter: async (id: number): Promise<Chapter & { book: Pick<Book, 'id' | 'title' | 'author' | 'totalChapters'> }> => {
    const response = await api.get(`/chapters/${id}`);
    return response.data;
  },

  // 获取书籍章节列表
  getBookChapters: async (bookId: number): Promise<Chapter[]> => {
    const response = await api.get(`/books/${bookId}/chapters`);
    return response.data;
  },

  // 保存阅读记录
  saveReadingRecord: async (data: {
    userId: number;
    bookId: number;
    chapterId: number;
    progressPercentage: number;
    readingPosition: number;
  }) => {
    const response = await api.post('/reading-records', data);
    return response.data;
  },
};

export default api;