// frontend/src/services/offlineStorage.ts
import type { Book, Chapter, User } from '../types';

// IndexedDB数据库配置
const DB_NAME = 'ReadingAppOfflineDB';
const DB_VERSION = 1;

// 对象存储名称
const STORES = {
  BOOKS: 'books',
  CHAPTERS: 'chapters',
  READING_PROGRESS: 'readingProgress',
  USER_DATA: 'userData',
  BOOKSHELF: 'bookshelf',
  SYNC_QUEUE: 'syncQueue',
  CACHE_ITEMS: 'cacheItems'
} as const;

interface ReadingProgress {
  id?: number;
  userId: number;
  bookId: number;
  chapterId: number;
  progressPercentage: number;
  readingPosition: number;
  lastReadAt: string;
  synced: boolean;
}

interface BookshelfItem {
  id?: number;
  userId: number;
  bookId: number;
  addedAt: string;
  lastReadAt?: string;
  isFavorite: boolean;
  synced: boolean;
}

interface SyncQueueItem {
  id?: number;
  type: 'reading_progress' | 'bookshelf_add' | 'bookshelf_remove' | 'bookshelf_favorite';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface CacheItem {
  key: string;
  data: any;
  timestamp: number;
  size: number;
}

class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    this.initDB();
  }

  // 🔧 初始化数据库
  private async initDB(): Promise<void> {
    if (this.dbPromise) return;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ IndexedDB打开失败:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB连接成功');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('🔄 升级IndexedDB结构');

        // 创建对象存储
        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
            
            // 创建索引
            switch (storeName) {
              case STORES.BOOKS:
                store.createIndex('title', 'title', { unique: false });
                store.createIndex('author', 'author', { unique: false });
                break;
              case STORES.CHAPTERS:
                store.createIndex('bookId', 'bookId', { unique: false });
                store.createIndex('chapterNumber', 'chapterNumber', { unique: false });
                break;
              case STORES.READING_PROGRESS:
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('bookId', 'bookId', { unique: false });
                store.createIndex('chapterId', 'chapterId', { unique: false });
                break;
              case STORES.BOOKSHELF:
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('bookId', 'bookId', { unique: false });
                break;
              case STORES.SYNC_QUEUE:
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                break;
              case STORES.CACHE_ITEMS:
                store.createIndex('key', 'key', { unique: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                break;
            }
          }
        });
      };
    });

    await this.dbPromise;
  }

  // 🔧 确保数据库连接
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  // ===== 书籍管理 =====
  
  // 保存书籍
  async saveBook(book: Book): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.BOOKS], 'readwrite');
      const store = transaction.objectStore(STORES.BOOKS);
      
      const request = store.put({ ...book, cachedAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 获取书籍
  async getBook(bookId: number): Promise<Book | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.BOOKS], 'readonly');
      const store = transaction.objectStore(STORES.BOOKS);
      
      const request = store.get(bookId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // 移除书籍
  async removeBook(bookId: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.BOOKS, STORES.CHAPTERS], 'readwrite');
      
      // 删除书籍
      const bookStore = transaction.objectStore(STORES.BOOKS);
      bookStore.delete(bookId);
      
      // 删除相关章节
      const chapterStore = transaction.objectStore(STORES.CHAPTERS);
      const index = chapterStore.index('bookId');
      const chapterRequest = index.openCursor(IDBKeyRange.only(bookId));
      
      chapterRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // ===== 章节管理 =====
  
  // 保存章节
  async saveChapter(chapter: Chapter): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CHAPTERS], 'readwrite');
      const store = transaction.objectStore(STORES.CHAPTERS);
      
      const request = store.put({ ...chapter, cachedAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 获取章节
  async getChapter(chapterId: number): Promise<Chapter | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CHAPTERS], 'readonly');
      const store = transaction.objectStore(STORES.CHAPTERS);
      
      const request = store.get(chapterId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // 保存书籍章节列表
  async saveBookChapters(bookId: number, chapters: Chapter[]): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CHAPTERS], 'readwrite');
      const store = transaction.objectStore(STORES.CHAPTERS);
      
      let completed = 0;
      const total = chapters.length;
      
      if (total === 0) {
        resolve();
        return;
      }
      
      chapters.forEach(chapter => {
        const request = store.put({ ...chapter, bookId, cachedAt: Date.now() });
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  // 获取书籍章节列表
  async getBookChapters(bookId: number): Promise<Chapter[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CHAPTERS], 'readonly');
      const store = transaction.objectStore(STORES.CHAPTERS);
      const index = store.index('bookId');
      
      const request = index.getAll(IDBKeyRange.only(bookId));
      request.onsuccess = () => {
        const chapters = request.result || [];
        // 按章节号排序
        chapters.sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0));
        resolve(chapters);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 获取已缓存的章节ID列表
  async getCachedChapterIds(bookId: number): Promise<number[]> {
    const chapters = await this.getBookChapters(bookId);
    return chapters.map(chapter => chapter.id);
  }

  // 移除章节
  async removeChapter(chapterId: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CHAPTERS], 'readwrite');
      const store = transaction.objectStore(STORES.CHAPTERS);
      
      const request = store.delete(chapterId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ===== 阅读进度管理 =====
  
  // 保存阅读进度
  async saveReadingProgress(progress: ReadingProgress): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.READING_PROGRESS], 'readwrite');
      const store = transaction.objectStore(STORES.READING_PROGRESS);
      
      const request = store.put(progress);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 获取未同步的阅读进度
  async getUnsyncedReadingProgress(): Promise<ReadingProgress[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.READING_PROGRESS], 'readonly');
      const store = transaction.objectStore(STORES.READING_PROGRESS);
      
      const request = store.getAll();
      request.onsuccess = () => {
        const progress = (request.result || []).filter((p: ReadingProgress) => !p.synced);
        resolve(progress);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // ===== 同步队列管理 =====
  
  // 添加到同步队列
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      
      const request = store.add(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 获取同步队列
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // 从同步队列移除
  async removeFromSyncQueue(id: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ===== 缓存项管理 =====
  
  // 设置缓存项
  async setCacheItem(key: string, data: any): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE_ITEMS], 'readwrite');
      const store = transaction.objectStore(STORES.CACHE_ITEMS);
      
      const cacheItem: CacheItem = {
        key,
        data,
        timestamp: Date.now(),
        size: this.estimateSize(data)
      };
      
      const request = store.put(cacheItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 获取缓存项
  async getCacheItem(key: string): Promise<any | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE_ITEMS], 'readonly');
      const store = transaction.objectStore(STORES.CACHE_ITEMS);
      const index = store.index('key');
      
      const request = index.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 移除缓存项
  async removeCacheItem(key: string): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE_ITEMS], 'readwrite');
      const store = transaction.objectStore(STORES.CACHE_ITEMS);
      const index = store.index('key');
      
      const getRequest = index.get(key);
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          const deleteRequest = store.delete(getRequest.result.id);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // 获取所有缓存项
  async getAllCacheItems(): Promise<CacheItem[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE_ITEMS], 'readonly');
      const store = transaction.objectStore(STORES.CACHE_ITEMS);
      
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // ===== 缓存管理和统计 =====
  
  // 获取缓存统计
  async getCacheStats(): Promise<{
    totalSize: number;
    bookCount: number;
    chapterCount: number;
    lastSync: string | null;
  }> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(Object.values(STORES), 'readonly');
      
      const bookStore = transaction.objectStore(STORES.BOOKS);
      const chapterStore = transaction.objectStore(STORES.CHAPTERS);
      const cacheStore = transaction.objectStore(STORES.CACHE_ITEMS);
      
      const bookCountRequest = bookStore.count();
      const chapterCountRequest = chapterStore.count();
      const cacheItemsRequest = cacheStore.getAll();
      
      let completedRequests = 0;
      let bookCount = 0;
      let chapterCount = 0;
      let totalSize = 0;
      
      const checkComplete = () => {
        completedRequests++;
        if (completedRequests === 3) {
          resolve({
            totalSize,
            bookCount,
            chapterCount,
            lastSync: localStorage.getItem('lastSyncTime')
          });
        }
      };
      
      bookCountRequest.onsuccess = () => {
        bookCount = bookCountRequest.result;
        checkComplete();
      };
      
      chapterCountRequest.onsuccess = () => {
        chapterCount = chapterCountRequest.result;
        checkComplete();
      };
      
      cacheItemsRequest.onsuccess = () => {
        const cacheItems = cacheItemsRequest.result || [];
        totalSize = cacheItems.reduce((sum, item) => sum + (item.size || 0), 0);
        checkComplete();
      };
      
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // 清除所有缓存
  async clearAllCache(): Promise<void> {
    const db = await this.ensureDB();
    const storeNames = Object.values(STORES);
    const transaction = db.transaction(storeNames, 'readwrite');
    
    const clearPromises = storeNames.map(storeName => {
      return new Promise<void>((resolve, reject) => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });
    
    await Promise.all(clearPromises);
    console.log('🗑️ 所有缓存已清除');
  }

  // 清除过期缓存
  async clearExpiredCache(cutoffTime: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE_ITEMS], 'readwrite');
      const store = transaction.objectStore(STORES.CACHE_ITEMS);
      const index = store.index('timestamp');
      
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));
      let deletedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          console.log(`🧹 已清理 ${deletedCount} 个过期缓存项`);
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // 优化缓存
  async optimizeCache(maxSize: number): Promise<void> {
    const cacheItems = await this.getAllCacheItems();
    const totalSize = cacheItems.reduce((sum, item) => sum + (item.size || 0), 0);
    
    if (totalSize <= maxSize) return;
    
    // 按时间戳排序，删除最旧的缓存
    cacheItems.sort((a, b) => a.timestamp - b.timestamp);
    
    let currentSize = totalSize;
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.CACHE_ITEMS], 'readwrite');
    const store = transaction.objectStore(STORES.CACHE_ITEMS);
    
    for (const item of cacheItems) {
      if (currentSize <= maxSize) break;
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(item.key);
        request.onsuccess = () => {
          currentSize -= item.size || 0;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    }
    
    console.log('⚡ 缓存优化完成');
  }

  // 清除书籍数据
  async clearBooks(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.BOOKS], 'readwrite');
    const store = transaction.objectStore(STORES.BOOKS);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 清除章节数据
  async clearChapters(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.CHAPTERS], 'readwrite');
    const store = transaction.objectStore(STORES.CHAPTERS);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 清除API缓存
  async clearApiCache(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.CACHE_ITEMS], 'readwrite');
    const store = transaction.objectStore(STORES.CACHE_ITEMS);
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // 清除过期缓存
  async clearExpiredCache(cutoffTime: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CACHE_ITEMS], 'readwrite');
      const store = transaction.objectStore(STORES.CACHE_ITEMS);
      const index = store.index('timestamp');
      
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));
      let deletedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          console.log(`🧹 已清理 ${deletedCount} 个过期缓存项`);
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // 优化缓存
  async optimizeCache(maxSize: number): Promise<void> {
    const cacheItems = await this.getAllCacheItems();
    const totalSize = cacheItems.reduce((sum, item) => sum + (item.size || 0), 0);
    
    if (totalSize <= maxSize) return;
    
    // 按时间戳排序，删除最旧的缓存
    cacheItems.sort((a, b) => a.timestamp - b.timestamp);
    
    let currentSize = totalSize;
    const db = await this.ensureDB();
    const transaction = db.transaction([STORES.CACHE_ITEMS], 'readwrite');
    const store = transaction.objectStore(STORES.CACHE_ITEMS);
    
    for (const item of cacheItems) {
      if (currentSize <= maxSize) break;
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(item.key);
        request.onsuccess = () => {
          currentSize -= item.size || 0;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    }
    
    console.log('⚡ 缓存优化完成');
  }

  // 估算数据大小
  private estimateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2; // 粗略估算
    }
  }

  // 清理和销毁
  async destroy(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.dbPromise = null;
  }
}

// 创建全局离线存储服务实例
export const offlineStorage = new OfflineStorageService();

// 导出类型
export type { ReadingProgress, BookshelfItem, SyncQueueItem, CacheItem };