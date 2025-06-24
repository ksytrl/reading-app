// frontend/src/pages/Home/Home.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  TrendingUp, 
  Star, 
  Users, 
  MessageSquare, 
  Zap, 
  Target,
  Heart,
  Share2,
  Award,
  Clock,
  Eye,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useBookStore } from '../../store/bookStore';
import { useAuthStore } from '../../store/authStore';
import BookCard from '../../components/BookCard/BookCard';
import { recommendationApi, socialApi, statsApi } from '../../services/api';

const Home = () => {
  const navigate = useNavigate();
  const { books, loading, error, fetchBooks, clearError } = useBookStore();
  const { isLoggedIn, user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  // 🎯 新增状态 - 推荐和社交数据
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [trendingBooks, setTrendingBooks] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  // 🔄 初始化数据加载
  useEffect(() => {
    fetchBooks();
    loadTrendingContent();
    loadSocialActivity();
    
    if (isLoggedIn) {
      loadPersonalizedRecommendations();
      loadUserStats();
    }
  }, [fetchBooks, isLoggedIn]);

  // 🎯 加载个性化推荐
  const loadPersonalizedRecommendations = async () => {
    if (!isLoggedIn) return;
    
    setRecommendationsLoading(true);
    try {
      const data = await recommendationApi.getPersonalizedRecommendations({ limit: 6 });
      setRecommendations(data.recommendations || []);
    } catch (error: any) {
      console.error('加载推荐失败:', error);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  // 🔥 加载热门内容
  const loadTrendingContent = async () => {
    try {
      const data = await statsApi.getTrendingContent('week');
      setTrendingBooks(data.trendingBooks || []);
    } catch (error: any) {
      console.error('加载热门内容失败:', error);
    }
  };

  // 💬 加载社交动态
  const loadSocialActivity = async () => {
    setSocialLoading(true);
    try {
      const [discussionsData, platformData] = await Promise.all([
        socialApi.getDiscussions({ limit: 5, sort: 'latest' }),
        statsApi.getPlatformStats()
      ]);
      
      setDiscussions(discussionsData.discussions || []);
      setPlatformStats(platformData);
    } catch (error: any) {
      console.error('加载社交数据失败:', error);
    } finally {
      setSocialLoading(false);
    }
  };

  // 📊 加载用户统计
  const loadUserStats = async () => {
    if (!isLoggedIn) return;
    
    try {
      const response = await fetch('/api/users/stats/reading', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const stats = await response.json();
        setUserStats(stats);
      }
    } catch (error: any) {
      console.error('加载用户统计失败:', error);
    }
  };

  // 🎯 处理首页搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('🔍 首页搜索跳转:', searchQuery.trim());
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // 🎯 快速分类搜索
  const quickCategories = [
    { name: '玄幻', icon: '⚡', color: 'bg-purple-100 text-purple-700' },
    { name: '科幻', icon: '🚀', color: 'bg-blue-100 text-blue-700' },
    { name: '武侠', icon: '⚔️', color: 'bg-red-100 text-red-700' },
    { name: '经典', icon: '📚', color: 'bg-yellow-100 text-yellow-700' }
  ];

  // 📊 用户欢迎区域（已登录用户）
  const UserWelcomeSection = () => {
    if (!isLoggedIn || !userStats) return null;

    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg mb-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="text-center lg:text-left mb-6 lg:mb-0">
              <h2 className="text-3xl font-bold mb-2">
                欢迎回来，<span className="text-yellow-300">{user?.username}</span>！
              </h2>
              <p className="text-xl opacity-90">继续您的阅读之旅，探索无限可能</p>
            </div>
            
            {/* 📊 用户阅读统计 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{userStats.booksRead || 0}</div>
                <div className="text-sm text-blue-200">已读书籍</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{Math.floor((userStats.totalReadingTime || 0) / 60)}h</div>
                <div className="text-sm text-blue-200">阅读时长</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{userStats.readingStreak || 0}</div>
                <div className="text-sm text-blue-200">连续天数</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{userStats.chaptersRead || 0}</div>
                <div className="text-sm text-blue-200">已读章节</div>
              </div>
            </div>
          </div>

          {/* 快速操作按钮 */}
          <div className="flex flex-wrap gap-4 mt-6 justify-center lg:justify-start">
            <button
              onClick={() => navigate('/recommendations')}
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              智能推荐
            </button>
            <button
              onClick={() => navigate('/bookshelf')}
              className="border-2 border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              我的书架
            </button>
            <button
              onClick={() => navigate('/discussions')}
              className="border-2 border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              参与讨论
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 🎯 访客欢迎区域（未登录用户）
  const GuestWelcomeSection = () => {
    if (isLoggedIn) return null;

    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg mb-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            发现阅读的<span className="text-yellow-300">无限可能</span>
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            智能推荐、社交阅读、多格式支持，打造专属您的阅读体验
          </p>
          
          {/* 功能亮点 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Zap className="w-8 h-8 mx-auto mb-3 text-yellow-300" />
              <h3 className="text-lg font-semibold mb-2">智能推荐</h3>
              <p className="text-sm text-blue-200">基于AI的个性化推荐系统</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <Users className="w-8 h-8 mx-auto mb-3 text-green-300" />
              <h3 className="text-lg font-semibold mb-2">社交阅读</h3>
              <p className="text-sm text-blue-200">与书友分享交流阅读心得</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <BookOpen className="w-8 h-8 mx-auto mb-3 text-purple-300" />
              <h3 className="text-lg font-semibold mb-2">多格式支持</h3>
              <p className="text-sm text-blue-200">支持TXT、EPUB、PDF等格式</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center"
            >
              <Users className="w-5 h-5 mr-2" />
              立即注册
            </button>
            <button
              onClick={() => navigate('/login')}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              立即登录
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 🎯 搜索区域
  const SearchSection = () => (
    <div className="mb-8">
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索你想要的书籍..."
            className="w-full pl-12 pr-4 py-4 text-gray-900 border border-gray-300 rounded-lg text-lg focus:ring-4 focus:ring-blue-300 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-6 rounded-md hover:bg-blue-700 transition-colors"
          >
            搜索
          </button>
        </div>
      </form>

      {/* 快速分类 */}
      <div className="flex justify-center space-x-4 mb-4">
        {quickCategories.map(category => (
          <button
            key={category.name}
            onClick={() => navigate(`/search?category=${encodeURIComponent(category.name)}`)}
            className={`px-4 py-2 rounded-full ${category.color} hover:scale-105 transition-transform`}
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );

  // 🎯 个性化推荐区域
  const RecommendationSection = () => {
    if (!isLoggedIn || recommendations.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold flex items-center">
            <Sparkles className="h-6 w-6 text-purple-500 mr-2" />
            为您推荐
          </h3>
          <button
            onClick={() => navigate('/recommendations')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
          >
            查看更多
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {recommendationsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.slice(0, 6).map((rec, index) => (
              <div key={`${rec.book.id}-${index}`} className="relative">
                <BookCard book={rec.book} />
                <div className="mt-2 px-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-600 font-medium">
                      <Zap className="w-3 h-3 inline mr-1" />
                      {Math.round(rec.score * 100)}% 匹配
                    </span>
                    <span className="text-gray-500">{rec.algorithm}</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 💬 社交动态区域
  const SocialSection = () => {
    if (discussions.length === 0 && !platformStats) return null;

    return (
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold flex items-center">
            <MessageSquare className="h-6 w-6 text-green-500 mr-2" />
            社交动态
          </h3>
          <button
            onClick={() => navigate('/discussions')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            查看全部
          </button>
        </div>

        {/* 平台统计 */}
        {platformStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{platformStats.totalUsers || 0}</div>
              <div className="text-sm text-gray-500">总用户数</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{platformStats.totalBooks || 0}</div>
              <div className="text-sm text-gray-500">书籍总数</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <MessageSquare className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{discussions.length}</div>
              <div className="text-sm text-gray-500">讨论数</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
              <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{platformStats.activeUsers || 0}</div>
              <div className="text-sm text-gray-500">活跃用户</div>
            </div>
          </div>
        )}

        {/* 最新讨论 */}
        {discussions.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">最新讨论</h4>
            <div className="space-y-3">
              {discussions.slice(0, 5).map((discussion) => (
                <div key={discussion.id} className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => navigate(`/discussions/${discussion.id}`)}>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-gray-900 truncate">
                        {discussion.title}
                      </h5>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {discussion.content}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{discussion.user?.username}</span>
                        <span>{discussion.commentCount || 0} 评论</span>
                        <span>{discussion.likeCount || 0} 点赞</span>
                        <span>{discussion.viewCount || 0} 浏览</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-red-600 mb-4">❌ {error}</div>
          <div className="space-x-4">
            <button 
              onClick={() => {
                clearError();
                fetchBooks();
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              重试
            </button>
            <button 
              onClick={clearError}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  const safeBooks = Array.isArray(books) ? books : [];
  const featuredBooks = safeBooks.filter(book => book.isFeatured);
  const recentBooks = safeBooks.slice(0, 8);
  const displayTrendingBooks = trendingBooks.length > 0 ? trendingBooks : featuredBooks;

  return (
    <div className="space-y-8">
      {/* 欢迎区域 */}
      <UserWelcomeSection />
      <GuestWelcomeSection />
      
      {/* 搜索区域 */}
      <SearchSection />
      
      {/* 个性化推荐区域 */}
      <RecommendationSection />
      
      {/* 推荐书籍 */}
      {displayTrendingBooks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold flex items-center">
              <Star className="h-6 w-6 text-yellow-500 mr-2" />
              {trendingBooks.length > 0 ? '热门推荐' : '编辑推荐'}
            </h3>
            <button
              onClick={() => navigate('/search?sort=rating')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              查看更多 →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayTrendingBooks.slice(0, 6).map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}

      {/* 社交动态 */}
      <SocialSection />

      {/* 最新更新 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold flex items-center">
            <TrendingUp className="h-6 w-6 text-green-500 mr-2" />
            最新更新
          </h3>
          <button
            onClick={() => navigate('/search?sort=updated')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            查看更多 →
          </button>
        </div>
        {recentBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentBooks.map(book => (
              <BookCard key={book.id} book={book} variant="compact" />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无书籍</h3>
            <p className="text-gray-600 mb-4">还没有任何书籍，快去上传第一本书吧！</p>
            <button
              onClick={() => navigate('/upload')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              上传书籍
            </button>
          </div>
        )}
      </div>

      {/* 热门搜索标签 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">🔥 热门搜索</h4>
        <div className="flex flex-wrap gap-2">
          {['完结小说', '新书推荐', '高评分', '经典名著', '用户上传', '免费阅读', '多格式支持', '智能推荐'].map(tag => (
            <button
              key={tag}
              onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
              className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 功能介绍 */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-8">
        <div className="text-center mb-8">
          <h4 className="text-2xl font-bold text-gray-900 mb-2">强大功能，完美体验</h4>
          <p className="text-gray-600">探索Reading App的全新功能</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
            <h5 className="font-semibold text-gray-900 mb-2">智能推荐</h5>
            <p className="text-sm text-gray-600">AI驱动的个性化推荐</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h5 className="font-semibold text-gray-900 mb-2">社交阅读</h5>
            <p className="text-sm text-gray-600">与书友分享和讨论</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <h5 className="font-semibold text-gray-900 mb-2">多格式支持</h5>
            <p className="text-sm text-gray-600">TXT、EPUB、PDF全支持</p>
          </div>
          
          <div className="text-center">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Target className="w-8 h-8 text-orange-600" />
            </div>
            <h5 className="font-semibold text-gray-900 mb-2">阅读目标</h5>
            <p className="text-sm text-gray-600">制定和追踪阅读计划</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;