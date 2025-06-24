// src/pages/Bookshelf/Bookshelf.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Heart, 
  Clock, 
  Filter, 
  SortAsc, 
  Trash2, 
  Eye,
  Star,
  Calendar,
  BarChart3,
  User,
  BookmarkIcon,
  TrendingUp
} from 'lucide-react';
import { useBookshelfStore, type BookshelfItem } from '../../store/bookshelfStore';

const Bookshelf = () => {
  const navigate = useNavigate();
  const {
    bookshelfItems,
    loading,
    error,
    filter,
    sortBy,
    fetchBookshelf,
    removeFromBookshelf,
    toggleFavorite,
    setFilter,
    setSortBy,
    clearError,
    getFilteredAndSortedItems
  } = useBookshelfStore();

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchBookshelf();
  }, [fetchBookshelf]);

  const filteredItems = getFilteredAndSortedItems();

  const handleRemoveBook = async (bookId: number, title: string) => {
    if (!confirm(`确定要从书架移除《${title}》吗？`)) return;
    
    try {
      await removeFromBookshelf(bookId);
    } catch (error) {
      // 错误已在store中处理
    }
  };

  const handleToggleFavorite = async (bookId: number) => {
    try {
      await toggleFavorite(bookId);
    } catch (error) {
      // 错误已在store中处理
    }
  };

  const formatLastRead = (lastReadAt: string | null) => {
    if (!lastReadAt) return '未开始阅读';
    
    const date = new Date(lastReadAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '今天';
    if (diffDays === 2) return '昨天';
    if (diffDays <= 7) return `${diffDays - 1}天前`;
    return date.toLocaleDateString();
  };

  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-gray-200';
    if (progress < 25) return 'bg-red-400';
    if (progress < 50) return 'bg-yellow-400';
    if (progress < 75) return 'bg-blue-400';
    return 'bg-green-400';
  };

  const getStatistics = () => {
    const total = bookshelfItems.length;
    const favorites = bookshelfItems.filter(item => item.isFavorite).length;
    const inProgress = bookshelfItems.filter(item => 
      item.readingProgress.overallProgress > 0 && item.readingProgress.overallProgress < 100
    ).length;
    const completed = bookshelfItems.filter(item => 
      item.readingProgress.overallProgress === 100
    ).length;
    
    return { total, favorites, inProgress, completed };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 页面标题和统计 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">我的书架</h1>
            <p className="text-gray-600">管理和阅读您收藏的书籍</p>
          </div>
          
          <button
            onClick={() => navigate('/upload')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            上传新书
          </button>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">总书籍</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.favorites}</p>
                <p className="text-sm text-gray-600">收藏</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                <p className="text-sm text-gray-600">在读</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                <p className="text-sm text-gray-600">已完成</p>
              </div>
            </div>
          </div>
        </div>

        {/* 筛选和排序 */}
        <div className="flex flex-wrap items-center gap-4">
          {/* 筛选按钮 */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilter('favorites')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'favorites' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                收藏
              </button>
              <button
                onClick={() => setFilter('recent')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'recent' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                最近阅读
              </button>
            </div>
          </div>

          {/* 排序选择 */}
          <div className="flex items-center space-x-2">
            <SortAsc className="h-5 w-5 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="recent">最近阅读</option>
              <option value="progress">阅读进度</option>
              <option value="title">书名</option>
              <option value="author">作者</option>
            </select>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-red-600">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 书籍列表 */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? '书架空空如也' : 
             filter === 'favorites' ? '还没有收藏的书籍' : 
             '最近没有阅读记录'}
          </h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' ? '去上传您的第一本书吧！' : '尝试其他筛选条件'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => navigate('/upload')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              上传书籍
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <BookCard
              key={item.id}
              item={item}
              onRemove={() => handleRemoveBook(item.bookId, item.book.title)}
              onToggleFavorite={() => handleToggleFavorite(item.bookId)}
              onRead={() => {
                if (item.readingProgress.currentChapter) {
                  navigate(`/reader/${item.bookId}/${item.readingProgress.currentChapter.id}`);
                } else {
                  navigate(`/book/${item.bookId}`);
                }
              }}
              onViewDetails={() => navigate(`/book/${item.bookId}`)}
              formatLastRead={formatLastRead}
              getProgressColor={getProgressColor}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 书籍卡片组件
interface BookCardProps {
  item: BookshelfItem;
  onRemove: () => void;
  onToggleFavorite: () => void;
  onRead: () => void;
  onViewDetails: () => void;
  formatLastRead: (date: string | null) => string;
  getProgressColor: (progress: number) => string;
}

const BookCard: React.FC<BookCardProps> = ({
  item,
  onRemove,
  onToggleFavorite,
  onRead,
  onViewDetails,
  formatLastRead,
  getProgressColor
}) => {
  const progress = item.readingProgress.overallProgress;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* 书籍标题和收藏 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">
            {item.book.title}
          </h3>
          <div className="flex items-center text-sm text-gray-500 space-x-3">
            <span className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              {item.book.author}
            </span>
            <span>{item.book._count.chapters} 章</span>
          </div>
        </div>
        
        <button
          onClick={onToggleFavorite}
          className={`ml-2 p-2 rounded-full transition-colors ${
            item.isFavorite 
              ? 'text-red-500 hover:bg-red-50' 
              : 'text-gray-400 hover:bg-gray-50 hover:text-red-500'
          }`}
        >
          <Heart className={`h-5 w-5 ${item.isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* 阅读进度 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">阅读进度</span>
          <span className="text-sm text-gray-500">{progress}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {item.readingProgress.currentChapter && (
          <div className="text-sm text-gray-600 mb-2">
            <span className="flex items-center">
              <BookmarkIcon className="h-4 w-4 mr-1" />
              {item.readingProgress.currentChapter.title}
            </span>
          </div>
        )}

        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          {formatLastRead(item.readingProgress.lastReadAt)}
        </div>
      </div>

      {/* 分类标签 */}
      {item.book.category && (
        <div className="mb-4">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {item.book.category.name}
          </span>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex space-x-2">
        <button
          onClick={onRead}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {progress > 0 ? '继续阅读' : '开始阅读'}
        </button>
        
        <button
          onClick={onViewDetails}
          className="p-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          title="查看详情"
        >
          <Eye className="h-5 w-5" />
        </button>
        
        <button
          onClick={onRemove}
          className="p-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
          title="移除"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Bookshelf;