// frontend/src/store/offlineStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { offlineStorage } from '../services/offlineStorage';
import { syncManager } from '../services/syncManager';
import { cacheManager } from '../services/cacheManager';
import type { Book, Chapter } from '../types';

// 🔧 离线存储状态接口
interface OfflineState {
  // 📊 缓存状态
  isOffline: boolean;
  lastSyncTime: number | null;
  syncInProgress: boolean;
  cacheSize: number;
  
  // 📚 缓存数据统计
  cachedBooks: number;
  cachedChapters: number;
  downloadProgress: Record<string, number>; // bookId -> progress
  
  // 🔄 同步队列
  syncQueueSize: number;
  pendingActions: Array<{
    id: string;
    type: string;
    data: any;
    timestamp: number;
  }>;
  
  // ⚙️ 离线设置
  settings: {
    autoDownload: boolean;
    downloadOnWifi: boolean;
    maxCacheSize: number; // MB
    maxCacheAge: number; // days
    preloadNextChapter: boolean;
  };
}

// 🎯 离线操作接口
interface OfflineActions {
  // 📊 状态更新
  setOfflineStatus: (isOffline: boolean) => void;
  updateCacheStats: () => Promise<void>;
  updateSyncStatus: (inProgress: boolean) => void;
  
  // 📚 书籍缓存管理
  downloadBook: (book: Book, chapters: Chapter[]) => Promise<void>;
  removeBookCache: (bookId: number) => Promise<void>;
  checkBookCacheStatus: (bookId: number) => Promise<'none' | 'partial' | 'full'>;
  
  // 📖 章节缓存管理
  downloadChapter: (chapter: Chapter) => Promise<void>;
  removeChapterCache: (chapterId: number) => Promise<void>;
  preloadNextChapters: (currentChapterId: number, bookId: number, count?: number) => Promise<void>;
  
  // 🔄 数据同步
  syncAll: () => Promise<void>;
  addToSyncQueue: (type: string, data: any) => Promise<void>;
  processSyncQueue: () => Promise<void>;
  clearSyncQueue: () => Promise<void>;
  
  // 🧹 缓存清理
  clearAllCache: () => Promise<void>;
  clearExpiredCache: () => Promise<void>;
  optimizeCache: () => Promise<void>;
  
  // ⚙️ 设置管理
  updateSettings: (settings: Partial<OfflineState['settings']>) => void;
  
  // 📊 统计和监控
  getCacheReport: () => Promise<{
    totalSize: number;
    bookCount: number;
    chapterCount: number;
    oldestCache: Date | null;
    newestCache: Date | null;
  }>;
}

// 🎯 默认设置
const defaultSettings: OfflineState['settings'] = {
  autoDownload: false,
  downloadOnWifi: true,
  maxCacheSize: 500, // 500MB
  maxCacheAge: 30, // 30天
  preloadNextChapter: true,
};

// 📱 创建离线数据Store
export const useOfflineStore = create<OfflineState & OfflineActions>()(
  persist(
    (set, get) => ({
      // 📊 初始状态
      isOffline: !navigator.onLine,
      lastSyncTime: null,
      syncInProgress: false,
      cacheSize: 0,
      cachedBooks: 0,
      cachedChapters: 0,
      downloadProgress: {},
      syncQueueSize: 0,
      pendingActions: [],
      settings: defaultSettings,

      // 📊 设置离线状态
      setOfflineStatus: (isOffline: boolean) => {
        set({ isOffline });
        
        // 🌐 网络恢复时自动同步
        if (!isOffline && get().syncQueueSize > 0) {
          get().processSyncQueue().catch(console.error);
        }
      },

      // 📊 更新缓存统计
      updateCacheStats: async () => {
        try {
          const stats = await offlineStorage.getCacheStats();
          set({
            cacheSize: stats.totalSize,
            cachedBooks: stats.bookCount,
            cachedChapters: stats.chapterCount,
          });
        } catch (error) {
          console.error('更新缓存统计失败:', error);
        }
      },

      // 🔄 更新同步状态
      updateSyncStatus: (inProgress: boolean) => {
        set({ syncInProgress: inProgress });
        
        if (!inProgress) {
          set({ lastSyncTime: Date.now() });
        }
      },

      // 📚 下载整本书
      downloadBook: async (book: Book, chapters: Chapter[]) => {
        const { downloadProgress } = get();
        const bookId = book.id.toString();
        
        try {
          set({
            downloadProgress: { ...downloadProgress, [bookId]: 0 }
          });

          // 📦 保存书籍信息
          await offlineStorage.saveBook(book);
          
          // 📖 逐个下载章节
          for (let i = 0; i < chapters.length; i++) {
            const chapter = chapters[i];
            
            // 📥 下载章节内容（如果还没有）
            const existingChapter = await offlineStorage.getChapter(chapter.id);
            if (!existingChapter) {
              await cacheManager.downloadChapter(chapter.id);
            }
            
            // 📊 更新进度
            const progress = Math.round(((i + 1) / chapters.length) * 100);
            set({
              downloadProgress: { 
                ...get().downloadProgress, 
                [bookId]: progress 
              }
            });
          }

          // ✅ 下载完成
          const newDownloadProgress = { ...get().downloadProgress };
          delete newDownloadProgress[bookId];
          set({ downloadProgress: newDownloadProgress });
          
          // 📊 更新缓存统计
          await get().updateCacheStats();
          
          console.log('📚 书籍下载完成:', book.title);
          
        } catch (error) {
          console.error('书籍下载失败:', error);
          
          // ❌ 清理失败的下载进度
          const newDownloadProgress = { ...get().downloadProgress };
          delete newDownloadProgress[bookId];
          set({ downloadProgress: newDownloadProgress });
          
          throw error;
        }
      },

      // 🗑️ 移除书籍缓存
      removeBookCache: async (bookId: number) => {
        try {
          await offlineStorage.removeBook(bookId);
          await get().updateCacheStats();
          console.log('🗑️ 书籍缓存已移除:', bookId);
        } catch (error) {
          console.error('移除书籍缓存失败:', error);
          throw error;
        }
      },

      // 🔍 检查书籍缓存状态
      checkBookCacheStatus: async (bookId: number): Promise<'none' | 'partial' | 'full'> => {
        try {
          const book = await offlineStorage.getBook(bookId);
          if (!book) return 'none';
          
          const chapters = await offlineStorage.getBookChapters(bookId);
          if (chapters.length === 0) return 'none';
          
          const cachedChapterIds = await offlineStorage.getCachedChapterIds(bookId);
          const totalChapters = book.totalChapters || chapters.length;
          
          if (cachedChapterIds.length === 0) return 'none';
          if (cachedChapterIds.length === totalChapters) return 'full';
          return 'partial';
          
        } catch (error) {
          console.error('检查书籍缓存状态失败:', error);
          return 'none';
        }
      },

      // 📖 下载单个章节
      downloadChapter: async (chapter: Chapter) => {
        try {
          await cacheManager.downloadChapter(chapter.id);
          await get().updateCacheStats();
          console.log('📖 章节下载完成:', chapter.title);
        } catch (error) {
          console.error('章节下载失败:', error);
          throw error;
        }
      },

      // 🗑️ 移除章节缓存
      removeChapterCache: async (chapterId: number) => {
        try {
          await offlineStorage.removeChapter(chapterId);
          await get().updateCacheStats();
          console.log('🗑️ 章节缓存已移除:', chapterId);
        } catch (error) {
          console.error('移除章节缓存失败:', error);
          throw error;
        }
      },

      // 🚀 预加载后续章节
      preloadNextChapters: async (currentChapterId: number, bookId: number, count = 3) => {
        if (!get().settings.preloadNextChapter) return;
        
        try {
          const chapters = await offlineStorage.getBookChapters(bookId);
          const currentIndex = chapters.findIndex(c => c.id === currentChapterId);
          
          if (currentIndex >= 0) {
            const nextChapters = chapters.slice(currentIndex + 1, currentIndex + 1 + count);
            
            for (const chapter of nextChapters) {
              const existingChapter = await offlineStorage.getChapter(chapter.id);
              if (!existingChapter) {
                // 🔄 后台预加载，不阻塞当前操作
                cacheManager.downloadChapter(chapter.id).catch(console.warn);
              }
            }
          }
        } catch (error) {
          console.warn('预加载章节失败:', error);
        }
      },

      // 🔄 同步所有数据
      syncAll: async () => {
        const { syncInProgress, isOffline } = get();
        
        if (syncInProgress || isOffline) {
          console.log('同步已在进行中或处于离线状态');
          return;
        }
        
        try {
          get().updateSyncStatus(true);
          
          // 🔄 执行同步
          await syncManager.syncAll();
          
          // 📊 处理同步队列
          await get().processSyncQueue();
          
          // 📊 更新缓存统计
          await get().updateCacheStats();
          
          console.log('✅ 数据同步完成');
          
        } catch (error) {
          console.error('数据同步失败:', error);
          throw error;
        } finally {
          get().updateSyncStatus(false);
        }
      },

      // 📝 添加到同步队列
      addToSyncQueue: async (type: string, data: any) => {
        try {
          await syncManager.addToSyncQueue(type as any, data);
          
          const action = {
            id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            data,
            timestamp: Date.now(),
          };
          
          set(state => ({
            pendingActions: [...state.pendingActions, action],
            syncQueueSize: state.syncQueueSize + 1
          }));
          
          console.log('📝 已添加到同步队列:', action);
          
        } catch (error) {
          console.error('添加同步队列失败:', error);
          throw error;
        }
      },

      // 🔄 处理同步队列
      processSyncQueue: async () => {
        const { isOffline, syncInProgress } = get();
        
        if (isOffline || syncInProgress) return;
        
        try {
          get().updateSyncStatus(true);
          
          // 🔄 处理队列
          await syncManager.processSyncQueue();
          
          // 🧹 清理已处理的操作
          set({
            pendingActions: [],
            syncQueueSize: 0
          });
          
          console.log('✅ 同步队列处理完成');
          
        } catch (error) {
          console.error('处理同步队列失败:', error);
          throw error;
        } finally {
          get().updateSyncStatus(false);
        }
      },

      // 🧹 清空同步队列
      clearSyncQueue: async () => {
        try {
          await syncManager.clearSyncQueue();
          set({
            pendingActions: [],
            syncQueueSize: 0
          });
          console.log('🧹 同步队列已清空');
        } catch (error) {
          console.error('清空同步队列失败:', error);
          throw error;
        }
      },

      // 🗑️ 清理所有缓存
      clearAllCache: async () => {
        try {
          await offlineStorage.clearAllCache();
          set({
            cacheSize: 0,
            cachedBooks: 0,
            cachedChapters: 0,
            downloadProgress: {},
          });
          console.log('🗑️ 所有缓存已清理');
        } catch (error) {
          console.error('清理缓存失败:', error);
          throw error;
        }
      },

      // 🧹 清理过期缓存
      clearExpiredCache: async () => {
        try {
          const { maxCacheAge } = get().settings;
          const cutoffTime = Date.now() - (maxCacheAge * 24 * 60 * 60 * 1000);
          
          await offlineStorage.clearExpiredCache(cutoffTime);
          await get().updateCacheStats();
          
          console.log('🧹 过期缓存已清理');
        } catch (error) {
          console.error('清理过期缓存失败:', error);
          throw error;
        }
      },

      // ⚡ 优化缓存
      optimizeCache: async () => {
        try {
          const { maxCacheSize } = get().settings;
          const stats = await get().getCacheReport();
          
          // 📊 如果缓存超出限制，清理最旧的数据
          if (stats.totalSize > maxCacheSize * 1024 * 1024) {
            await offlineStorage.optimizeCache(maxCacheSize * 1024 * 1024);
            await get().updateCacheStats();
            console.log('⚡ 缓存优化完成');
          }
        } catch (error) {
          console.error('缓存优化失败:', error);
          throw error;
        }
      },

      // ⚙️ 更新设置
      updateSettings: (newSettings: Partial<OfflineState['settings']>) => {
        set(state => ({
          settings: { ...state.settings, ...newSettings }
        }));
      },

      // 📊 获取缓存报告
      getCacheReport: async () => {
        try {
          const stats = await offlineStorage.getCacheStats();
          const cacheItems = await offlineStorage.getAllCacheItems();
          
          let oldestCache: Date | null = null;
          let newestCache: Date | null = null;
          
          cacheItems.forEach((item: any) => {
            const date = new Date(item.timestamp);
            if (!oldestCache || date < oldestCache) {
              oldestCache = date;
            }
            if (!newestCache || date > newestCache) {
              newestCache = date;
            }
          });
          
          return {
            totalSize: stats.totalSize,
            bookCount: stats.bookCount,
            chapterCount: stats.chapterCount,
            oldestCache,
            newestCache,
          };
        } catch (error) {
          console.error('获取缓存报告失败:', error);
          throw error;
        }
      },
    }),
    {
      name: 'offline-storage',
      // 🔧 只持久化设置，不持久化缓存数据
      partialize: (state) => ({
        settings: state.settings,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);

// 🔧 网络状态监听
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineStore.getState().setOfflineStatus(false);
  });
  
  window.addEventListener('offline', () => {
    useOfflineStore.getState().setOfflineStatus(true);
  });
}

// 🕐 定期更新缓存统计
if (typeof window !== 'undefined') {
  setInterval(() => {
    useOfflineStore.getState().updateCacheStats().catch(console.warn);
  }, 30000); // 每30秒更新一次
}