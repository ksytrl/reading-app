// src/pages/BookDetail/BookDetail.tsx
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
  MessageCircle
} from 'lucide-react';
import { useBookStore } from '../../store/bookStore';
import { useAuthStore } from '../../store/authStore';
import type { Chapter } from '../../types';

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentBook, loading, error, fetchBook } = useBookStore();
  const { isLoggedIn } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'info' | 'chapters' | 'reviews'>('info');
  const [isFavorited, setIsFavorited] = useState(false);
  const [showAllChapters, setShowAllChapters] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBook(parseInt(id));
    }
  }, [id, fetchBook]);

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

  const handleAddToBookshelf = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    setIsFavorited(!isFavorited);
    // TODO: 实际的收藏逻辑
    alert(isFavorited ? '已从书架移除' : '已添加到书架');
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
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
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
              <div className="flex flex-wrap gap-2">
                {(book.tags || []).map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={handleStartReading}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Play className="h-5 w-5 mr-2" />
                  开始阅读
                </button>
                
                <button
                  onClick={handleAddToBookshelf}
                  className={`flex items-center px-6 py-3 rounded-lg transition-colors font-medium ${
                    isFavorited
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`h-5 w-5 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                  {isFavorited ? '已收藏' : '收藏'}
                </button>
                
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

          {/* 读者评论 */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">读者评论</h3>
              
              <div className="text-center py-12 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>暂无评论</p>
                <p className="text-sm">成为第一个发表评论的读者吧！</p>
                
                {isLoggedIn && (
                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    写评论
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetail;