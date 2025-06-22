// src/types/index.ts
export interface User {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  isVip: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
}

// 确保Chapter接口包含所有必要字段
export interface Chapter {
  id: number;
  bookId: number;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  isFree: boolean;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  categoryId?: number;
  cover?: string;
  description?: string;
  totalWords: number;
  totalChapters: number;
  status: 'ONGOING' | 'COMPLETED' | 'PAUSED';
  isFree: boolean;
  price: number;
  rating: number;
  isFeatured: boolean;
  tags: string[];
  viewCount: number;
  favoriteCount: number;
  category?: Category;
  chapters?: Chapter[];
  _count?: {
    chapters: number;
    reviews: number;
    bookshelf: number;
  };
  createdAt: string;
  updatedAt: string;
  lastChapterUpdate?: string;
}

export interface BookListResponse {
  books: Book[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}