// frontend/src/components/Recommendations/RecommendationSystem.tsx
import React, { useState, useEffect } from 'react';
import { 
  Star, 
  TrendingUp, 
  Heart, 
  BookOpen, 
  Zap, 
  Target,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Clock
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { recommendationApi } from '../../services/recommendationApi';
import { BookCard } from '../BookCard/BookCard';

// 🎯 推荐类型定义
interface Recommendation {
  book: any;
  score: number;
  reason: string;
  algorithm: 'collaborative' | 'content' | 'hybrid' | 'trending';
}

interface RecommendationListProps {
  recommendations: Recommendation[];
  onBookClick?: (bookId: number) => void;
  onFeedback?: (bookId: number, isPositive: boolean) => void;
}

// 🎯 推荐书籍列表组件
export const RecommendationList: React.FC<RecommendationListProps> = ({ 
  recommendations, 
  onBookClick,
  onFeedback 
}) => {
  const getAlgorithmIcon = (algorithm: string) => {
    switch (algorithm) {
      case 'collaborative': return <Users className="w-4 h-4" />;
      case 'content': return <BookOpen className="w-4 h-4" />;
      case 'hybrid': return <Zap className="w-4 h-4" />;
      case 'trending': return <TrendingUp className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getAlgorithmName = (algorithm: string) => {
    switch (algorithm) {
      case 'collaborative': return '协同过滤';
      case 'content': return '内容推荐';
      case 'hybrid': return '混合推荐';
      case 'trending': return '热门推荐';
      default: return '智能推荐';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-blue-600 bg-blue-50';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">暂无推荐内容</p>
        <p className="text-sm text-gray-400 mt-2">多阅读一些书籍，系统会为您提供更精准的推荐</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {recommendations.map((rec, index) => (
        <div key={`${rec.book.id}-${index}`} className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-start space-x-4">
            {/* 书籍封面 */}
            <div 
              className="w-20 h-28 bg-gray-200 rounded-lg flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onBookClick?.(rec.book.id)}
            >
              {rec.book.cover ? (
                <img 
                  src={rec.book.cover} 
                  alt={rec.book.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* 书籍信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 
                  className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate"
                  onClick={() => onBookClick?.(rec.book.id)}
                >
                  {rec.book.title}
                </h3>
                
                {/* 推荐分数 */}
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(rec.score)}`}>
                  {Math.round(rec.score * 100)}% 匹配
                </div>
              </div>

              <p className="text-gray-600 mb-2">作者：{rec.book.author}</p>
              
              {rec.book.description && (
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                  {rec.book.description}
                </p>
              )}

              {/* 推荐原因和算法 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {getAlgorithmIcon(rec.algorithm)}
                  <span>{getAlgorithmName(rec.algorithm)}</span>
                  <span>•</span>
                  <span>{rec.reason}</span>
                </div>
              </div>

              {/* 书籍统计 */}
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>{rec.book.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{rec.book.viewCount}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{rec.book.totalChapters}章</span>
                </div>
                {rec.book.category && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    {rec.book.category.name}
                  </span>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onBookClick?.(rec.book.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  开始阅读
                </button>
                
                {onFeedback && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onFeedback(rec.book.id, true)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="推荐准确"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onFeedback(rec.book.id, false)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="推荐不准确"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 🎯 推荐设置组件
interface RecommendationSettingsProps {
  settings: {
    enableCollaborative: boolean;
    enableContent: boolean;
    enableTrending: boolean;
    preferredCategories: string[];
    excludeReadBooks: boolean;
    minRating: number;
  };
  onSettingsChange: (settings: any) => void;
}

export const RecommendationSettings: React.FC<RecommendationSettingsProps> = ({
  settings,
  onSettingsChange
}) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const categories = [
    '玄幻', '都市', '历史', '科幻', '军事', '游戏', 
    '竞技', '悬疑', '武侠', '仙侠', '言情', '同人'
  ];

  const handleSave = () => {
    onSettingsChange(localSettings);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">推荐设置</h3>
      
      {/* 推荐算法选择 */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">启用的推荐算法</h4>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.enableCollaborative}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                enableCollaborative: e.target.checked
              })}
              className="mr-2"
            />
            <span>协同过滤（基于相似用户的喜好）</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.enableContent}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                enableContent: e.target.checked
              })}
              className="mr-2"
            />
            <span>内容推荐（基于书籍内容相似性）</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localSettings.enableTrending}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                enableTrending: e.target.checked
              })}
              className="mr-2"
            />
            <span>热门推荐（基于热度和评分）</span>
          </label>
        </div>
      </div>

      {/* 偏好分类 */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">偏好分类</h4>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((category) => (
            <label key={category} className="flex items-center">
              <input
                type="checkbox"
                checked={localSettings.preferredCategories.includes(category)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setLocalSettings({
                      ...localSettings,
                      preferredCategories: [...localSettings.preferredCategories, category]
                    });
                  } else {
                    setLocalSettings({
                      ...localSettings,
                      preferredCategories: localSettings.preferredCategories.filter(c => c !== category)
                    });
                  }
                }}
                className="mr-1"
              />
              <span className="text-sm">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 其他设置 */}
      <div className="mb-6 space-y-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={localSettings.excludeReadBooks}
            onChange={(e) => setLocalSettings({
              ...localSettings,
              excludeReadBooks: e.target.checked
            })}
            className="mr-2"
          />
          <span>排除已读书籍</span>
        </label>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            最低评分要求：{localSettings.minRating.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={localSettings.minRating}
            onChange={(e) => setLocalSettings({
              ...localSettings,
              minRating: parseFloat(e.target.value)
            })}
            className="w-full"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        保存设置
      </button>
    </div>
  );
};

// 🎯 主推荐页面组件
export const RecommendationPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'personalized' | 'trending' | 'settings'>('personalized');
  const { isLoggedIn } = useAuthStore();

  const loadRecommendations = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await recommendationApi.getPersonalizedRecommendations();
      setRecommendations(data.recommendations);
    } catch (error: any) {
      console.error('加载推荐失败:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleBookClick = (bookId: number) => {
    window.location.href = `/book/${bookId}`;
  };

  const handleFeedback = async (bookId: number, isPositive: boolean) => {
    try {
      await recommendationApi.submitFeedback(bookId, isPositive);
      // 可以显示反馈成功提示
    } catch (error: any) {
      console.error('提交反馈失败:', error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadRecommendations();
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">个性化推荐</h2>
        <p className="text-gray-500 mb-4">登录后享受为您量身定制的图书推荐</p>
        <button
          onClick={() => window.location.href = '/login'}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          立即登录
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">智能推荐</h1>
          <p className="text-gray-600 mt-1">基于您的阅读偏好，为您推荐精彩内容</p>
        </div>
        
        <button
          onClick={() => loadRecommendations(true)}
          disabled={refreshing}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>刷新推荐</span>
        </button>
      </div>

      {/* 标签页导航 */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('personalized')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'personalized'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          个性化推荐
        </button>
        <button
          onClick={() => setActiveTab('trending')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'trending'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          热门推荐
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          推荐设置
        </button>
      </div>

      {/* 内容区域 */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">正在为您生成个性化推荐...</p>
        </div>
      ) : (
        <>
          {activeTab === 'personalized' && (
            <RecommendationList
              recommendations={recommendations}
              onBookClick={handleBookClick}
              onFeedback={handleFeedback}
            />
          )}
          
          {activeTab === 'trending' && (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">热门推荐功能开发中...</p>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <RecommendationSettings
              settings={{
                enableCollaborative: true,
                enableContent: true,
                enableTrending: true,
                preferredCategories: [],
                excludeReadBooks: true,
                minRating: 3.0
              }}
              onSettingsChange={(settings) => {
                console.log('设置更新:', settings);
                // 保存设置并重新加载推荐
                loadRecommendations();
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default {
  RecommendationList,
  RecommendationSettings,
  RecommendationPage
};