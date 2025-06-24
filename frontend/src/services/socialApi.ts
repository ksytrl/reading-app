// frontend/src/services/socialApi.ts
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

// 🎯 社交功能API
export const socialApi = {
  // 关注用户
  followUser: async (userId: number) => {
    try {
      const response = await api.post('/social/follow', { userId });
      return response.data;
    } catch (error: any) {
      console.error('关注用户失败:', error);
      throw error;
    }
  },

  // 取消关注用户
  unfollowUser: async (userId: number) => {
    try {
      const response = await api.delete(`/social/follow/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('取消关注失败:', error);
      throw error;
    }
  },

  // 获取关注列表
  getFollowing: async (userId?: number, page = 1, limit = 20) => {
    try {
      const response = await api.get('/social/following', {
        params: { userId, page, limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('获取关注列表失败:', error);
      return { users: [], total: 0 };
    }
  },

  // 获取粉丝列表
  getFollowers: async (userId?: number, page = 1, limit = 20) => {
    try {
      const response = await api.get('/social/followers', {
        params: { userId, page, limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('获取粉丝列表失败:', error);
      return { users: [], total: 0 };
    }
  },

  // 检查关注状态
  checkFollowStatus: async (userId: number) => {
    try {
      const response = await api.get(`/social/follow/status/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('检查关注状态失败:', error);
      return { isFollowing: false };
    }
  },

  // 分享书籍
  shareBook: async (bookId: number, data: {
    platform: string;
    content?: string;
  }) => {
    try {
      const response = await api.post('/social/share', {
        bookId,
        ...data
      });
      return response.data;
    } catch (error: any) {
      console.error('分享书籍失败:', error);
      throw error;
    }
  },

  // 获取分享记录
  getShareHistory: async (page = 1, limit = 20) => {
    try {
      const response = await api.get('/social/shares', {
        params: { page, limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('获取分享记录失败:', error);
      return { shares: [], total: 0 };
    }
  },

  // 创建讨论
  createDiscussion: async (data: {
    title: string;
    content: string;
    type: string;
    bookId?: number;
  }) => {
    try {
      const response = await api.post('/social/discussions', data);
      return response.data;
    } catch (error: any) {
      console.error('创建讨论失败:', error);
      throw error;
    }
  },

  // 获取讨论列表
  getDiscussions: async (params?: {
    bookId?: number;
    type?: string;
    page?: number;
    limit?: number;
    sortBy?: 'latest' | 'popular' | 'hot';
  }) => {
    try {
      const response = await api.get('/social/discussions', { params });
      return response.data;
    } catch (error: any) {
      console.error('获取讨论列表失败:', error);
      return { discussions: [], total: 0 };
    }
  },

  // 获取讨论详情
  getDiscussionDetail: async (discussionId: number) => {
    try {
      const response = await api.get(`/social/discussions/${discussionId}`);
      return response.data;
    } catch (error: any) {
      console.error('获取讨论详情失败:', error);
      throw error;
    }
  },

  // 回复讨论
  replyToDiscussion: async (discussionId: number, content: string) => {
    try {
      const response = await api.post(`/social/discussions/${discussionId}/replies`, {
        content
      });
      return response.data;
    } catch (error: any) {
      console.error('回复讨论失败:', error);
      throw error;
    }
  },

  // 点赞讨论
  likeDiscussion: async (discussionId: number) => {
    try {
      const response = await api.post(`/social/discussions/${discussionId}/like`);
      return response.data;
    } catch (error: any) {
      console.error('点赞讨论失败:', error);
      throw error;
    }
  },

  // 取消点赞讨论
  unlikeDiscussion: async (discussionId: number) => {
    try {
      const response = await api.delete(`/social/discussions/${discussionId}/like`);
      return response.data;
    } catch (error: any) {
      console.error('取消点赞失败:', error);
      throw error;
    }
  },

  // 获取社交统计
  getSocialStats: async () => {
    try {
      const response = await api.get('/social/stats');
      return response.data;
    } catch (error: any) {
      console.error('获取社交统计失败:', error);
      return {
        totalUsers: 0,
        totalDiscussions: 0,
        totalShares: 0,
        activeUsers: 0
      };
    }
  },

  // 搜索用户
  searchUsers: async (query: string, page = 1, limit = 20) => {
    try {
      const response = await api.get('/social/users/search', {
        params: { q: query, page, limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('搜索用户失败:', error);
      return { users: [], total: 0 };
    }
  },

  // 获取热门用户
  getPopularUsers: async (limit = 10) => {
    try {
      const response = await api.get('/social/users/popular', {
        params: { limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('获取热门用户失败:', error);
      return { users: [] };
    }
  },

  // 举报内容
  reportContent: async (data: {
    type: 'discussion' | 'reply' | 'user';
    targetId: number;
    reason: string;
    description?: string;
  }) => {
    try {
      const response = await api.post('/social/report', data);
      return response.data;
    } catch (error: any) {
      console.error('举报内容失败:', error);
      throw error;
    }
  }
};

export default socialApi;