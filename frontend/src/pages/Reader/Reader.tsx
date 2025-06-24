// frontend/src/pages/Reader/Reader.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  List, 
  Bookmark,
  Share2,
  Download,
  WifiOff,
  Wifi,
  AlertCircle,
  RotateCcw,
  Moon,
  Sun,
  Type,
  Maximize,
  Minimize,
  X
} from 'lucide-react';
import { useReaderStore } from '../../store/readerStore';
import { useOffline } from '../../hooks/useOffline';
import { offlineStorage } from '../../services/offlineStorage';
import { cacheManager } from '../../services/cacheManager';
import { syncManager } from '../../services/syncManager';
import { bookApi, chapterApi } from '../../services/api';
import type { Book, Chapter } from '../../types';

const Reader = () => {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const navigate = useNavigate();
  
  // 📚 阅读器状态
  const {
    settings,
    isSettingsOpen,
    isFullscreen,
    showCatalog,
    updateSettings,
    toggleSettings,
    toggleFullscreen,
    toggleCatalog,
    saveProgress,
    getProgress,
    applyTheme
  } = useReaderStore();

  // 🌐 离线状态
  const { isOnline, isOffline, attemptReconnect } = useOffline();

  // 📖 数据状态
  const [book, setBook] = useState<Book | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<'none' | 'partial' | 'full'>('none');
  
  // 📏 阅读进度
  const [scrollProgress, setScrollProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastSaveTime = useRef<number>(0);

  // 📱 响应式字体大小映射
  const fontSizeMap = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl'
  };

  const fontFamilyMap = {
    default: 'font-sans',
    serif: 'font-serif',
    sans: 'font-mono'
  };

  // 🎨 主题样式
  const themeStyles = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-900 text-gray-100',
    sepia: 'bg-amber-50 text-amber-900'
  };

  // 📊 加载书籍和章节数据
  const loadBookData = useCallback(async () => {
    if (!bookId) return;

    setLoading(true);
    setError(null);

    try {
      // 🔍 优先尝试从缓存加载
      let bookData: Book | null = null;
      let chaptersData: Chapter[] = [];
      let isFromCache = false;

      if (isOffline) {
        // 🔌 离线模式：只从缓存读取
        bookData = await offlineStorage.getBook(parseInt(bookId));
        chaptersData = await offlineStorage.getBookChapters(parseInt(bookId));
        isFromCache = true;
        
        if (!bookData) {
          setError('此书籍未缓存，无法离线阅读');
          return;
        }
      } else {
        // 🌐 在线模式：网络优先，缓存备用
        try {
          bookData = await bookApi.getBook(parseInt(bookId));
          chaptersData = await chapterApi.getBookChapters(parseInt(bookId));
          
          // 📦 更新缓存
          await offlineStorage.saveBook(bookData);
          await offlineStorage.saveBookChapters(parseInt(bookId), chaptersData);
        } catch (networkError) {
          console.warn('网络请求失败，尝试从缓存加载:', networkError);
          
          // 🔄 网络失败时从缓存加载
          bookData = await offlineStorage.getBook(parseInt(bookId));
          chaptersData = await offlineStorage.getBookChapters(parseInt(bookId));
          isFromCache = true;
          
          if (!bookData) {
            throw new Error('网络连接失败且无缓存数据');
          }
        }
      }

      setBook(bookData);
      setChapters(chaptersData);
      setIsOfflineData(isFromCache);
      
      // 📊 检查缓存状态
      const cachedChapters = await offlineStorage.getCachedChapterIds(parseInt(bookId));
      const cacheRatio = cachedChapters.length / chaptersData.length;
      
      if (cacheRatio === 1) {
        setCacheStatus('full');
      } else if (cacheRatio > 0) {
        setCacheStatus('partial');
      } else {
        setCacheStatus('none');
      }

    } catch (err) {
      console.error('加载书籍数据失败:', err);
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [bookId, isOffline]);

  // 📖 加载章节内容
  const loadChapterContent = useCallback(async (targetChapterId: string) => {
    if (!targetChapterId || !bookId) return;

    setLoading(true);
    setError(null);

    try {
      let chapterData: Chapter | null = null;
      let isFromCache = false;

      if (isOffline) {
        // 🔌 离线模式：只从缓存读取
        chapterData = await offlineStorage.getChapter(parseInt(targetChapterId));
        isFromCache = true;
        
        if (!chapterData) {
          setError('此章节未缓存，无法离线阅读');
          return;
        }
      } else {
        // 🌐 在线模式：网络优先，缓存备用
        try {
          chapterData = await chapterApi.getChapter(parseInt(targetChapterId));
          
          // 📦 缓存章节内容
          await offlineStorage.saveChapter(chapterData);
          
          // 🚀 预缓存下一章节
          const currentIndex = chapters.findIndex(c => c.id === parseInt(targetChapterId));
          if (currentIndex >= 0 && currentIndex < chapters.length - 1) {
            const nextChapter = chapters[currentIndex + 1];
            cacheManager.preloadChapter(nextChapter.id).catch(console.warn);
          }
          
        } catch (networkError) {
          console.warn('网络请求失败，尝试从缓存加载:', networkError);
          
          // 🔄 网络失败时从缓存加载
          chapterData = await offlineStorage.getChapter(parseInt(targetChapterId));
          isFromCache = true;
          
          if (!chapterData) {
            throw new Error('网络连接失败且章节未缓存');
          }
        }
      }

      setCurrentChapter(chapterData);
      setIsOfflineData(isFromCache);
      
      // 📊 恢复阅读进度
      if (bookId) {
        const progress = getProgress(parseInt(bookId), parseInt(targetChapterId));
        if (progress && contentRef.current) {
          setTimeout(() => {
            contentRef.current?.scrollTo({
              top: progress.scrollPosition,
              behavior: 'smooth'
            });
          }, 100);
        }
      }

    } catch (err) {
      console.error('加载章节内容失败:', err);
      setError(err instanceof Error ? err.message : '加载章节失败');
    } finally {
      setLoading(false);
    }
  }, [bookId, chapterId, isOffline, chapters, getProgress]);

  // 🔄 处理滚动事件（节流保存进度）
  const handleScroll = useCallback(() => {
    if (!contentRef.current || !bookId || !chapterId) return;

    const element = contentRef.current;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
    
    setScrollProgress(progress);

    // 📊 节流保存阅读进度（每5秒最多保存一次）
    const now = Date.now();
    if (now - lastSaveTime.current > 5000) {
      lastSaveTime.current = now;
      
      saveProgress(
        parseInt(bookId),
        parseInt(chapterId),
        scrollTop,
        progress
      );

      // 🔄 在线时同步到服务器
      if (isOnline) {
        syncManager.saveReadingProgress({
          bookId: parseInt(bookId),
          chapterId: parseInt(chapterId),
          progressPercentage: progress,
          readingPosition: scrollTop
        }).catch(console.warn);
      }
    }
  }, [bookId, chapterId, isOnline, saveProgress]);

  // 📱 初始化数据加载
  useEffect(() => {
    loadBookData();
  }, [loadBookData]);

  // 📖 切换章节时加载内容
  useEffect(() => {
    if (chapterId) {
      loadChapterContent(chapterId);
    }
  }, [chapterId, loadChapterContent]);

  // 📊 设置滚动监听
  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // 🎯 章节导航
  const navigateToChapter = (targetChapterId: number) => {
    navigate(`/reader/${bookId}/${targetChapterId}`);
  };

  const goToPreviousChapter = () => {
    if (!currentChapter) return;
    
    const currentIndex = chapters.findIndex(c => c.id === currentChapter.id);
    if (currentIndex > 0) {
      navigateToChapter(chapters[currentIndex - 1].id);
    }
  };

  const goToNextChapter = () => {
    if (!currentChapter) return;
    
    const currentIndex = chapters.findIndex(c => c.id === currentChapter.id);
    if (currentIndex >= 0 && currentIndex < chapters.length - 1) {
      navigateToChapter(chapters[currentIndex + 1].id);
    }
  };

  // 📦 批量缓存章节
  const cacheAllChapters = async () => {
    if (!book || !chapters.length) return;

    try {
      await cacheManager.cacheBookChapters(book.id, chapters);
      setCacheStatus('full');
    } catch (error) {
      console.error('缓存章节失败:', error);
    }
  };

  // 🔧 渲染加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">
            {isOffline ? '离线加载中...' : '加载中...'}
          </p>
        </div>
      </div>
    );
  }

  // ❌ 渲染错误状态
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">加载失败</h2>
          <p className="text-gray-600">{error}</p>
          
          <div className="space-y-2">
            {isOffline && (
              <button
                onClick={attemptReconnect}
                className="flex items-center space-x-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>重试连接</span>
              </button>
            )}
            
            <button
              onClick={() => navigate('/bookshelf')}
              className="block w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              返回书架
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 📱 渲染阅读器界面
  return (
    <div className={`min-h-screen ${themeStyles[settings.theme]} transition-colors duration-300`}>
      {/* 📱 顶部工具栏 */}
      <div className="sticky top-0 z-40 bg-white bg-opacity-95 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* 🔙 返回按钮 */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="hidden sm:inline">返回</span>
          </button>

          {/* 📚 书籍信息 */}
          <div className="flex-1 mx-4 text-center">
            <h1 className="font-semibold text-gray-900 truncate">
              {book?.title}
            </h1>
            <p className="text-sm text-gray-600 truncate">
              {currentChapter?.title}
            </p>
          </div>

          {/* 🔧 工具按钮 */}
          <div className="flex items-center space-x-2">
            {/* 🌐 连接状态 */}
            <div className="flex items-center space-x-1">
              {isOffline ? (
                <WifiOff className="h-4 w-4 text-red-500" />
              ) : (
                <Wifi className="h-4 w-4 text-green-500" />
              )}
              {isOfflineData && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                  缓存
                </span>
              )}
            </div>

            {/* 📦 缓存按钮 */}
            {isOnline && cacheStatus !== 'full' && (
              <button
                onClick={cacheAllChapters}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                title="缓存所有章节"
              >
                <Download className="h-5 w-5" />
              </button>
            )}

            {/* 📋 目录按钮 */}
            <button
              onClick={toggleCatalog}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <List className="h-5 w-5" />
            </button>

            {/* ⚙️ 设置按钮 */}
            <button
              onClick={toggleSettings}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* 📱 全屏按钮 */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* 📊 阅读进度条 */}
        <div className="mt-2">
          <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 📖 主内容区域 */}
      <div className="relative flex">
        {/* 📋 章节目录侧边栏 */}
        {showCatalog && (
          <div className="fixed inset-y-0 left-0 z-30 w-80 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">章节目录</h3>
                <button
                  onClick={toggleCatalog}
                  className="p-1 text-gray-600 hover:text-gray-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-1">
                {chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      navigateToChapter(chapter.id);
                      toggleCatalog();
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentChapter?.id === chapter.id
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">
                        第{index + 1}章 {chapter.title}
                      </span>
                      {/* 📦 缓存状态指示 */}
                      {cacheStatus === 'full' && (
                        <Download className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {chapter.wordCount?.toLocaleString()} 字
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ⚙️ 设置面板 */}
        {isSettingsOpen && (
          <div className="fixed inset-y-0 right-0 z-30 w-80 bg-white shadow-lg border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">阅读设置</h3>
                <button
                  onClick={toggleSettings}
                  className="p-1 text-gray-600 hover:text-gray-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* 🎨 主题设置 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">阅读主题</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'light', label: '日间', icon: Sun, color: 'bg-white' },
                      { key: 'dark', label: '夜间', icon: Moon, color: 'bg-gray-900' },
                      { key: 'sepia', label: '护眼', icon: Sun, color: 'bg-amber-50' }
                    ].map(({ key, label, icon: Icon, color }) => (
                      <button
                        key={key}
                        onClick={() => applyTheme(key as 'light' | 'dark' | 'sepia')}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          settings.theme === key
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-full h-8 ${color} rounded mb-2 border border-gray-200`} />
                        <div className="flex items-center justify-center space-x-1">
                          <Icon className="h-4 w-4" />
                          <span className="text-sm">{label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 🔤 字体设置 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">字体大小</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'small', label: '小' },
                      { key: 'medium', label: '中' },
                      { key: 'large', label: '大' },
                      { key: 'xlarge', label: '特大' }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => updateSettings({ fontSize: key as any })}
                        className={`p-2 rounded-lg border text-sm transition-colors ${
                          settings.fontSize === key
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 📐 行间距设置 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">行间距</h4>
                  <input
                    type="range"
                    min="1.2"
                    max="2.5"
                    step="0.1"
                    value={settings.lineHeight}
                    onChange={(e) => updateSettings({ lineHeight: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>紧密</span>
                    <span>{settings.lineHeight}</span>
                    <span>宽松</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 📖 章节内容 */}
        <div
          ref={contentRef}
          className={`flex-1 overflow-y-auto ${showCatalog ? 'ml-80' : ''} ${
            isSettingsOpen ? 'mr-80' : ''
          } transition-all duration-300`}
          style={{ height: isFullscreen ? '100vh' : 'calc(100vh - 120px)' }}
        >
          <article
            className={`max-w-4xl mx-auto p-6 ${fontSizeMap[settings.fontSize]} ${fontFamilyMap[settings.fontFamily]}`}
            style={{ 
              lineHeight: settings.lineHeight,
              maxWidth: settings.maxWidth,
              margin: `0 auto`,
              padding: `${settings.pageMargin}px`
            }}
          >
            {currentChapter && (
              <>
                <header className="mb-8 text-center">
                  <h1 className="text-2xl font-bold mb-2">
                    {currentChapter.title}
                  </h1>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                    <span>{currentChapter.wordCount?.toLocaleString()} 字</span>
                    {isOfflineData && (
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        离线缓存
                      </span>
                    )}
                  </div>
                </header>

                <div className="prose prose-lg max-w-none">
                  {currentChapter.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 leading-relaxed">
                      {paragraph.trim() || '\u00A0'}
                    </p>
                  ))}
                </div>

                {/* 📱 章节导航 */}
                <footer className="mt-12 pt-8 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={goToPreviousChapter}
                      disabled={!currentChapter || chapters.findIndex(c => c.id === currentChapter.id) === 0}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>上一章</span>
                    </button>

                    <div className="text-center">
                      <p className="text-sm text-gray-500">
                        {chapters.findIndex(c => c.id === currentChapter?.id) + 1} / {chapters.length}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        进度: {Math.round(scrollProgress)}%
                      </p>
                    </div>

                    <button
                      onClick={goToNextChapter}
                      disabled={!currentChapter || chapters.findIndex(c => c.id === currentChapter.id) === chapters.length - 1}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <span>下一章</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </footer>
              </>
            )}
          </article>
        </div>
      </div>
    </div>
  );
};

export default Reader;