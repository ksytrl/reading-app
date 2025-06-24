// frontend/src/services/api.ts
import axios, { AxiosResponse, AxiosError } from 'axios';
import type { Book, BookListResponse, AuthResponse, User, Chapter } from '../types';
import { offlineStorage } from './offlineStorage';
import { syncManager } from './syncManager';

const API_BASE_URL = 'http://localhost:3001/api';

// 🔧 创建Axios实例
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30秒超时
});

// 🌐 网络状态检测
let isOnline = navigator.onLine;
let offlineQueue: Array<() => Promise<any>> = [];

window.addEventListener('online', () => {
  isOnline = true;
  console.log('🌐 网络已恢复，处理离线队列');
  processOfflineQueue();
});

window.addEventListener('offline', () => {
  isOnline = false;
  console.log('🔌 网络已断开，启用离线模式');
});

// 🔄 处理离线队列
const processOfflineQueue = async () => {
  const queue = [...offlineQueue];
  offlineQueue = [];
  
  for (const request of queue) {
    try {
      await request();
    } catch (error) {
      console.error('离线队列请求失败:', error);
    }
  }
};

// 🎯 请求拦截器 - 添加认证Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 🔍 记录请求信息
    console.log(`🔗 API请求: ${config.method?.toUpperCase()} ${config.url}`, {
      isOnline,
      hasAuth: !!token,
      timestamp: new Date().toISOString()
    });
    
    return config;
  },
  (error) => {
    console.error('❌ 请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 🎯 响应拦截器 - 处理离线缓存和错误
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API响应: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      isOnline,
      timestamp: new Date().toISOString()
    });
    
    // 📦 成功响应时缓存数据（仅GET请求）
    if (response.config.method === 'get' && response.status === 200) {
      cacheResponseData(response.config.url || '', response.data);
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const { config, response } = error;
    
    console.error(`❌ API错误: ${config?.method?.toUpperCase()} ${config?.url}`, {
      status: response?.status,
      isOnline,
      message: error.message,
      timestamp: new Date().toISOString()
    });
    
    // 🔄 网络错误时尝试从缓存获取数据
    if (!isOnline || error.code === 'NETWORK_ERROR' || !response) {
      if (config?.method === 'get') {
        const cachedData = await getCachedData(config.url || '');
        if (cachedData) {
          console.log('📦 返回缓存数据:', config.url);
          return {
            ...response,
            data: cachedData,
            status: 200,
            statusText: 'OK (Cached)',
            headers: {},
            config: config!
          } as AxiosResponse;
        }
      }
      
      // 📝 POST/PUT/DELETE请求加入离线队列
      if (config && ['post', 'put', 'delete', 'patch'].includes(config.method || '')) {
        addToOfflineQueue(config);
      }
    }
    
    // 🚫 401错误处理
    if (response?.status === 401) {
      console.warn('🚫 认证失败，清除Token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 🔄 跳转到登录页（避免无限循环）
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// 📦 缓存响应数据
const cacheResponseData = async (url: string, data: any) => {
  try {
    const cacheKey = getCacheKey(url);
    await offlineStorage.setCacheItem(cacheKey, {
      data,
      timestamp: Date.now(),
      url
    });
  } catch (error) {
    console.warn('缓存数据失败:', error);
  }
};

// 📖 获取缓存数据
const getCachedData = async (url: string) => {
  try {
    const cacheKey = getCacheKey(url);
    const cached = await offlineStorage.getCacheItem(cacheKey);
    
    if (cached) {
      // 🕐 检查缓存是否过期（24小时）
      const age = Date.now() - cached.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24小时
      
      if (age < maxAge) {
        return cached.data;
      } else {
        // 🗑️ 清除过期缓存
        await offlineStorage.removeCacheItem(cacheKey);
      }
    }
  } catch (error) {
    console.warn('获取缓存数据失败:', error);
  }
  
  return null;
};

// 🔑 生成缓存键
const getCacheKey = (url: string): string => {
  // 移除基础URL和查询参数中的时间戳
  const cleanUrl = url.replace(API_BASE_URL, '').split('?')[0];
  return `api_cache_${cleanUrl.replace(/\//g, '_')}`;
};

// 📝 添加到离线队列
const addToOfflineQueue = (config: any) => {
  const retryRequest = async () => {
    try {
      const response = await api.request(config);
      console.log('✅ 离线队列请求成功:', config.url);
      return response;
    } catch (error) {
      console.error('❌ 离线队列请求失败:', config.url, error);
      throw error;
    }
  };
  
  offlineQueue.push(retryRequest);
  console.log(`📝 已添加到离线队列: ${config.method?.toUpperCase()} ${config.url}`);
};

// ===== 书籍相关API =====
export const bookApi = {
  // 📚 获取书籍列表
  getBooks: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sort?: string;
  }): Promise<BookListResponse> => {
    const response = await api.get('/books', { params });
    return response.data;
  },

  // 📖 获取书籍详情
  getBook: async (id: number): Promise<Book> => {
    // 🔍 优先从缓存获取
    if (!isOnline) {
      const cachedBook = await offlineStorage.getBook(id);
      if (cachedBook) {
        console.log('📦 从缓存获取书籍:', id);
        return cachedBook;
      }
      throw new Error('书籍未缓存，无法离线访问');
    }
    
    const response = await api.get(`/books/${id}`);
    
    // 📦 缓存书籍数据
    await offlineStorage.saveBook(response.data);
    
    return response.data;
  },

  // 📁 上传书籍（支持多格式）
  uploadBook: async (file: File, onProgress?: (progress: number) => void): Promise<{
    message: string;
    book: {
      id: number;
      title: string;
      author: string;
      totalChapters: number;
      totalWords: number;
      format: string;
    };
    chaptersCount: number;
    addedToBookshelf: boolean;
  }> => {
    const formData = new FormData();
    formData.append('file', file); // 支持多格式文件
    
    const response = await api.post('/books/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5分钟超时（上传较大文件）
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
    
    return response.data;
  },

  // 🔄 格式转换
  convertFormat: async (bookId: number, targetFormat: string): Promise<{
    message: string;
    convertedUrl: string;
    status: 'processing' | 'completed' | 'failed';
  }> => {
    const response = await api.post(`/books/${bookId}/convert`, {
      targetFormat
    });
    return response.data;
  },

  // 📋 获取支持的格式
  getSupportedFormats: async (): Promise<{
    input: string[];
    output: string[];
    conversions: Record<string, string[]>;
  }> => {
    const response = await api.get('/formats/supported');
    return response.data;
  },

  // 🗑️ 删除书籍
  deleteBook: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/books/${id}`);
    
    // 🧹 清理本地缓存
    await offlineStorage.removeBook(id);
    
    return response.data;
  },

  // 📤 分享书籍
  shareBook: async (bookId: number, data: {
    platform: string;
    content?: string;
  }): Promise<{ message: string; shareUrl: string; shareId: number }> => {
    const response = await api.post(`/books/${bookId}/share`, data);
    return response.data;
  },

  // 🔍 获取相似书籍
  getSimilarBooks: async (bookId: number, limit = 5): Promise<Book[]> => {
    const response = await api.get(`/books/${bookId}/similar`, {
      params: { limit }
    });
    return response.data;
  },
};

// ===== 章节相关API =====
export const chapterApi = {
  // 📖 获取章节内容（支持多格式）
  getChapter: async (id: number, format?: string): Promise<Chapter & {
    htmlContent?: string;
    markdownContent?: string;
  }> => {
    // 🔍 优先从缓存获取
    if (!isOnline) {
      const cachedChapter = await offlineStorage.getChapter(id);
      if (cachedChapter) {
        console.log('📦 从缓存获取章节:', id);
        return cachedChapter;
      }
      throw new Error('章节未缓存，无法离线阅读');
    }
    
    const response = await api.get(`/chapters/${id}`, {
      params: { format }
    });
    
    // 📦 缓存章节内容
    await offlineStorage.saveChapter(response.data);
    
    return response.data;
  },

  // 📚 获取书籍章节列表
  getBookChapters: async (bookId: number): Promise<Chapter[]> => {
    // 🔍 优先从缓存获取
    if (!isOnline) {
      const cachedChapters = await offlineStorage.getBookChapters(bookId);
      if (cachedChapters.length > 0) {
        console.log('📦 从缓存获取章节列表:', bookId);
        return cachedChapters;
      }
      throw new Error('章节列表未缓存，无法离线访问');
    }
    
    const response = await api.get(`/books/${bookId}/chapters`);
    
    // 📦 缓存章节列表
    await offlineStorage.saveBookChapters(bookId, response.data);
    
    return response.data;
  },
};

// ===== 用户认证API =====
export const authApi = {
  // 📝 用户注册
  register: async (data: {
    username: string;
    email?: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    
    // 💾 保存认证信息
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  // 🔐 用户登录
  login: async (data: {
    username: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    
    // 💾 保存认证信息
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  // 🚪 用户登出
  logout: async (): Promise<void> => {
    // 🧹 清理本地数据
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 🗑️ 清理缓存（可选）
    // await offlineStorage.clearAllCache();
  },
};

// ===== 用户相关API =====
export const userApi = {
  // 👤 获取用户信息
  getProfile: async (): Promise<User> => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // 📚 获取用户书架
  getBookshelf: async (): Promise<any[]> => {
    const response = await api.get('/users/bookshelf');
    return response.data;
  },

  // 📖 获取用户上传的书籍
  getUserBooks: async (): Promise<Book[]> => {
    const response = await api.get('/users/books');
    return response.data;
  },

  // ➕ 添加到书架
  addToBookshelf: async (bookId: number): Promise<{ message: string }> => {
    const response = await api.post('/users/bookshelf', { bookId });
    return response.data;
  },

  // ➖ 从书架移除
  removeFromBookshelf: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/users/bookshelf/${id}`);
    return response.data;
  },

  // ⭐ 切换收藏
  toggleFavorite: async (id: number): Promise<{ message: string; isFavorite: boolean }> => {
    const response = await api.patch(`/users/bookshelf/${id}/favorite`);
    return response.data;
  },

  // 🔍 检查书架状态
  checkBookshelfStatus: async (bookId: number): Promise<{ inBookshelf: boolean; bookshelfId?: number; isFavorite?: boolean }> => {
    const response = await api.get(`/users/bookshelf/check/${bookId}`);
    return response.data;
  },

  // 👥 关注用户
  followUser: async (userId: number): Promise<{ message: string }> => {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data;
  },

  // 👥 取消关注
  unfollowUser: async (userId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/users/${userId}/follow`);
    return response.data;
  },

  // 📊 获取关注列表
  getFollowing: async (userId: number): Promise<User[]> => {
    const response = await api.get(`/users/${userId}/following`);
    return response.data;
  },

  // 📊 获取粉丝列表
  getFollowers: async (userId: number): Promise<User[]> => {
    const response = await api.get(`/users/${userId}/followers`);
    return response.data;
  },

  // 🔍 检查关注状态
  checkFollowStatus: async (userId: number): Promise<{ isFollowing: boolean }> => {
    const response = await api.get(`/users/${userId}/follow-status`);
    return response.data;
  },
};

// ===== 🎯 推荐系统API =====
export const recommendationApi = {
  // 🎯 获取个性化推荐
  getPersonalizedRecommendations: async (params?: {
    limit?: number;
    algorithms?: string[];
  }): Promise<{
    recommendations: Array<{
      book: Book;
      score: number;
      reason: string;
      algorithm: string;
    }>;
    type: string;
  }> => {
    const response = await api.get('/recommendations', { params });
    return response.data;
  },

  // 🔥 获取热门推荐
  getTrendingRecommendations: async (params?: {
    limit?: number;
    timeframe?: 'day' | 'week' | 'month';
    category?: string;
  }): Promise<{
    recommendations: Array<{
      book: Book;
      score: number;
      reason: string;
      algorithm: string;
    }>;
    type: string;
  }> => {
    const response = await api.get('/recommendations/trending', { params });
    return response.data;
  },

  // 📊 提交推荐反馈
  submitFeedback: async (bookId: number, isPositive: boolean, reason?: string): Promise<{
    message: string;
  }> => {
    const response = await api.post(`/recommendations/${bookId}/feedback`, {
      isPositive,
      reason
    });
    return response.data;
  },

  // ⚙️ 获取推荐设置
  getRecommendationSettings: async (): Promise<{
    algorithms: string[];
    categories: string[];
    excludeRead: boolean;
    minRating: number;
  }> => {
    const response = await api.get('/recommendations/settings');
    return response.data;
  },

  // ⚙️ 更新推荐设置
  updateRecommendationSettings: async (settings: {
    algorithms?: string[];
    categories?: string[];
    excludeRead?: boolean;
    minRating?: number;
  }): Promise<{ message: string }> => {
    const response = await api.put('/recommendations/settings', settings);
    return response.data;
  },
};

// ===== 💬 社交功能API =====
export const socialApi = {
  // 💬 创建讨论
  createDiscussion: async (data: {
    title: string;
    content: string;
    type: string;
    bookId?: number;
  }): Promise<any> => {
    const response = await api.post('/discussions', data);
    return response.data;
  },

  // 💬 获取讨论列表
  getDiscussions: async (params?: {
    bookId?: number;
    type?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<{
    discussions: any[];
    pagination: any;
  }> => {
    const response = await api.get('/discussions', { params });
    return response.data;
  },

  // 💬 获取讨论详情
  getDiscussion: async (discussionId: number): Promise<any> => {
    const response = await api.get(`/discussions/${discussionId}`);
    return response.data;
  },

  // 💭 创建评论
  createComment: async (discussionId: number, data: {
    content: string;
    parentId?: number;
  }): Promise<any> => {
    const response = await api.post(`/discussions/${discussionId}/comments`, data);
    return response.data;
  },

  // 💭 获取评论列表
  getComments: async (discussionId: number): Promise<any[]> => {
    const response = await api.get(`/discussions/${discussionId}/comments`);
    return response.data;
  },

  // 👍 添加反应
  addReaction: async (data: {
    type: 'LIKE' | 'DISLIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';
    bookId?: number;
    reviewId?: number;
    discussionId?: number;
    commentId?: number;
  }): Promise<{ message: string }> => {
    const response = await api.post('/reactions', data);
    return response.data;
  },

  // 📊 获取分享统计
  getShareStats: async (bookId: number): Promise<{
    totalShares: number;
    platformBreakdown: Record<string, number>;
  }> => {
    const response = await api.get(`/books/${bookId}/share-stats`);
    return response.data;
  },
};

// ===== 阅读记录API =====
export const readingApi = {
  // 💾 保存阅读进度
  saveProgress: async (data: {
    bookId: number;
    chapterId: number;
    progressPercentage: number;
    readingPosition: number;
  }): Promise<{ message: string }> => {
    try {
      const response = await api.post('/reading-records', data);
      return response.data;
    } catch (error) {
      // 🔌 离线时存储到本地
      if (!isOnline) {
        await syncManager.addToSyncQueue('reading_progress', {
          ...data,
          timestamp: Date.now(),
        });
        return { message: '阅读进度已离线保存' };
      }
      throw error;
    }
  },

  // 📊 获取阅读记录
  getReadingHistory: async (): Promise<any[]> => {
    const response = await api.get('/reading-records');
    return response.data;
  },

  // 📊 获取阅读统计
  getReadingStats: async (): Promise<{
    totalReadingTime: number;
    booksRead: number;
    chaptersRead: number;
    wordsRead: number;
    averageReadingSpeed: number;
    readingStreak: number;
    favoriteCategories: Array<{ category: string; count: number }>;
    monthlyProgress: Array<{ month: string; books: number; time: number }>;
  }> => {
    const response = await api.get('/users/stats/reading');
    return response.data;
  },
};

// ===== 评论相关API =====
export const reviewApi = {
  // 📚 获取书籍评论列表（公开）
  getBookReviews: async (bookId: number, params?: {
    page?: number;
    limit?: number;
    sortBy?: 'latest' | 'rating';
  }) => {
    const response = await api.get(`/books/${bookId}/reviews`, { params });
    return response.data;
  },

  // 👤 获取我的评论（需要认证）
  getMyReview: async (bookId: number) => {
    const response = await api.get(`/books/${bookId}/reviews/my`);
    return response.data;
  },

  // ✍️ 创建评论（需要认证）
  createReview: async (bookId: number, data: {
    rating: number;
    content: string;
  }) => {
    const response = await api.post(`/books/${bookId}/reviews`, data);
    return response.data;
  },

  // ✏️ 更新评论（需要认证）
  updateReview: async (reviewId: number, data: {
    rating: number;
    content: string;
  }) => {
    const response = await api.patch(`/reviews/${reviewId}`, data);
    return response.data;
  },

  // 🗑️ 删除评论（需要认证）
  deleteReview: async (reviewId: number) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },
};

// ===== 🔍 搜索和发现API =====
export const discoveryApi = {
  // 🔍 高级搜索
  advancedSearch: async (params: {
    query?: string;
    categories?: string[];
    authors?: string[];
    tags?: string[];
    status?: string[];
    rating?: { min: number; max: number };
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{
    books: Book[];
    discussions: any[];
    users: User[];
    pagination: any;
    facets: any;
  }> => {
    const response = await api.post('/search/advanced', params);
    return response.data;
  },

  // 🎯 搜索建议
  getSearchSuggestions: async (query: string): Promise<{
    books: Array<{ id: number; title: string; author: string }>;
    authors: string[];
    categories: string[];
    tags: string[];
  }> => {
    const response = await api.get('/search/suggestions', {
      params: { q: query }
    });
    return response.data;
  },

  // 🔥 发现新内容
  discoverContent: async (params?: {
    mood?: string;
    timeAvailable?: number;
    lastReadCategory?: string;
    excludeGenres?: string[];
  }): Promise<{
    recommendations: Book[];
    reason: string;
    filters: any;
  }> => {
    const response = await api.get('/discovery/content', { params });
    return response.data;
  },
};

// ===== 📊 统计API =====
export const statsApi = {
  // 📊 获取平台统计
  getPlatformStats: async (): Promise<{
    totalUsers: number;
    totalBooks: number;
    totalChapters: number;
    totalReadingTime: number;
    activeUsers: number;
    popularCategories: Array<{ name: string; count: number }>;
    recentActivity: any[];
  }> => {
    const response = await api.get('/stats/platform');
    return response.data;
  },

  // 🔥 获取热门内容
  getTrendingContent: async (timeframe: 'day' | 'week' | 'month' = 'week'): Promise<{
    trendingBooks: Book[];
    popularDiscussions: any[];
    activeUsers: User[];
    hotTopics: Array<{ topic: string; count: number }>;
  }> => {
    const response = await api.get('/stats/trending', {
      params: { timeframe }
    });
    return response.data;
  },
};

// ===== 离线相关工具函数 =====
export const offlineApi = {
  // 🔄 手动同步数据
  syncOfflineData: async (): Promise<{ success: boolean; message: string }> => {
    if (!isOnline) {
      return { success: false, message: '网络未连接，无法同步' };
    }
    
    try {
      await syncManager.syncAll();
      return { success: true, message: '数据同步完成' };
    } catch (error) {
      console.error('数据同步失败:', error);
      return { success: false, message: '数据同步失败' };
    }
  },

  // 📊 获取缓存统计
  getCacheStats: async (): Promise<{
    totalSize: number;
    bookCount: number;
    chapterCount: number;
    lastSync: string | null;
  }> => {
    return await offlineStorage.getCacheStats();
  },

  // 🧹 清理缓存
  clearCache: async (type?: 'books' | 'chapters' | 'api' | 'all'): Promise<{ message: string }> => {
    switch (type) {
      case 'books':
        await offlineStorage.clearBooks();
        break;
      case 'chapters':
        await offlineStorage.clearChapters();
        break;
      case 'api':
        await offlineStorage.clearApiCache();
        break;
      default:
        await offlineStorage.clearAllCache();
        break;
    }
    
    return { message: '缓存清理完成' };
  },
};

// 🔧 导出网络状态检测函数
export const getNetworkStatus = () => ({
  isOnline,
  offlineQueueLength: offlineQueue.length,
});

// 🎯 默认导出
export default api;