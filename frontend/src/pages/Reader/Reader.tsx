// src/pages/Reader/Reader.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Settings, 
  List, 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minimize,
  BookOpen,
  Bookmark,
  Sun,
  Moon,
  Type,
  Palette
} from 'lucide-react';
import { chapterApi } from '../../services/api';
import { useReaderStore } from '../../store/readerStore';
import { useAuthStore } from '../../store/authStore';
import type { Chapter, Book } from '../../types';

interface ChapterWithBook extends Chapter {
  book: Pick<Book, 'id' | 'title' | 'author' | 'totalChapters'>;
}

const Reader = () => {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const navigate = useNavigate();
  const contentRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  
  const {
    settings,
    isSettingsOpen,
    isFullscreen,
    showCatalog,
    toggleSettings,
    toggleFullscreen,
    toggleCatalog,
    updateSettings,
    applyTheme,
    saveProgress,
    getProgress
  } = useReaderStore();

  const [chapter, setChapter] = useState<ChapterWithBook | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);

  // 字体大小映射
  const fontSizeMap = {
    small: '16px',
    medium: '18px',
    large: '20px',
    xlarge: '24px',
  };

  // 字体族映射
  const fontFamilyMap = {
    default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    sans: '"Helvetica Neue", Arial, sans-serif',
  };

  useEffect(() => {
    if (chapterId) {
      loadChapter(parseInt(chapterId));
    }
  }, [chapterId]);

  useEffect(() => {
    if (bookId) {
      loadChapters(parseInt(bookId));
    }
  }, [bookId]);

  // 自动隐藏控制栏
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (isFullscreen) {
          setShowControls(false);
        }
      }, 3000);
    };

    if (isFullscreen) {
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('scroll', resetTimer);
      resetTimer();
    } else {
      setShowControls(true);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [isFullscreen]);

  // 保存阅读进度
  useEffect(() => {
    if (!chapter || !bookId || !chapterId) return;

    const handleScroll = () => {
      const element = contentRef.current;
      if (!element) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / scrollHeight) * 100;

      saveProgress(parseInt(bookId), parseInt(chapterId), scrollTop, progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [chapter, bookId, chapterId, saveProgress]);

  // 恢复阅读进度
  useEffect(() => {
    if (chapter && bookId && chapterId) {
      const progress = getProgress(parseInt(bookId), parseInt(chapterId));
      if (progress && progress.scrollPosition > 0) {
        setTimeout(() => {
          window.scrollTo(0, progress.scrollPosition);
        }, 100);
      }
    }
  }, [chapter, bookId, chapterId, getProgress]);

  const loadChapter = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await chapterApi.getChapter(id);
      setChapter(data);
    } catch (err: any) {
      setError(err.response?.data?.error || '加载章节失败');
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async (bookId: number) => {
    try {
      const data = await chapterApi.getBookChapters(bookId);
      setChapters(data);
    } catch (err) {
      console.error('Failed to load chapters:', err);
    }
  };

  const getCurrentChapterIndex = () => {
    return chapters.findIndex(ch => ch.id === parseInt(chapterId || '0'));
  };

  const navigateToChapter = (chapterIndex: number) => {
    if (chapterIndex >= 0 && chapterIndex < chapters.length) {
      const targetChapter = chapters[chapterIndex];
      navigate(`/reader/${bookId}/${targetChapter.id}`);
    }
  };

  const handlePrevChapter = () => {
    const currentIndex = getCurrentChapterIndex();
    if (currentIndex > 0) {
      navigateToChapter(currentIndex - 1);
    }
  };

  const handleNextChapter = () => {
    const currentIndex = getCurrentChapterIndex();
    if (currentIndex < chapters.length - 1) {
      navigateToChapter(currentIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">❌ {error || '章节不存在'}</div>
        <button 
          onClick={() => navigate(`/book/${bookId}`)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          返回书籍详情
        </button>
      </div>
    );
  }

  const currentIndex = getCurrentChapterIndex();
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < chapters.length - 1;

  const readerStyle = {
    fontSize: fontSizeMap[settings.fontSize],
    fontFamily: fontFamilyMap[settings.fontFamily],
    lineHeight: settings.lineHeight,
    backgroundColor: settings.backgroundColor,
    color: settings.textColor,
    maxWidth: settings.maxWidth,
    padding: `40px ${settings.pageMargin}px`,
  };

  return (
    <div 
      className={`min-h-screen transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      style={{ 
        backgroundColor: settings.backgroundColor,
        color: settings.textColor 
      }}
    >
      {/* 顶部控制栏 */}
      <div 
        className={`sticky top-0 z-40 transition-transform duration-300 ${
          isFullscreen && !showControls ? '-translate-y-full' : 'translate-y-0'
        }`}
        style={{ backgroundColor: settings.backgroundColor, borderBottom: `1px solid ${settings.theme === 'dark' ? '#374151' : '#e5e7eb'}` }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/book/${bookId}`)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 hover:bg-opacity-20 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>返回</span>
            </button>
            
            <div className="text-sm">
              <h1 className="font-medium">{chapter.book.title}</h1>
              <p className="opacity-75">{chapter.title}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleCatalog}
              className="p-2 rounded-lg hover:bg-gray-100 hover:bg-opacity-20 transition-colors"
              title="目录"
            >
              <List className="h-5 w-5" />
            </button>
            
            <button
              onClick={toggleSettings}
              className="p-2 rounded-lg hover:bg-gray-100 hover:bg-opacity-20 transition-colors"
              title="设置"
            >
              <Settings className="h-5 w-5" />
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-gray-100 hover:bg-opacity-20 transition-colors"
              title={isFullscreen ? "退出全屏" : "全屏阅读"}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 阅读内容 */}
      <div className="flex justify-center">
        <article 
          ref={contentRef}
          className="prose max-w-none"
          style={readerStyle}
        >
          <header className="mb-8">
            <h1 className="text-2xl font-bold mb-2">{chapter.title}</h1>
            <div className="text-sm opacity-75 mb-4">
              <span>字数：{chapter.wordCount?.toLocaleString()}</span>
              <span className="mx-2">•</span>
              <span>第 {chapter.chapterNumber} 章</span>
              <span className="mx-2">•</span>
              <span>{chapter.book.author}</span>
            </div>
          </header>
          
          <div 
            className="whitespace-pre-line"
            style={{ lineHeight: settings.lineHeight }}
          >
            {chapter.content}
          </div>
          
          {/* 章节导航 */}
          <footer className="mt-12 pt-8 border-t border-gray-200 border-opacity-50">
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevChapter}
                disabled={!canGoPrev}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  canGoPrev 
                    ? 'hover:bg-gray-100 hover:bg-opacity-20' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="h-5 w-5" />
                <span>上一章</span>
              </button>

              <Link
                to={`/book/${bookId}`}
                className="px-4 py-2 rounded-lg hover:bg-gray-100 hover:bg-opacity-20 transition-colors"
              >
                目录
              </Link>

              <button
                onClick={handleNextChapter}
                disabled={!canGoNext}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  canGoNext 
                    ? 'hover:bg-gray-100 hover:bg-opacity-20' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <span>下一章</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </footer>
        </article>
      </div>

      {/* 设置面板 */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
            style={{ 
              backgroundColor: settings.backgroundColor,
              color: settings.textColor,
              border: `1px solid ${settings.theme === 'dark' ? '#374151' : '#e5e7eb'}`
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">阅读设置</h3>
                <button
                  onClick={toggleSettings}
                  className="p-2 rounded-lg hover:bg-gray-100 hover:bg-opacity-20"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* 主题设置 */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    <Palette className="h-4 w-4 inline mr-2" />
                    阅读主题
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['light', 'dark', 'sepia'] as const).map((theme) => (
                      <button
                        key={theme}
                        onClick={() => applyTheme(theme)}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          settings.theme === theme 
                            ? 'border-blue-500' 
                            : 'border-gray-200 border-opacity-50'
                        }`}
                        style={{
                          backgroundColor: theme === 'light' ? '#ffffff' : theme === 'dark' ? '#1a1a1a' : '#f7f3e9',
                          color: theme === 'light' ? '#333333' : theme === 'dark' ? '#e5e5e5' : '#5c4b37'
                        }}
                      >
                        {theme === 'light' && <Sun className="h-4 w-4 mx-auto mb-1" />}
                        {theme === 'dark' && <Moon className="h-4 w-4 mx-auto mb-1" />}
                        {theme === 'sepia' && <BookOpen className="h-4 w-4 mx-auto mb-1" />}
                        <div className="text-xs">
                          {theme === 'light' && '日间'}
                          {theme === 'dark' && '夜间'}
                          {theme === 'sepia' && '护眼'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 字体大小 */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    <Type className="h-4 w-4 inline mr-2" />
                    字体大小
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['small', 'medium', 'large', 'xlarge'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => updateSettings({ fontSize: size })}
                        className={`p-2 rounded-lg border transition-colors ${
                          settings.fontSize === size
                            ? 'border-blue-500 bg-blue-50 bg-opacity-50'
                            : 'border-gray-200 border-opacity-50 hover:bg-gray-100 hover:bg-opacity-20'
                        }`}
                      >
                        <div style={{ fontSize: fontSizeMap[size] }}>A</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 字体族 */}
                <div>
                  <label className="block text-sm font-medium mb-3">字体类型</label>
                  <div className="space-y-2">
                    {(['default', 'serif', 'sans'] as const).map((font) => (
                      <button
                        key={font}
                        onClick={() => updateSettings({ fontFamily: font })}
                        className={`w-full p-3 text-left rounded-lg border transition-colors ${
                          settings.fontFamily === font
                            ? 'border-blue-500 bg-blue-50 bg-opacity-50'
                            : 'border-gray-200 border-opacity-50 hover:bg-gray-100 hover:bg-opacity-20'
                        }`}
                        style={{ fontFamily: fontFamilyMap[font] }}
                      >
                        {font === 'default' && '系统默认'}
                        {font === 'serif' && '衬线字体'}
                        {font === 'sans' && '无衬线字体'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 行间距 */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    行间距: {settings.lineHeight}
                  </label>
                  <input
                    type="range"
                    min="1.2"
                    max="2.5"
                    step="0.1"
                    value={settings.lineHeight}
                    onChange={(e) => updateSettings({ lineHeight: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* 页面宽度 */}
                <div>
                  <label className="block text-sm font-medium mb-3">页面宽度</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '窄', value: '600px' },
                      { label: '中', value: '800px' },
                      { label: '宽', value: '1000px' },
                    ].map((width) => (
                      <button
                        key={width.value}
                        onClick={() => updateSettings({ maxWidth: width.value })}
                        className={`p-2 rounded-lg border transition-colors ${
                          settings.maxWidth === width.value
                            ? 'border-blue-500 bg-blue-50 bg-opacity-50'
                            : 'border-gray-200 border-opacity-50 hover:bg-gray-100 hover:bg-opacity-20'
                        }`}
                      >
                        {width.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 目录侧边栏 */}
      {showCatalog && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="flex-1 bg-black bg-opacity-50"
            onClick={toggleCatalog}
          />
          <div 
            className="w-80 h-full overflow-y-auto"
            style={{ 
              backgroundColor: settings.backgroundColor,
              color: settings.textColor,
              borderLeft: `1px solid ${settings.theme === 'dark' ? '#374151' : '#e5e7eb'}`
            }}
          >
            <div className="p-4 border-b border-gray-200 border-opacity-50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">目录</h3>
                <button
                  onClick={toggleCatalog}
                  className="p-2 rounded-lg hover:bg-gray-100 hover:bg-opacity-20"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-2">
              {chapters.map((ch, index) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    navigate(`/reader/${bookId}/${ch.id}`);
                    toggleCatalog();
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    ch.id === parseInt(chapterId || '0')
                      ? 'bg-blue-100 bg-opacity-50 text-blue-600'
                      : 'hover:bg-gray-100 hover:bg-opacity-20'
                  }`}
                >
                  <div className="font-medium truncate">{ch.title}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {ch.wordCount?.toLocaleString()}字
                    {!ch.isFree && <span className="ml-2 text-yellow-600">VIP</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reader;