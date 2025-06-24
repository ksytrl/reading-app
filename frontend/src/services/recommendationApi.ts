// frontend/src/services/recommendationApi.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🎯 推荐相关API
export const recommendationApi = {
  // 获取个性化推荐
  getPersonalizedRecommendations: async (params?: {
    limit?: number;
    offset?: number;
    algorithms?: string[];
  }) => {
    try {
      const response = await api.get('/recommendations/personalized', { params });
      return response.data;
    } catch (error: any) {
      console.error('获取个性化推荐失败:', error);
      // 返回模拟数据作为后备
      return {
        recommendations: [
          {
            book: {
              id: 1,
              title: '示例推荐书籍',
              author: '示例作者',
              description: '这是一本推荐的书籍...',
              rating: 4.5,
              viewCount: 1234,
              totalChapters: 100,
              cover: null,
              category: { name: '玄幻' }
            },
            score: 0.85,
            reason: '基于您的阅读历史',
            algorithm: 'collaborative' as const
          }
        ],
        total: 1,
        hasMore: false
      };
    }
  },

  // 获取热门推荐
  getTrendingRecommendations: async (params?: {
    limit?: number;
    category?: string;
    timeRange?: 'day' | 'week' | 'month';
  }) => {
    try {
      const response = await api.get('/recommendations/trending', { params });
      return response.data;
    } catch (error: any) {
      console.error('获取热门推荐失败:', error);
      return {
        recommendations: [],
        total: 0,
        hasMore: false
      };
    }
  },

  // 获取相似书籍推荐
  getSimilarBooks: async (bookId: number, limit = 10) => {
    try {
      const response = await api.get(`/recommendations/similar/${bookId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('获取相似书籍失败:', error);
      return { recommendations: [] };
    }
  },

  // 提交推荐反馈
  submitFeedback: async (bookId: number, isPositive: boolean, reason?: string) => {
    try {
      const response = await api.post('/recommendations/feedback', {
        bookId,
        isPositive,
        reason
      });
      return response.data;
    } catch (error: any) {
      console.error('提交推荐反馈失败:', error);
      throw error;
    }
  },

  // 获取推荐设置
  getRecommendationSettings: async () => {
    try {
      const response = await api.get('/recommendations/settings');
      return response.data;
    } catch (error: any) {
      console.error('获取推荐设置失败:', error);
      return {
        enableCollaborative: true,
        enableContent: true,
        enableTrending: true,
        preferredCategories: [],
        excludeReadBooks: true,
        minRating: 3.0
      };
    }
  },

  // 更新推荐设置
  updateRecommendationSettings: async (settings: any) => {
    try {
      const response = await api.put('/recommendations/settings', settings);
      return response.data;
    } catch (error: any) {
      console.error('更新推荐设置失败:', error);
      throw error;
    }
  },

  // 刷新推荐
  refreshRecommendations: async () => {
    try {
      const response = await api.post('/recommendations/refresh');
      return response.data;
    } catch (error: any) {
      console.error('刷新推荐失败:', error);
      throw error;
    }
  }
};

export default recommendationApi;