// frontend/src/services/cacheManager.ts
import type { Book, Chapter } from '../types';
import { offlineStorage } from './offlineStorage';
import { chapterApi, bookApi } from './api';

// 缓存键名常量
const CACHE_KEYS = {
  BOOKS: 'reading-app-books',
  BOOK_DETAILS: 'reading-app-book-details',
  CHAPTERS: 'reading-app-chapters',
  USER_DATA: 'reading-app-user-data',
  READING_PROGRESS: 'reading-app-reading-progress',
  SEARCH_RESULTS: 'reading-app-search-results'
} as const;

// 缓存配置
const CACHE_CONFIG = {
  // 缓存有效期（毫秒）
  DEFAULT_TTL: 24 * 60 * 60 * 1000, // 24小时
  BOOKS_TTL: 60 * 60 * 1000, // 1小时
  CHAPTERS_TTL: 7 * 24 * 60 * 60 * 1000, // 7天（章节内容相对稳定）
  USER_DATA_TTL: 30 * 60 * 1000, // 30分钟
  SEARCH_TTL: 15 * 60 * 1000, // 15分钟

  // 缓存大小限制
  MAX_BOOKS: 100,
  MAX_CHAPTERS: 1000,
  MAX_SEARCH_RESULTS: 50,

  // 自动清理配置
  AUTO_CLEANUP_INTERVAL: 60 * 60 * 1000, // 1小时清理一次过期缓存
  MAX_CACHE_SIZE: 100 * 1024 * 1024 // 100MB最大缓存大小
} as const;

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  size?: number;
}

interface CacheStats {
  totalSize: number;
  itemCount: number;
  hitRate: number;
  lastCleanup: number;
}

interface DownloadProgress {
  bookId: number;
  chapterId: number;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  error?: string;
}

class CacheManager {
  private stats: CacheStats = {
    totalSize: 0,
    itemCount: 0,
    hitRate: 0,
    lastCleanup: Date.now()
  };

  private hitCount = 0;
  private missCount = 0;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private downloadQueue: Map<number, DownloadProgress> = new Map();
  private maxConcurrentDownloads = 3;
  private activeDownloads = 0;

  constructor() {
    this.initializeCache();
  }

  // 🔧 初始化缓存系统
  private initializeCache() {
    console.log('🔧 初始化缓存管理器');
    
    // 启动自动清理定时器
    this.startAutoCleanup();
    
    // 监听存储变化
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange.bind(this));
      
      // 页面卸载时清理
      window.addEventListener('beforeunload', this.cleanup.bind(this));
    }
    
    // 初始化统计信息
    this.updateStats();
  }

  // 📊 更新缓存统计
  private updateStats() {
    try {
      let totalSize = 0;
      let itemCount = 0;

      Object.values(CACHE_KEYS).forEach(key => {
        const cache = this.getCache(key);
        if (cache) {
          Object.values(cache).forEach((item: CacheItem) => {
            itemCount++;
            totalSize += this.estimateSize(item);
          });
        }
      });

      this.stats.totalSize = totalSize;
      this.stats.itemCount = itemCount;
      this.stats.hitRate = this.hitCount + this.missCount > 0 
        ? this.hitCount / (this.hitCount + this.missCount) 
        : 0;
      
      console.log('📊 缓存统计更新:', this.stats);
    } catch (error) {
      console.error('❌ 更新缓存统计失败:', error);
    }
  }

  // 📏 估算数据大小
  private estimateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // 粗略估算
    }
  }

  // 📦 获取缓存存储
  private getCache(cacheKey: string): Record<string, CacheItem> | null {
    try {
      const cacheData = localStorage.getItem(cacheKey);
      return cacheData ? JSON.parse(cacheData) : {};
    } catch (error) {
      console.error(`❌ 获取缓存失败 [${cacheKey}]:`, error);
      return {};
    }
  }

  // 💾 设置缓存
  private setCache(cacheKey: string, cache: Record<string, CacheItem>): void {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch (error) {
      console.error(`❌ 设置缓存失败 [${cacheKey}]:`, error);
      // 如果存储满了，尝试清理过期缓存
      this.cleanupExpiredCache();
    }
  }

  // ⏰ 启动自动清理
  private startAutoCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredCache();
      this.updateStats();
    }, CACHE_CONFIG.AUTO_CLEANUP_INTERVAL);

    console.log('⏰ 自动缓存清理已启动');
  }

  // 🧹 清理过期缓存
  private cleanupExpiredCache() {
    const now = Date.now();
    let cleanedCount = 0;

    Object.values(CACHE_KEYS).forEach(key => {
      const cache = this.getCache(key);
      if (cache) {
        Object.keys(cache).forEach(itemKey => {
          const item = cache[itemKey];
          if (now - item.timestamp > item.ttl) {
            delete cache[itemKey];
            cleanedCount++;
          }
        });
        this.setCache(key, cache);
      }
    });

    if (cleanedCount > 0) {
      console.log(`🧹 清理了 ${cleanedCount} 个过期缓存项`);
      this.stats.lastCleanup = now;
    }
  }

  // 🎯 通用缓存操作
  
  // 设置缓存项
  set<T>(cacheKey: string, key: string, data: T, ttl?: number): void {
    const cache = this.getCache(cacheKey) || {};
    
    cache[key] = {
      data,
      timestamp: Date.now(),
      ttl: ttl || CACHE_CONFIG.DEFAULT_TTL,
      size: this.estimateSize(data)
    };

    this.setCache(cacheKey, cache);
    console.log(`💾 缓存设置: ${cacheKey}/${key}`);
  }

  // 获取缓存项
  get<T>(cacheKey: string, key: string): T | null {
    const cache = this.getCache(cacheKey);
    if (!cache || !cache[key]) {
      this.missCount++;
      return null;
    }

    const item = cache[key];
    const now = Date.now();

    // 检查是否过期
    if (now - item.timestamp > item.ttl) {
      delete cache[key];
      this.setCache(cacheKey, cache);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    console.log(`✅ 缓存命中: ${cacheKey}/${key}`);
    return item.data;
  }

  // 删除缓存项
  delete(cacheKey: string, key: string): void {
    const cache = this.getCache(cacheKey);
    if (cache && cache[key]) {
      delete cache[key];
      this.setCache(cacheKey, cache);
      console.log(`🗑️ 缓存删除: ${cacheKey}/${key}`);
    }
  }

  // 清空特定缓存
  clear(cacheKey: string): void {
    localStorage.removeItem(cacheKey);
    console.log(`🗑️ 缓存清空: ${cacheKey}`);
  }

  // 📚 书籍缓存操作
  
  // 缓存书籍列表
  cacheBooks(books: Book[], params?: any): void {
    const key = params ? `books_${JSON.stringify(params)}` : 'books_default';
    this.set(CACHE_KEYS.BOOKS, key, books, CACHE_CONFIG.BOOKS_TTL);
  }

  // 获取缓存的书籍列表
  getCachedBooks(params?: any): Book[] | null {
    const key = params ? `books_${JSON.stringify(params)}` : 'books_default';
    return this.get(CACHE_KEYS.BOOKS, key);
  }

  // 缓存书籍详情
  cacheBookDetail(book: Book): void {
    this.set(CACHE_KEYS.BOOK_DETAILS, `book_${book.id}`, book, CACHE_CONFIG.BOOKS_TTL);
  }

  // 获取缓存的书籍详情
  getCachedBookDetail(bookId: number): Book | null {
    return this.get(CACHE_KEYS.BOOK_DETAILS, `book_${bookId}`);
  }

  // 📖 章节缓存操作
  
  // 缓存章节内容
  cacheChapter(chapter: Chapter): void {
    this.set(CACHE_KEYS.CHAPTERS, `chapter_${chapter.id}`, chapter, CACHE_CONFIG.CHAPTERS_TTL);
  }

  // 获取缓存的章节内容
  getCachedChapter(chapterId: number): Chapter | null {
    return this.get(CACHE_KEYS.CHAPTERS, `chapter_${chapterId}`);
  }

  // 📥 下载章节内容
  async downloadChapter(chapterId: number): Promise<Chapter> {
    // 检查是否已在下载队列中
    if (this.downloadQueue.has(chapterId)) {
      const progress = this.downloadQueue.get(chapterId)!;
      if (progress.status === 'downloading') {
        throw new Error('章节正在下载中');
      }
    }

    // 检查缓存
    const cachedChapter = this.getCachedChapter(chapterId);
    if (cachedChapter) {
      console.log('📦 章节已缓存:', chapterId);
      return cachedChapter;
    }

    // 检查并发下载限制
    if (this.activeDownloads >= this.maxConcurrentDownloads) {
      throw new Error('下载队列已满，请稍后重试');
    }

    // 添加到下载队列
    const downloadProgress: DownloadProgress = {
      bookId: 0, // 将在下载过程中设置
      chapterId,
      progress: 0,
      status: 'downloading'
    };
    
    this.downloadQueue.set(chapterId, downloadProgress);
    this.activeDownloads++;

    try {
      console.log('📥 开始下载章节:', chapterId);
      
      // 更新进度
      downloadProgress.progress = 30;
      
      // 从API获取章节内容
      const chapter = await chapterApi.getChapter(chapterId);
      
      // 更新进度
      downloadProgress.progress = 70;
      downloadProgress.bookId = chapter.bookId;
      
      // 保存到离线存储
      await offlineStorage.saveChapter(chapter);
      
      // 缓存到内存
      this.cacheChapter(chapter);
      
      // 更新进度
      downloadProgress.progress = 100;
      downloadProgress.status = 'completed';
      
      console.log('✅ 章节下载完成:', chapterId);
      return chapter;
      
    } catch (error) {
      console.error('❌ 章节下载失败:', chapterId, error);
      downloadProgress.status = 'error';
      downloadProgress.error = error instanceof Error ? error.message : '下载失败';
      throw error;
      
    } finally {
      // 从队列中移除
      setTimeout(() => {
        this.downloadQueue.delete(chapterId);
      }, 5000); // 5秒后清除进度记录
      
      this.activeDownloads--;
    }
  }

  // 📥 预加载章节
  async preloadChapter(chapterId: number): Promise<void> {
    try {
      // 检查是否已缓存
      const cached = this.getCachedChapter(chapterId);
      if (cached) return;
      
      // 后台下载，不阻塞
      this.downloadChapter(chapterId).catch(error => {
        console.warn('📥 预加载章节失败:', chapterId, error);
      });
      
    } catch (error) {
      console.warn('📥 预加载章节失败:', chapterId, error);
    }
  }

  // 📚 批量缓存书籍章节
  async cacheBookChapters(bookId: number, chapters: Chapter[]): Promise<void> {
    console.log(`📚 开始缓存书籍 ${bookId} 的 ${chapters.length} 个章节`);
    
    const batchSize = 5; // 每批下载5个章节
    const batches = [];
    
    for (let i = 0; i < chapters.length; i += batchSize) {
      batches.push(chapters.slice(i, i + batchSize));
    }
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const progress = Math.round(((i + 1) / batches.length) * 100);
      
      console.log(`📥 下载进度: ${progress}% (批次 ${i + 1}/${batches.length})`);
      
      // 并发下载当前批次
      const downloadPromises = batch.map(chapter => 
        this.downloadChapter(chapter.id).catch(error => {
          console.error(`❌ 章节 ${chapter.id} 下载失败:`, error);
          return null;
        })
      );
      
      await Promise.all(downloadPromises);
      
      // 批次间延迟，避免服务器压力
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`✅ 书籍 ${bookId} 章节缓存完成`);
  }

  // 📊 获取下载进度
  getDownloadProgress(chapterId: number): DownloadProgress | null {
    return this.downloadQueue.get(chapterId) || null;
  }

  // 📊 获取所有下载进度
  getAllDownloadProgress(): DownloadProgress[] {
    return Array.from(this.downloadQueue.values());
  }

  // 🔍 搜索缓存操作
  
  // 缓存搜索结果
  cacheSearchResults(query: string, results: any[]): void {
    const key = `search_${query}`;
    this.set(CACHE_KEYS.SEARCH_RESULTS, key, results, CACHE_CONFIG.SEARCH_TTL);
  }

  // 获取缓存的搜索结果
  getCachedSearchResults(query: string): any[] | null {
    const key = `search_${query}`;
    return this.get(CACHE_KEYS.SEARCH_RESULTS, key);
  }

  // 📊 缓存统计和管理
  
  // 获取缓存大小
  async getCacheSize(): Promise<number> {
    try {
      // 计算localStorage缓存大小
      let localStorageSize = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          localStorageSize += localStorage.getItem(key)?.length || 0;
        }
      }
      
      // 获取IndexedDB缓存大小
      const offlineStats = await offlineStorage.getCacheStats();
      
      return localStorageSize + offlineStats.totalSize;
    } catch (error) {
      console.error('❌ 获取缓存大小失败:', error);
      return 0;
    }
  }

  // 获取缓存统计
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // 清空所有缓存
  clearAll(): void {
    Object.values(CACHE_KEYS).forEach(key => {
      this.clear(key);
    });
    
    this.hitCount = 0;
    this.missCount = 0;
    this.updateStats();
    
    console.log('🗑️ 所有缓存已清空');
  }

  // 处理存储变化事件
  private handleStorageChange(event: StorageEvent) {
    if (event.key && Object.values(CACHE_KEYS).includes(event.key as any)) {
      console.log('🔄 缓存存储发生变化:', event.key);
      this.updateStats();
    }
  }

  // 清理资源
  cleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    console.log('🧹 缓存管理器清理完成');
  }

  // 析构函数
  destroy(): void {
    this.cleanup();
    this.downloadQueue.clear();
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange.bind(this));
      window.removeEventListener('beforeunload', this.cleanup.bind(this));
    }
    
    console.log('🗑️ 缓存管理器已销毁');
  }
}

// 创建全局缓存管理器实例
export const cacheManager = new CacheManager();

// 导出类型和配置
export type { CacheStats, DownloadProgress };
export { CACHE_CONFIG };