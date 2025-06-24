// frontend/src/services/syncManager.ts
import { api } from './api';
import { offlineStorage, type ReadingProgress, type BookshelfItem, type SyncQueueItem } from './offlineStorage';

interface SyncConfig {
  // 同步间隔（毫秒）
  syncInterval: number;
  // 重试配置
  maxRetries: number;
  retryDelay: number;
  // 批量同步大小
  batchSize: number;
  // 超时时间
  timeout: number;
}

interface SyncStats {
  lastSyncTime: number;
  successCount: number;
  failureCount: number;
  pendingCount: number;
  isRunning: boolean;
}

type SyncEventType = 'sync_start' | 'sync_complete' | 'sync_error' | 'sync_progress';

interface SyncEvent {
  type: SyncEventType;
  data?: any;
  error?: string;
}

interface SyncResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
}

class SyncManager {
  private config: SyncConfig = {
    syncInterval: 30 * 1000, // 30秒
    maxRetries: 3,
    retryDelay: 5000, // 5秒
    batchSize: 10,
    timeout: 30000 // 30秒超时
  };

  private stats: SyncStats = {
    lastSyncTime: 0,
    successCount: 0,
    failureCount: 0,
    pendingCount: 0,
    isRunning: false
  };

  private syncTimer: NodeJS.Timeout | null = null;
  private isOnline = true;
  private eventListeners: Map<SyncEventType, Set<(event: SyncEvent) => void>> = new Map();

  constructor() {
    this.initializeSync();
  }

  // 🔧 初始化同步管理器
  private initializeSync() {
    console.log('🔧 初始化数据同步管理器');
    
    // 监听网络状态变化
    this.setupNetworkListener();
    
    // 启动定期同步
    this.startPeriodicSync();
    
    // 监听页面可见性变化
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
    
    // 页面卸载时进行最后同步
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }
  }

  // 📡 设置网络监听器
  private setupNetworkListener() {
    const updateOnlineStatus = () => {
      const wasOnline = this.isOnline;
      this.isOnline = navigator.onLine;
      
      if (!wasOnline && this.isOnline) {
        console.log('🌐 网络已恢复，开始同步');
        this.syncImmediately();
      } else if (wasOnline && !this.isOnline) {
        console.log('🔌 网络已断开，暂停同步');
        this.stopPeriodicSync();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // 初始状态
    this.isOnline = navigator.onLine;
  }

  // ⏰ 启动定期同步
  private startPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.stats.isRunning) {
        this.syncAll();
      }
    }, this.config.syncInterval);

    console.log(`⏰ 定期同步已启动，间隔 ${this.config.syncInterval / 1000} 秒`);
  }

  // ⏸️ 停止定期同步
  private stopPeriodicSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
      console.log('⏸️ 定期同步已停止');
    }
  }

  // 👁️ 处理页面可见性变化
  private handleVisibilityChange() {
    if (!document.hidden && this.isOnline && !this.stats.isRunning) {
      console.log('👁️ 页面可见，检查数据同步');
      this.syncAll();
    }
  }

  // 🚪 处理页面卸载
  private handleBeforeUnload() {
    console.log('🚪 页面卸载，执行快速同步');
    this.quickSync();
  }

  // 🔄 同步所有数据
  async syncAll(): Promise<SyncResult> {
    if (this.stats.isRunning) {
      console.log('⏳ 同步已在进行中');
      return { success: false, processed: 0, failed: 0, errors: ['同步已在进行中'] };
    }

    if (!this.isOnline) {
      console.log('🔌 离线状态，跳过同步');
      return { success: false, processed: 0, failed: 0, errors: ['网络未连接'] };
    }

    this.stats.isRunning = true;
    this.emitEvent('sync_start');

    console.log('🔄 开始数据同步');

    const result: SyncResult = {
      success: true,
      processed: 0,
      failed: 0,
      errors: []
    };

    try {
      // 📊 同步阅读进度
      const progressResult = await this.syncReadingProgress();
      result.processed += progressResult.processed;
      result.failed += progressResult.failed;
      result.errors.push(...progressResult.errors);

      // 📚 处理同步队列
      const queueResult = await this.processSyncQueue();
      result.processed += queueResult.processed;
      result.failed += queueResult.failed;
      result.errors.push(...queueResult.errors);

      // 📊 更新统计
      this.stats.lastSyncTime = Date.now();
      this.stats.successCount += result.processed;
      this.stats.failureCount += result.failed;

      if (result.failed === 0) {
        console.log('✅ 数据同步完成');
        this.emitEvent('sync_complete', { result });
      } else {
        console.warn('⚠️ 数据同步部分失败', result);
        this.emitEvent('sync_error', { result }, '部分数据同步失败');
      }

    } catch (error) {
      console.error('❌ 数据同步失败:', error);
      this.stats.failureCount++;
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : '同步失败');
      this.emitEvent('sync_error', { result }, error instanceof Error ? error.message : '同步失败');
    } finally {
      this.stats.isRunning = false;
    }

    return result;
  }

  // 📊 同步阅读进度
  private async syncReadingProgress(): Promise<SyncResult> {
    const result: SyncResult = { success: true, processed: 0, failed: 0, errors: [] };

    try {
      const unsyncedProgress = await offlineStorage.getUnsyncedReadingProgress();
      
      if (unsyncedProgress.length === 0) {
        console.log('📊 无待同步的阅读进度');
        return result;
      }

      console.log(`📊 同步 ${unsyncedProgress.length} 条阅读进度`);

      for (const progress of unsyncedProgress) {
        try {
          await api.post('/reading-records', {
            bookId: progress.bookId,
            chapterId: progress.chapterId,
            progressPercentage: progress.progressPercentage,
            readingPosition: progress.readingPosition
          });

          // 标记为已同步
          progress.synced = true;
          await offlineStorage.saveReadingProgress(progress);
          
          result.processed++;
          console.log(`✅ 阅读进度同步成功: Book ${progress.bookId}, Chapter ${progress.chapterId}`);

        } catch (error) {
          console.error(`❌ 阅读进度同步失败:`, progress, error);
          result.failed++;
          result.errors.push(`阅读进度同步失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

    } catch (error) {
      console.error('❌ 获取未同步阅读进度失败:', error);
      result.failed++;
      result.errors.push(`获取阅读进度失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return result;
  }

  // 🔄 处理同步队列（现在是公共方法）
  async processSyncQueue(): Promise<SyncResult> {
    console.log('🔄 处理同步队列');
    
    const result: SyncResult = { success: true, processed: 0, failed: 0, errors: [] };

    try {
      const syncQueue = await offlineStorage.getSyncQueue();
      
      if (syncQueue.length === 0) {
        console.log('🔄 同步队列为空');
        return result;
      }

      console.log(`🔄 发现 ${syncQueue.length} 个待同步项目`);

      for (const item of syncQueue) {
        try {
          await this.processSyncItem(item);
          
          // 同步成功，从队列中删除
          if (item.id) {
            await offlineStorage.removeFromSyncQueue(item.id);
          }

          result.processed++;
          console.log(`✅ 同步项目成功:`, item.type);

        } catch (error) {
          console.error(`❌ 同步项目失败:`, item, error);
          result.failed++;
          result.errors.push(`${item.type} 同步失败: ${error instanceof Error ? error.message : '未知错误'}`);
          
          // 增加重试次数
          if (item.retryCount < item.maxRetries) {
            item.retryCount++;
            // 这里可以更新队列项的重试次数
          } else {
            console.error(`❌ 同步项目达到最大重试次数，放弃同步:`, item);
            // 删除达到最大重试次数的项目
            if (item.id) {
              await offlineStorage.removeFromSyncQueue(item.id);
            }
          }
        }
      }

    } catch (error) {
      console.error('❌ 处理同步队列时发生错误:', error);
      result.failed++;
      result.errors.push(`处理同步队列失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return result;
  }

  // 🔄 处理单个同步项目
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'reading_progress':
        await api.post('/reading-records', item.data);
        break;
        
      case 'bookshelf_add':
        await api.post('/users/bookshelf', { bookId: item.data.bookId });
        break;
        
      case 'bookshelf_remove':
        await api.delete(`/users/bookshelf/${item.data.bookId}`);
        break;
        
      case 'bookshelf_favorite':
        await api.patch(`/users/bookshelf/${item.data.bookId}/favorite`);
        break;
        
      default:
        console.warn('⚠️ 未知的同步项目类型:', item.type);
    }
  }

  // ⚡ 快速同步（用于页面卸载时）
  private async quickSync(): Promise<void> {
    if (!this.isOnline || !navigator.sendBeacon) {
      return;
    }

    try {
      const unsyncedProgress = await offlineStorage.getUnsyncedReadingProgress();
      
      if (unsyncedProgress.length > 0) {
        // 只同步最新的几条记录
        const recentProgress = unsyncedProgress
          .sort((a, b) => new Date(b.lastReadAt).getTime() - new Date(a.lastReadAt).getTime())
          .slice(0, 5);

        for (const progress of recentProgress) {
          const data = JSON.stringify({
            bookId: progress.bookId,
            chapterId: progress.chapterId,
            progressPercentage: progress.progressPercentage,
            readingPosition: progress.readingPosition
          });

          navigator.sendBeacon('/api/reading-records', data);
        }
      }
    } catch (error) {
      console.error('❌ 快速同步失败:', error);
    }
  }

  // 🔄 添加到同步队列（公共方法）
  async addToSyncQueue(type: SyncQueueItem['type'], data: any): Promise<void> {
    const queueItem: Omit<SyncQueueItem, 'id'> = {
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.config.maxRetries
    };

    try {
      await offlineStorage.addToSyncQueue(queueItem);
      this.stats.pendingCount++;
      console.log('📝 已添加到同步队列:', queueItem);
    } catch (error) {
      console.error('❌ 添加同步队列失败:', error);
      throw error;
    }
  }

  // 💾 保存阅读进度（公共方法）
  async saveReadingProgress(progress: {
    bookId: number;
    chapterId: number;
    progressPercentage: number;
    readingPosition: number;
  }): Promise<void> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      console.warn('⚠️ 用户未登录，无法保存阅读进度');
      return;
    }

    const readingProgress: ReadingProgress = {
      userId,
      bookId: progress.bookId,
      chapterId: progress.chapterId,
      progressPercentage: progress.progressPercentage,
      readingPosition: progress.readingPosition,
      lastReadAt: new Date().toISOString(),
      synced: false
    };

    try {
      // 保存到本地
      await offlineStorage.saveReadingProgress(readingProgress);
      
      // 如果在线，尝试立即同步
      if (this.isOnline) {
        try {
          await api.post('/reading-records', {
            bookId: progress.bookId,
            chapterId: progress.chapterId,
            progressPercentage: progress.progressPercentage,
            readingPosition: progress.readingPosition
          });
          
          // 标记为已同步
          readingProgress.synced = true;
          await offlineStorage.saveReadingProgress(readingProgress);
          
        } catch (error) {
          console.warn('⚠️ 在线同步失败，将在下次同步时重试:', error);
        }
      }
      
    } catch (error) {
      console.error('❌ 保存阅读进度失败:', error);
      throw error;
    }
  }

  // ⚡ 立即同步
  async syncImmediately(): Promise<SyncResult> {
    console.log('⚡ 立即触发同步');
    return this.syncAll();
  }

  // 🛠️ 手动操作

  // 手动触发同步
  async manualSync(): Promise<SyncResult> {
    console.log('🛠️ 手动触发同步');
    return this.syncAll();
  }

  // 清除同步队列
  async clearSyncQueue(): Promise<void> {
    console.log('🗑️ 清除同步队列');
    const syncQueue = await offlineStorage.getSyncQueue();
    
    for (const item of syncQueue) {
      if (item.id) {
        await offlineStorage.removeFromSyncQueue(item.id);
      }
    }
    
    this.stats.pendingCount = 0;
  }

  // 重置同步统计
  resetStats(): void {
    this.stats = {
      lastSyncTime: 0,
      successCount: 0,
      failureCount: 0,
      pendingCount: 0,
      isRunning: false
    };
    console.log('📊 同步统计已重置');
  }

  // 👤 获取当前用户ID
  private getCurrentUserId(): number | null {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || null;
      }
    } catch (error) {
      console.error('❌ 获取用户ID失败:', error);
    }
    return null;
  }

  // 📊 获取同步统计信息
  getStats(): SyncStats {
    return { ...this.stats };
  }

  // 🔧 更新同步配置
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // 如果更新了同步间隔，重启定期同步
    if (newConfig.syncInterval) {
      this.startPeriodicSync();
    }
    
    console.log('🔧 同步配置已更新:', this.config);
  }

  // 📡 事件系统
  on(eventType: SyncEventType, callback: (event: SyncEvent) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    
    this.eventListeners.get(eventType)!.add(callback);
    
    // 返回取消监听的函数
    return () => {
      this.eventListeners.get(eventType)?.delete(callback);
    };
  }

  private emitEvent(type: SyncEventType, data?: any, error?: string): void {
    const event: SyncEvent = { type, data, error };
    
    this.eventListeners.get(type)?.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('❌ 同步事件回调执行失败:', error);
      }
    });
  }

  // 🗑️ 清理和销毁
  destroy(): void {
    console.log('🗑️ 销毁同步管理器');
    
    this.stopPeriodicSync();
    
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
      window.removeEventListener('online', () => {});
      window.removeEventListener('offline', () => {});
    }
    
    this.eventListeners.clear();
  }
}

// 创建全局同步管理器实例
export const syncManager = new SyncManager();

// 导出类型
export type { SyncConfig, SyncStats, SyncEvent, SyncEventType, SyncResult };