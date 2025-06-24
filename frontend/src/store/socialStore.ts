// frontend/src/store/socialStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { socialApi } from '../services/enhancedApi';

// 🎯 社交功能状态接口
interface SocialState {
  // 👥 关注相关
  following: Set<number>;
  followers: Record<number, any[]>;
  followingList: Record<number, any[]>;
  followLoading: Set<number>;

  // 💬 讨论相关
  discussions: any[];
  currentDiscussion: any | null;
  discussionComments: Record<number, any[]>;
  discussionLoading: boolean;

  // 📤 分享相关
  shares: any[];
  shareStats: Record<number, any>;

  // 👍 反应相关
  reactions: Record<string, any[]>;
  userReactions: Record<string, string>; // 用户在各个内容上的反应类型

  // 📊 统计
  socialStats: {
    totalUsers: number;
    totalDiscussions: number;
    totalShares: number;
    activeUsers: number;
  };
}

interface SocialActions {
  // 👥 关注操作
  followUser: (userId: number) => Promise<void>;
  unfollowUser: (userId: number) => Promise<void>;
  loadFollowers: (userId: number) => Promise<void>;
  loadFollowing: (userId: number) => Promise<void>;
  checkFollowStatus: (userId: number) => Promise<boolean>;

  // 💬 讨论操作
  loadDiscussions: (params?: any) => Promise<void>;
  loadDiscussion: (discussionId: number) => Promise<void>;
  createDiscussion: (data: any) => Promise<void>;
  updateDiscussion: (discussionId: number, data: any) => Promise<void>;
  deleteDiscussion: (discussionId: number) => Promise<void>;
  
  // 💭 评论操作
  loadComments: (discussionId: number) => Promise<void>;
  createComment: (discussionId: number, data: any) => Promise<void>;
  updateComment: (commentId: number, data: any) => Promise<void>;
  deleteComment: (commentId: number) => Promise<void>;

  // 📤 分享操作
  shareBook: (bookId: number, data: any) => Promise<string>;
  loadShares: () => Promise<void>;
  loadShareStats: (bookId: number) => Promise<void>;

  // 👍 反应操作
  addReaction: (data: any) => Promise<void>;
  removeReaction: (reactionId: number) => Promise<void>;
  loadReactions: (params: any) => Promise<void>;

  // 🧹 清理操作
  clearSocialData: () => void;
  clearDiscussion: () => void;
}

export const useSocialStore = create<SocialState & SocialActions>()(
  persist(
    (set, get) => ({
      // 📊 初始状态
      following: new Set(),
      followers: {},
      followingList: {},
      followLoading: new Set(),
      discussions: [],
      currentDiscussion: null,
      discussionComments: {},
      discussionLoading: false,
      shares: [],
      shareStats: {},
      reactions: {},
      userReactions: {},
      socialStats: {
        totalUsers: 0,
        totalDiscussions: 0,
        totalShares: 0,
        activeUsers: 0,
      },

      // 👥 关注操作
      followUser: async (userId: number) => {
        const { followLoading } = get();
        if (followLoading.has(userId)) return;

        set(state => ({
          followLoading: new Set([...state.followLoading, userId])
        }));

        try {
          await socialApi.followUser(userId);
          set(state => ({
            following: new Set([...state.following, userId])
          }));
        } catch (error) {
          throw error;
        } finally {
          set(state => {
            const newFollowLoading = new Set(state.followLoading);
            newFollowLoading.delete(userId);
            return { followLoading: newFollowLoading };
          });
        }
      },

      unfollowUser: async (userId: number) => {
        const { followLoading } = get();
        if (followLoading.has(userId)) return;

        set(state => ({
          followLoading: new Set([...state.followLoading, userId])
        }));

        try {
          await socialApi.unfollowUser(userId);
          set(state => {
            const newFollowing = new Set(state.following);
            newFollowing.delete(userId);
            return { following: newFollowing };
          });
        } catch (error) {
          throw error;
        } finally {
          set(state => {
            const newFollowLoading = new Set(state.followLoading);
            newFollowLoading.delete(userId);
            return { followLoading: newFollowLoading };
          });
        }
      },

      loadFollowers: async (userId: number) => {
        try {
          const followers = await socialApi.getFollowers(userId);
          set(state => ({
            followers: { ...state.followers, [userId]: followers }
          }));
        } catch (error) {
          console.error('加载粉丝列表失败:', error);
        }
      },

      loadFollowing: async (userId: number) => {
        try {
          const following = await socialApi.getFollowing(userId);
          set(state => ({
            followingList: { ...state.followingList, [userId]: following }
          }));
        } catch (error) {
          console.error('加载关注列表失败:', error);
        }
      },

      checkFollowStatus: async (userId: number): Promise<boolean> => {
        try {
          const { isFollowing } = await socialApi.checkFollowStatus(userId);
          if (isFollowing) {
            set(state => ({
              following: new Set([...state.following, userId])
            }));
          }
          return isFollowing;
        } catch (error) {
          console.error('检查关注状态失败:', error);
          return false;
        }
      },

      // 💬 讨论操作
      loadDiscussions: async (params = {}) => {
        set({ discussionLoading: true });
        try {
          const { discussions } = await socialApi.getDiscussions(params);
          set({ discussions, discussionLoading: false });
        } catch (error) {
          console.error('加载讨论失败:', error);
          set({ discussionLoading: false });
        }
      },

      loadDiscussion: async (discussionId: number) => {
        try {
          const discussion = await socialApi.getDiscussion(discussionId);
          set({ currentDiscussion: discussion });
        } catch (error) {
          console.error('加载讨论详情失败:', error);
        }
      },

      createDiscussion: async (data: any) => {
        try {
          const { discussion } = await socialApi.createDiscussion(data);
          set(state => ({
            discussions: [discussion, ...state.discussions]
          }));
        } catch (error) {
          throw error;
        }
      },

      updateDiscussion: async (discussionId: number, data: any) => {
        try {
          await socialApi.updateDiscussion(discussionId, data);
          set(state => ({
            discussions: state.discussions.map(d => 
              d.id === discussionId ? { ...d, ...data } : d
            ),
            currentDiscussion: state.currentDiscussion?.id === discussionId 
              ? { ...state.currentDiscussion, ...data } 
              : state.currentDiscussion
          }));
        } catch (error) {
          throw error;
        }
      },

      deleteDiscussion: async (discussionId: number) => {
        try {
          await socialApi.deleteDiscussion(discussionId);
          set(state => ({
            discussions: state.discussions.filter(d => d.id !== discussionId),
            currentDiscussion: state.currentDiscussion?.id === discussionId 
              ? null 
              : state.currentDiscussion
          }));
        } catch (error) {
          throw error;
        }
      },

      // 💭 评论操作
      loadComments: async (discussionId: number) => {
        try {
          const comments = await socialApi.getComments(discussionId);
          set(state => ({
            discussionComments: { ...state.discussionComments, [discussionId]: comments }
          }));
        } catch (error) {
          console.error('加载评论失败:', error);
        }
      },

      createComment: async (discussionId: number, data: any) => {
        try {
          const comment = await socialApi.createComment(discussionId, data);
          set(state => ({
            discussionComments: {
              ...state.discussionComments,
              [discussionId]: [...(state.discussionComments[discussionId] || []), comment]
            }
          }));
        } catch (error) {
          throw error;
        }
      },

      updateComment: async (commentId: number, data: any) => {
        try {
          await socialApi.updateComment(commentId, data);
          // 更新评论列表中的评论
          set(state => {
            const newComments = { ...state.discussionComments };
            Object.keys(newComments).forEach(discussionId => {
              newComments[parseInt(discussionId)] = newComments[parseInt(discussionId)].map(comment =>
                comment.id === commentId ? { ...comment, ...data } : comment
              );
            });
            return { discussionComments: newComments };
          });
        } catch (error) {
          throw error;
        }
      },

      deleteComment: async (commentId: number) => {
        try {
          await socialApi.deleteComment(commentId);
          // 从评论列表中删除评论
          set(state => {
            const newComments = { ...state.discussionComments };
            Object.keys(newComments).forEach(discussionId => {
              newComments[parseInt(discussionId)] = newComments[parseInt(discussionId)].filter(comment =>
                comment.id !== commentId
              );
            });
            return { discussionComments: newComments };
          });
        } catch (error) {
          throw error;
        }
      },

      // 📤 分享操作
      shareBook: async (bookId: number, data: any): Promise<string> => {
        try {
          const result = await socialApi.shareBook(bookId, data);
          set(state => ({
            shares: [result, ...state.shares]
          }));
          return result.shareUrl;
        } catch (error) {
          throw error;
        }
      },

      loadShares: async () => {
        try {
          const shares = await socialApi.getUserShares();
          set({ shares });
        } catch (error) {
          console.error('加载分享列表失败:', error);
        }
      },

      loadShareStats: async (bookId: number) => {
        try {
          const stats = await socialApi.getShareStats(bookId);
          set(state => ({
            shareStats: { ...state.shareStats, [bookId]: stats }
          }));
        } catch (error) {
          console.error('加载分享统计失败:', error);
        }
      },

      // 👍 反应操作
      addReaction: async (data: any) => {
        try {
          await socialApi.addReaction(data);
          const key = `${data.bookId || ''}-${data.reviewId || ''}-${data.discussionId || ''}-${data.commentId || ''}`;
          set(state => ({
            userReactions: { ...state.userReactions, [key]: data.type }
          }));
        } catch (error) {
          throw error;
        }
      },

      removeReaction: async (reactionId: number) => {
        try {
          await socialApi.removeReaction(reactionId);
          // 这里需要更复杂的逻辑来移除对应的反应
        } catch (error) {
          throw error;
        }
      },

      loadReactions: async (params: any) => {
        try {
          const reactions = await socialApi.getReactions(params);
          const key = `${params.bookId || ''}-${params.reviewId || ''}-${params.discussionId || ''}-${params.commentId || ''}`;
          set(state => ({
            reactions: { ...state.reactions, [key]: reactions }
          }));
        } catch (error) {
          console.error('加载反应失败:', error);
        }
      },

      // 🧹 清理操作
      clearSocialData: () => {
        set({
          following: new Set(),
          followers: {},
          followingList: {},
          discussions: [],
          currentDiscussion: null,
          discussionComments: {},
          shares: [],
          shareStats: {},
          reactions: {},
          userReactions: {},
        });
      },

      clearDiscussion: () => {
        set({
          currentDiscussion: null,
          discussionComments: {},
        });
      },
    }),
    {
      name: 'social-store',
      partialize: (state) => ({
        following: Array.from(state.following),
        userReactions: state.userReactions,
        socialStats: state.socialStats,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 重新转换为Set
          state.following = new Set(state.following as any);
          state.followLoading = new Set();
        }
      },
    }
  )
);

// ===== 推荐系统状态管理 =====
interface RecommendationState {
  // 📚 推荐内容
  personalizedRecommendations: any[];
  trendingRecommendations: any[];
  randomRecommendations: any[];
  
  // ⚙️ 推荐设置
  settings: {
    algorithms: string[];
    categories: string[];
    excludeRead: boolean;
    minRating: number;
  };
  
  // 📊 推荐统计
  stats: {
    totalRecommendations: number;
    clickedRecommendations: number;
    addedToBookshelf: number;
    averageScore: number;
    algorithmPerformance: Record<string, number>;
  };
  
  // 🎯 状态管理
  loading: {
    personalized: boolean;
    trending: boolean;
    random: boolean;
    settings: boolean;
  };
  
  // 📝 反馈记录
  feedback: Record<number, boolean>; // bookId -> isPositive
  lastRefresh: number;
}

interface RecommendationActions {
  // 📚 加载推荐
  loadPersonalizedRecommendations: (refresh?: boolean) => Promise<void>;
  loadTrendingRecommendations: (params?: any) => Promise<void>;
  loadRandomRecommendations: (params?: any) => Promise<void>;
  
  // 🎯 推荐交互
  submitFeedback: (bookId: number, isPositive: boolean, reason?: string) => Promise<void>;
  markRecommendationClicked: (bookId: number) => void;
  markRecommendationAdded: (bookId: number) => void;
  
  // ⚙️ 设置管理
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<RecommendationState['settings']>) => Promise<void>;
  
  // 📊 统计管理
  loadStats: () => Promise<void>;
  
  // 🧹 清理操作
  clearRecommendations: () => void;
  refreshAll: () => Promise<void>;
}

export const useRecommendationStore = create<RecommendationState & RecommendationActions>()(
  persist(
    (set, get) => ({
      // 📊 初始状态
      personalizedRecommendations: [],
      trendingRecommendations: [],
      randomRecommendations: [],
      settings: {
        algorithms: ['hybrid', 'collaborative', 'content'],
        categories: [],
        excludeRead: true,
        minRating: 3.0,
      },
      stats: {
        totalRecommendations: 0,
        clickedRecommendations: 0,
        addedToBookshelf: 0,
        averageScore: 0,
        algorithmPerformance: {},
      },
      loading: {
        personalized: false,
        trending: false,
        random: false,
        settings: false,
      },
      feedback: {},
      lastRefresh: 0,

      // 📚 加载推荐
      loadPersonalizedRecommendations: async (refresh = false) => {
        const { lastRefresh } = get();
        const now = Date.now();
        
        // 如果不是强制刷新且距离上次刷新不到30分钟，则跳过
        if (!refresh && now - lastRefresh < 30 * 60 * 1000) {
          return;
        }

        set(state => ({
          loading: { ...state.loading, personalized: true }
        }));

        try {
          const { recommendations } = await recommendationApi.getPersonalizedRecommendations();
          set(state => ({
            personalizedRecommendations: recommendations,
            loading: { ...state.loading, personalized: false },
            lastRefresh: now
          }));
        } catch (error) {
          console.error('加载个性化推荐失败:', error);
          set(state => ({
            loading: { ...state.loading, personalized: false }
          }));
        }
      },

      loadTrendingRecommendations: async (params = {}) => {
        set(state => ({
          loading: { ...state.loading, trending: true }
        }));

        try {
          const { recommendations } = await recommendationApi.getTrendingRecommendations(params);
          set(state => ({
            trendingRecommendations: recommendations,
            loading: { ...state.loading, trending: false }
          }));
        } catch (error) {
          console.error('加载热门推荐失败:', error);
          set(state => ({
            loading: { ...state.loading, trending: false }
          }));
        }
      },

      loadRandomRecommendations: async (params = {}) => {
        set(state => ({
          loading: { ...state.loading, random: true }
        }));

        try {
          const { recommendations } = await recommendationApi.getRandomRecommendations(params);
          set(state => ({
            randomRecommendations: recommendations,
            loading: { ...state.loading, random: false }
          }));
        } catch (error) {
          console.error('加载随机推荐失败:', error);
          set(state => ({
            loading: { ...state.loading, random: false }
          }));
        }
      },

      // 🎯 推荐交互
      submitFeedback: async (bookId: number, isPositive: boolean, reason?: string) => {
        try {
          await recommendationApi.submitFeedback(bookId, isPositive, reason);
          set(state => ({
            feedback: { ...state.feedback, [bookId]: isPositive }
          }));
        } catch (error) {
          throw error;
        }
      },

      markRecommendationClicked: (bookId: number) => {
        set(state => ({
          stats: {
            ...state.stats,
            clickedRecommendations: state.stats.clickedRecommendations + 1
          }
        }));
      },

      markRecommendationAdded: (bookId: number) => {
        set(state => ({
          stats: {
            ...state.stats,
            addedToBookshelf: state.stats.addedToBookshelf + 1
          }
        }));
      },

      // ⚙️ 设置管理
      loadSettings: async () => {
        set(state => ({
          loading: { ...state.loading, settings: true }
        }));

        try {
          const settings = await recommendationApi.getRecommendationSettings();
          set(state => ({
            settings,
            loading: { ...state.loading, settings: false }
          }));
        } catch (error) {
          console.error('加载推荐设置失败:', error);
          set(state => ({
            loading: { ...state.loading, settings: false }
          }));
        }
      },

      updateSettings: async (newSettings: Partial<RecommendationState['settings']>) => {
        try {
          await recommendationApi.updateRecommendationSettings(newSettings);
          set(state => ({
            settings: { ...state.settings, ...newSettings }
          }));
          
          // 设置更新后重新加载推荐
          get().loadPersonalizedRecommendations(true);
        } catch (error) {
          throw error;
        }
      },

      // 📊 统计管理
      loadStats: async () => {
        try {
          const stats = await recommendationApi.getRecommendationStats();
          set({ stats });
        } catch (error) {
          console.error('加载推荐统计失败:', error);
        }
      },

      // 🧹 清理操作
      clearRecommendations: () => {
        set({
          personalizedRecommendations: [],
          trendingRecommendations: [],
          randomRecommendations: [],
          feedback: {},
          lastRefresh: 0,
        });
      },

      refreshAll: async () => {
        const actions = get();
        await Promise.all([
          actions.loadPersonalizedRecommendations(true),
          actions.loadTrendingRecommendations(),
          actions.loadStats(),
        ]);
      },
    }),
    {
      name: 'recommendation-store',
      partialize: (state) => ({
        settings: state.settings,
        feedback: state.feedback,
        lastRefresh: state.lastRefresh,
        stats: state.stats,
      }),
    }
  )
);

// ===== 用户数据状态管理 =====
interface UserDataState {
  // 📊 阅读统计
  readingStats: {
    totalReadingTime: number;
    booksRead: number;
    chaptersRead: number;
    wordsRead: number;
    averageReadingSpeed: number;
    readingStreak: number;
    favoriteCategories: Array<{ category: string; count: number }>;
    monthlyProgress: Array<{ month: string; books: number; time: number }>;
  };
  
  // 🎯 阅读目标
  readingGoals: any[];
  
  // 📖 阅读偏好
  preferences: {
    preferredCategories: string[];
    readingHabits: any;
    notificationSettings: any;
  };
  
  // 🏆 成就系统
  achievements: {
    unlockedAchievements: any[];
    availableAchievements: any[];
    totalPoints: number;
    level: number;
    nextLevelProgress: number;
  };
  
  // 🎯 加载状态
  loading: {
    stats: boolean;
    goals: boolean;
    preferences: boolean;
    achievements: boolean;
  };
}

interface UserDataActions {
  // 📊 统计操作
  loadReadingStats: () => Promise<void>;
  updateReadingProgress: (bookId: number, chapterId: number, progress: number) => void;
  
  // 🎯 目标操作
  loadReadingGoals: () => Promise<void>;
  createReadingGoal: (data: any) => Promise<void>;
  updateReadingGoal: (goalId: number, data: any) => Promise<void>;
  deleteReadingGoal: (goalId: number) => Promise<void>;
  
  // 📖 偏好操作
  loadPreferences: () => Promise<void>;
  updatePreferences: (preferences: any) => Promise<void>;
  
  // 🏆 成就操作
  loadAchievements: () => Promise<void>;
  
  // 🧹 清理操作
  clearUserData: () => void;
}

export const useUserDataStore = create<UserDataState & UserDataActions>()(
  persist(
    (set, get) => ({
      // 📊 初始状态
      readingStats: {
        totalReadingTime: 0,
        booksRead: 0,
        chaptersRead: 0,
        wordsRead: 0,
        averageReadingSpeed: 0,
        readingStreak: 0,
        favoriteCategories: [],
        monthlyProgress: [],
      },
      readingGoals: [],
      preferences: {
        preferredCategories: [],
        readingHabits: {},
        notificationSettings: {},
      },
      achievements: {
        unlockedAchievements: [],
        availableAchievements: [],
        totalPoints: 0,
        level: 1,
        nextLevelProgress: 0,
      },
      loading: {
        stats: false,
        goals: false,
        preferences: false,
        achievements: false,
      },

      // 📊 统计操作
      loadReadingStats: async () => {
        set(state => ({
          loading: { ...state.loading, stats: true }
        }));

        try {
          const readingStats = await userDataApi.getReadingStats();
          set(state => ({
            readingStats,
            loading: { ...state.loading, stats: false }
          }));
        } catch (error) {
          console.error('加载阅读统计失败:', error);
          set(state => ({
            loading: { ...state.loading, stats: false }
          }));
        }
      },

      updateReadingProgress: (bookId: number, chapterId: number, progress: number) => {
        // 更新本地阅读进度统计
        set(state => ({
          readingStats: {
            ...state.readingStats,
            chaptersRead: progress >= 0.9 ? state.readingStats.chaptersRead + 1 : state.readingStats.chaptersRead
          }
        }));
      },

      // 🎯 目标操作
      loadReadingGoals: async () => {
        set(state => ({
          loading: { ...state.loading, goals: true }
        }));

        try {
          const readingGoals = await userDataApi.getReadingGoals();
          set(state => ({
            readingGoals,
            loading: { ...state.loading, goals: false }
          }));
        } catch (error) {
          console.error('加载阅读目标失败:', error);
          set(state => ({
            loading: { ...state.loading, goals: false }
          }));
        }
      },

      createReadingGoal: async (data: any) => {
        try {
          const { goal } = await userDataApi.createReadingGoal(data);
          set(state => ({
            readingGoals: [...state.readingGoals, goal]
          }));
        } catch (error) {
          throw error;
        }
      },

      updateReadingGoal: async (goalId: number, data: any) => {
        try {
          await userDataApi.updateReadingGoal(goalId, data);
          set(state => ({
            readingGoals: state.readingGoals.map(goal => 
              goal.id === goalId ? { ...goal, ...data } : goal
            )
          }));
        } catch (error) {
          throw error;
        }
      },

      deleteReadingGoal: async (goalId: number) => {
        try {
          await userDataApi.deleteReadingGoal(goalId);
          set(state => ({
            readingGoals: state.readingGoals.filter(goal => goal.id !== goalId)
          }));
        } catch (error) {
          throw error;
        }
      },

      // 📖 偏好操作
      loadPreferences: async () => {
        set(state => ({
          loading: { ...state.loading, preferences: true }
        }));

        try {
          const preferences = await userDataApi.getReadingPreferences();
          set(state => ({
            preferences,
            loading: { ...state.loading, preferences: false }
          }));
        } catch (error) {
          console.error('加载阅读偏好失败:', error);
          set(state => ({
            loading: { ...state.loading, preferences: false }
          }));
        }
      },

      updatePreferences: async (newPreferences: any) => {
        try {
          await userDataApi.updateReadingPreferences(newPreferences);
          set(state => ({
            preferences: { ...state.preferences, ...newPreferences }
          }));
        } catch (error) {
          throw error;
        }
      },

      // 🏆 成就操作
      loadAchievements: async () => {
        set(state => ({
          loading: { ...state.loading, achievements: true }
        }));

        try {
          const achievements = await userDataApi.getAchievements();
          set(state => ({
            achievements,
            loading: { ...state.loading, achievements: false }
          }));
        } catch (error) {
          console.error('加载成就失败:', error);
          set(state => ({
            loading: { ...state.loading, achievements: false }
          }));
        }
      },

      // 🧹 清理操作
      clearUserData: () => {
        set({
          readingStats: {
            totalReadingTime: 0,
            booksRead: 0,
            chaptersRead: 0,
            wordsRead: 0,
            averageReadingSpeed: 0,
            readingStreak: 0,
            favoriteCategories: [],
            monthlyProgress: [],
          },
          readingGoals: [],
          preferences: {
            preferredCategories: [],
            readingHabits: {},
            notificationSettings: {},
          },
          achievements: {
            unlockedAchievements: [],
            availableAchievements: [],
            totalPoints: 0,
            level: 1,
            nextLevelProgress: 0,
          },
        });
      },
    }),
    {
      name: 'user-data-store',
      partialize: (state) => ({
        preferences: state.preferences,
        readingStats: state.readingStats,
      }),
    }
  )
);

// 导出所有Store
export {
  useSocialStore,
  useRecommendationStore,
  useUserDataStore,
};