// frontend/src/pages/BookDetail/BookDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Star, 
  Heart, 
  Share2, 
  Calendar, 
  User, 
  Tag, 
  FileText,
  Play,
  Award,
  MessageCircle,
  BookmarkPlus,
  BookmarkCheck
} from 'lucide-react';
import { useBookStore } from '../../store/bookStore';
import { useAuthStore } from '../../store/authStore';
import { useBookshelfStore } from '../../store/bookshelfStore';
import ReviewList from '../../components/ReviewList/ReviewList'; // 🎯 新增导入
import StarRating from '../../components/StarRating/StarRating'; // 🎯 新增导入

interface Chapter {
  id: number;
  chapterNumber: number;
  title: string;
  wordCount: number;
  isFree: boolean;
  createdAt: string;
}

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBook, loading, error, fetchBook } = useBookStore();
  const { isLoggedIn } = useAuthStore();
  const { addToBookshelf, removeFromBookshelf, toggleFavorite, checkBookshelfStatus } = useBookshelfStore();
  
  const [activeTab, setActiveTab] = useState<'info' | 'chapters' | 'reviews'>('info');
  const [showAllChapters, setShowAllChapters] = useState(false);
  
  // 🎯 书架状态管理
  const [bookshelfStatus, setBookshelfStatus] = useState({
    inBookshelf: false,
    isFavorite: false
  });
  const [bookshelfLoading, setBookshelfLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBook(parseInt(id));
      loadBookshelfStatus();
    }
  }, [id, fetchBook]);

  // 🎯 加载书架状态
  const loadBookshelfStatus = async () => {
    if (!isLoggedIn || !id) return;
    
    try {
      const status = await checkBookshelfStatus(parseInt(id));
      setBookshelfStatus(status);
    } catch (error) {
      console.error('Failed to load bookshelf status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !currentBook) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">❌ {error || '书籍不存在'}</div>
        <button 
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          返回首页
        </button>
      </div>
    );
  }

  const book = currentBook;
  
  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`;
    }
    return num.toString();
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ONGOING': return '连载中';
      case 'COMPLETED': return '已完结';
      case 'PAUSED': return '暂停更新';
      default: return '未知';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONGOING': return 'text-green-600 bg-green-100';
      case 'COMPLETED': return 'text-blue-600 bg-blue-100';
      case 'PAUSED': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleStartReading = () => {
    if (!book.chapters || book.chapters.length === 0) {
      alert('暂无章节内容');
      return;
    }
    
    const firstChapter = book.chapters[0];
    navigate(`/reader/${book.id}/${firstChapter.id}`);
  };

  // 🎯 书架操作
  const handleBookshelfAction = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    setBookshelfLoading(true);
    try {
      if (bookshelfStatus.inBookshelf) {
        await removeFromBookshelf(book.id);
        setBookshelfStatus({ inBookshelf: false, isFavorite: false });
      } else {
        await addToBookshelf(book.id);
        setBookshelfStatus({ inBookshelf: true, isFavorite: false });
      }
    } catch (error: any) {
      alert(error.response?.data?.error || '操作失败');
    } finally {
      setBookshelfLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
  
    if (!bookshelfStatus.inBookshelf) {
      alert('请先添加到书架');
      return;
    }
  
    try {
      await toggleFavorite(book.id);
      // 🎯 修复：重新加载书架状态，而不是依赖返回值
      await loadBookshelfStatus();
    } catch (error: any) {
      alert(error.response?.data?.error || '操作失败');
    }
  };

  // 🎯 处理评论更新回调
  const handleReviewsUpdate = () => {
    // 重新获取书籍信息以更新评分
    if (id) {
      fetchBook(parseInt(id));
    }
  };

  // 安全处理章节数据，添加类型检查
  const allChapters = book.chapters || [];
  const displayChapters = showAllChapters 
    ? allChapters 
    : allChapters.slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 书籍基本信息 */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* 书籍封面 */}
          <div className="md:w-64 md:flex-shrink-0">
            <div className="h-80 md:h-96 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {book.cover ? (
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-white">
                  <BookOpen className="h-20 w-20 mx-auto mb-4" />
                  <p className="text-lg font-medium">{book.title}</p>
                </div>
              )}
            </div>
          </div>

          {/* 书籍信息 */}
          <div className="flex-1 p-6 md:p-8">
            <div className="space-y-4">
              {/* 标题和作者 */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
                <div className="flex items-center space-x-4 text-gray-600">
                  <span className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {book.author}
                  </span>
                  <span className="flex items-center">
                    <Tag className="h-4 w-4 mr-1" />
                    {book.category?.name || '未分类'}
                  </span>
                </div>
              </div>

              {/* 评分和状态 */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <StarRating rating={book.rating} size="md" />
                  <span className="text-lg font-semibold">{book.rating}</span>
                  <span className="text-gray-500">({book._count?.reviews || 0}人评价)</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(book.status)}`}>
                  {getStatusText(book.status)}
                </span>
                {!book.isFree && (
                  <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    <Award className="h-4 w-4 mr-1" />
                    VIP
                  </span>
                )}
              </div>

              {/* 统计信息 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(book.totalWords)}</div>
                  <div className="text-sm text-gray-500">总字数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{book.totalChapters}</div>
                  <div className="text-sm text-gray-500">章节数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(book.viewCount || 0)}</div>
                  <div className="text-sm text-gray-500">阅读量</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{book._count?.bookshelf || 0}</div>
                  <div className="text-sm text-gray-500">收藏数</div>
                </div>
              </div>

              {/* 标签 */}
              {book.tags && book.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={handleStartReading}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Play className="h-5 w-5 mr-2" />
                  开始阅读
                </button>
                
                {/* 🎯 改进的书架按钮 */}
                <button
                  onClick={handleBookshelfAction}
                  disabled={bookshelfLoading}
                  className={`flex items-center px-6 py-3 rounded-lg transition-colors font-medium ${
                    bookshelfStatus.inBookshelf
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {bookshelfLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                  ) : bookshelfStatus.inBookshelf ? (
                    <BookmarkCheck className="h-5 w-5 mr-2" />
                  ) : (
                    <BookmarkPlus className="h-5 w-5 mr-2" />
                  )}
                  {bookshelfLoading ? '处理中...' : (bookshelfStatus.inBookshelf ? '已在书架' : '加入书架')}
                </button>

                {/* 🎯 收藏按钮 */}
                {bookshelfStatus.inBookshelf && (
                  <button
                    onClick={handleToggleFavorite}
                    className={`flex items-center px-6 py-3 rounded-lg transition-colors font-medium ${
                      bookshelfStatus.isFavorite
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className={`h-5 w-5 mr-2 ${bookshelfStatus.isFavorite ? 'fill-current' : ''}`} />
                    {bookshelfStatus.isFavorite ? '已收藏' : '收藏'}
                  </button>
                )}
                
                <button className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <Share2 className="h-5 w-5 mr-2" />
                  分享
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 选项卡导航 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              作品信息
            </button>
            <button
              onClick={() => setActiveTab('chapters')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'chapters'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="h-4 w-4 inline mr-2" />
              章节目录 ({book.totalChapters})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageCircle className="h-4 w-4 inline mr-2" />
              读者评论 ({book._count?.reviews || 0})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* 作品信息 */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">作品简介</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {book.description || '暂无简介'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">基本信息</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">作者：</dt>
                      <dd className="text-gray-900">{book.author}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">分类：</dt>
                      <dd className="text-gray-900">{book.category?.name || '未分类'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">状态：</dt>
                      <dd className="text-gray-900">{getStatusText(book.status)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">字数：</dt>
                      <dd className="text-gray-900">{formatNumber(book.totalWords)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">评分：</dt>
                      <dd className="flex items-center">
                        <StarRating rating={book.rating} size="sm" />
                        <span className="ml-2 text-gray-900">{book.rating}</span>
                      </dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">更新信息</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">创建时间：</dt>
                      <dd className="text-gray-900">{new Date(book.createdAt).toLocaleDateString('zh-CN')}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">最后更新：</dt>
                      <dd className="text-gray-900">{new Date(book.updatedAt).toLocaleDateString('zh-CN')}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">是否免费：</dt>
                      <dd className="text-gray-900">{book.isFree ? '免费' : 'VIP'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">收藏数：</dt>
                      <dd className="text-gray-900">{book._count?.bookshelf || 0}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* 章节目录 */}
          {activeTab === 'chapters' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">章节目录</h3>
                {allChapters.length > 10 && (
                  <button
                    onClick={() => setShowAllChapters(!showAllChapters)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    {showAllChapters ? '收起' : `查看全部 ${allChapters.length} 章`}
                  </button>
                )}
              </div>
              
              {displayChapters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {displayChapters.map((chapter: Chapter) => (
                    <Link
                      key={chapter.id}
                      to={`/reader/${book.id}/${chapter.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 group-hover:text-blue-600">
                          {chapter.title}
                        </h4>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {formatNumber(chapter.wordCount)}字
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(chapter.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                          {!chapter.isFree && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full">
                              VIP
                            </span>
                          )}
                        </div>
                      </div>
                      <Play className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>暂无章节内容</p>
                  <p className="text-sm">作者正在努力更新中...</p>
                </div>
              )}
            </div>
          )}

          {/* 🎯 读者评论 - 集成评论系统 */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <ReviewList 
                bookId={book.id} 
                onReviewsUpdate={handleReviewsUpdate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetail;