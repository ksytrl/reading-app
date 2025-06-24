// frontend/src/components/ReviewForm/ReviewForm.tsx
import { useState } from 'react';
import { Send, Edit, X } from 'lucide-react';
import StarRating from '../StarRating/StarRating';
import { useAuthStore } from '../../store/authStore';

interface ReviewFormProps {
  bookId: number;
  existingReview?: {
    id: number;
    rating: number;
    content: string;
  } | null;
  onSubmit: (data: { rating: number; content: string }) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

const ReviewForm = ({ 
  bookId, 
  existingReview, 
  onSubmit, 
  onCancel, 
  loading = false 
}: ReviewFormProps) => {
  const { isLoggedIn, user } = useAuthStore();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [content, setContent] = useState(existingReview?.content || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!existingReview;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔍 评论表单提交开始', { rating, content: content.trim() });
    
    setError(null);
    setIsSubmitting(true);

    // 前端验证
    if (rating === 0) {
      setError('请选择评分');
      setIsSubmitting(false);
      return;
    }

    if (content.trim().length < 5) {
      setError('评论内容至少需要5个字符');
      setIsSubmitting(false);
      return;
    }

    if (!isLoggedIn) {
      setError('请先登录再发表评论');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('🚀 调用onSubmit', { rating, content: content.trim() });
      await onSubmit({ rating, content: content.trim() });
      
      console.log('✅ 评论提交成功');
      
      // 只有新评论才清空表单，编辑评论不清空
      if (!isEditing) {
        setRating(0);
        setContent('');
        console.log('🧹 清空表单');
      }
    } catch (error: any) {
      console.error('❌ 评论提交失败:', error);
      const errorMessage = error.response?.data?.error || error.message || '操作失败';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600 mb-4">登录后可以发表评论</p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          去登录
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {isEditing ? '编辑评论' : '发表评论'}
        </h3>
        {isEditing && onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 评分选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            评分 <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-2">
            <StarRating
              rating={rating}
              size="lg"
              interactive={true}
              onRatingChange={(newRating) => {
                console.log('⭐ 评分变更:', newRating);
                setRating(newRating);
              }}
            />
            <span className="text-sm text-gray-500">
              {rating > 0 ? `${rating} 星` : '请选择评分'}
            </span>
          </div>
        </div>

        {/* 评论内容 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            评论内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => {
              console.log('📝 内容变更:', e.target.value.length);
              setContent(e.target.value);
            }}
            placeholder="分享你对这本书的看法..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            maxLength={500}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">至少5个字符</span>
            <span className="text-xs text-gray-500">{content.length}/500</span>
          </div>
        </div>

        {/* 用户信息显示 */}
        {user && (
          <div className="text-sm text-gray-500">
            以 <strong>{user.username}</strong> 身份发表评论
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 提交按钮 */}
        <div className="flex items-center space-x-3">
          <button
            type="submit"
            disabled={isSubmitting || loading || rating === 0 || content.trim().length < 5}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting || loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <>
                {isEditing ? <Edit className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              </>
            )}
            {isSubmitting ? '提交中...' : (isEditing ? '更新评论' : '发表评论')}
          </button>

          {isEditing && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting || loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              取消
            </button>
          )}
        </div>

        {/* 调试信息（开发环境） */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 border-t pt-2">
            调试: rating={rating}, content.length={content.length}, isLoggedIn={isLoggedIn ? 'true' : 'false'}
          </div>
        )}
      </form>
    </div>
  );
};

export default ReviewForm;