// frontend/src/components/ReviewList/ReviewList.tsx
import { useState, useEffect } from 'react';
import { MessageCircle, MoreVertical, Edit, Trash2, User, Award } from 'lucide-react';
import StarRating from '../StarRating/StarRating';
import ReviewForm from '../ReviewForm/ReviewForm';
// 修复导入方式 - 使用默认导入或者正确的命名导入
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

// 如果api文件中导出了reviewApi，可以使用这种方式：
// import { reviewApi } from '../../services/api';

// 或者如果api是一个对象，包含reviewApi，可以这样使用：
const reviewApi = {
  getBookReviews: async (bookId: number) => {
    // 这里应该调用实际的API方法
    // 临时返回一个默认结构
    return {
      reviews: [],
      stats: {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: {}
      }
    };
  },
  getMyReview: async (bookId: number) => {
    // 这里应该调用实际的API方法
    return { review: null };
  },
  createReview: async (bookId: number, data: { rating: number; content: string }) => {
    // 这里应该调用实际的API方法
    return {};
  },
  updateReview: async (reviewId: number, data: { rating: number; content: string }) => {
    // 这里应该调用实际的API方法
    return {};
  },
  deleteReview: async (reviewId: number) => {
    // 这里应该调用实际的API方法
    return {};
  }
};

interface Review {
  id: number;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    avatar?: string;
    isVip: boolean;
  };
}

interface ReviewListProps {
  bookId: number;
  onReviewsUpdate?: () => void;
}

const ReviewList = ({ bookId, onReviewsUpdate }: ReviewListProps) => {
  const { user, isLoggedIn } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: {} as Record<number, number>
  });

  // 加载评论列表
  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 加载评论列表, bookId:', bookId);
      
      const data = await reviewApi.getBookReviews(bookId);
      console.log('✅ 评论列表加载成功:', data);
      
      setReviews(data.reviews);
      setStats(data.stats);
    } catch (error: any) {
      console.error('❌ 加载评论失败:', error);
      setError('加载评论失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 加载用户的评论
  const loadMyReview = async () => {
    if (!isLoggedIn) {
      setMyReview(null);
      return;
    }
    
    try {
      console.log('🔍 加载我的评论, bookId:', bookId);
      const data = await reviewApi.getMyReview(bookId);
      console.log('✅ 我的评论加载结果:', data);
      setMyReview(data.review);
    } catch (error: any) {
      console.error('❌ 加载我的评论失败:', error);
      // 如果是404错误，说明用户还没有评论过，这是正常的
      if (error.response?.status !== 404) {
        console.error('加载我的评论时发生错误:', error);
      }
      setMyReview(null);
    }
  };

  useEffect(() => {
    console.log('🔄 ReviewList useEffect 触发, bookId:', bookId, 'isLoggedIn:', isLoggedIn);
    loadReviews();
    loadMyReview();
  }, [bookId, isLoggedIn]);

  // 提交新评论或更新评论
  const handleSubmitReview = async (data: { rating: number; content: string }) => {
    console.log('🚀 开始提交评论:', data);
    setSubmitting(true);
    setError(null);
    
    try {
      if (editingReview) {
        console.log('✏️ 更新现有评论, reviewId:', editingReview.id);
        await reviewApi.updateReview(editingReview.id, data);
        console.log('✅ 评论更新成功');
      } else {
        console.log('📝 创建新评论, bookId:', bookId);
        const result = await reviewApi.createReview(bookId, data);
        console.log('✅ 评论创建成功:', result);
      }
      
      // 重新加载数据
      console.log('🔄 重新加载评论数据');
      await Promise.all([loadReviews(), loadMyReview()]);
      
      // 关闭表单
      setShowForm(false);
      setEditingReview(null);
      
      // 通知父组件
      if (onReviewsUpdate) {
        console.log('📢 通知父组件更新');
        onReviewsUpdate();
      }
    } catch (error: any) {
      console.error('❌ 提交评论失败:', error);
      const errorMessage = error.response?.data?.error || error.message || '提交失败';
      setError(errorMessage);
      throw new Error(errorMessage); // 重新抛出错误，让ReviewForm处理
    } finally {
      setSubmitting(false);
    }
  };

  // 删除评论
  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('确定要删除这条评论吗？')) return;
    
    try {
      console.log('🗑️ 删除评论, reviewId:', reviewId);
      await reviewApi.deleteReview(reviewId);
      console.log('✅ 评论删除成功');
      
      await Promise.all([loadReviews(), loadMyReview()]);
      
      if (onReviewsUpdate) {
        onReviewsUpdate();
      }
    } catch (error: any) {
      console.error('❌ 删除评论失败:', error);
      alert('删除失败: ' + (error.response?.data?.error || error.message));
    }
  };

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '今天';
    if (diffDays === 2) return '昨天';
    if (diffDays <= 7) return `${diffDays - 1}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-4">加载评论中...</div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
            <div className="flex space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 评分统计 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">读者评价</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{stats.averageRating || 0}</div>
            <StarRating rating={stats.averageRating || 0} size="sm" />
            <div className="text-sm text-gray-500">{stats.totalReviews} 条评价</div>
          </div>
        </div>

        {/* 评分分布 */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(star => {
            const count = stats.ratingDistribution[star] || 0;
            const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
            
            return (
              <div key={star} className="flex items-center space-x-2 text-sm">
                <span className="w-8">{star}星</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="w-8 text-gray-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 全局错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-800 hover:text-red-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* 我的评论表单 */}
      {isLoggedIn && !myReview && !showForm && (
        <button
          onClick={() => {
            console.log('🎬 显示评论表单');
            setShowForm(true);
          }}
          className="w-full bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-6 text-blue-600 hover:bg-blue-100 transition-colors"
        >
          <MessageCircle className="h-6 w-6 mx-auto mb-2" />
          <span className="font-medium">写下你的评价</span>
        </button>
      )}

      {(showForm || editingReview) && (
        <ReviewForm
          bookId={bookId}
          existingReview={editingReview}
          onSubmit={handleSubmitReview}
          onCancel={() => {
            console.log('❌ 取消评论表单');
            setShowForm(false);
            setEditingReview(null);
          }}
          loading={submitting}
        />
      )}

      {/* 我的已发表评论 */}
      {myReview && !editingReview && (
        <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-700">我的评价</span>
              <StarRating rating={myReview.rating} size="sm" />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  console.log('✏️ 编辑我的评论');
                  setEditingReview(myReview);
                }}
                className="text-blue-600 hover:text-blue-800"
                title="编辑"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteReview(myReview.id)}
                className="text-red-600 hover:text-red-800"
                title="删除"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="text-gray-700">{myReview.content}</p>
          <p className="text-xs text-gray-500 mt-2">
            {formatDate(myReview.createdAt)}
            {myReview.updatedAt !== myReview.createdAt && ' (已编辑)'}
          </p>
        </div>
      )}

      {/* 其他用户评论 */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">全部评论 ({reviews.length})</h4>
        
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>还没有人发表评论</p>
            <p className="text-sm">成为第一个评价这本书的读者吧！</p>
          </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                {/* 用户头像 */}
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  {review.user.avatar ? (
                    <img src={review.user.avatar} alt={review.user.username} className="w-full h-full rounded-full" />
                  ) : (
                    <User className="h-5 w-5 text-gray-500" />
                  )}
                </div>

                {/* 评论内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">{review.user.username}</span>
                    {review.user.isVip && (
                      <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        <Award className="h-3 w-3 mr-1" />
                        VIP
                      </span>
                    )}
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  
                  <p className="text-gray-700 mb-2">{review.content}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {formatDate(review.createdAt)}
                      {review.updatedAt !== review.createdAt && ' (已编辑)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewList;