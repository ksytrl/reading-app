// frontend/src/components/Social/SocialFeatures.tsx
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Share2, 
  MessageSquare, 
  Heart, 
  UserPlus, 
  UserMinus,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { socialApi } from '../../services/socialApi';

// 🎯 关注按钮组件
interface FollowButtonProps {
  userId: number;
  initialFollowState?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ 
  userId, 
  initialFollowState = false,
  onFollowChange 
}) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowState);
  const [loading, setLoading] = useState(false);
  const { isLoggedIn } = useAuthStore();

  const handleFollowToggle = async () => {
    if (!isLoggedIn) {
      alert('请先登录');
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        await socialApi.unfollowUser(userId);
        setIsFollowing(false);
      } else {
        await socialApi.followUser(userId);
        setIsFollowing(true);
      }
      onFollowChange?.(isFollowing);
    } catch (error: any) {
      console.error('关注操作失败:', error);
      alert(error.response?.data?.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <button
      onClick={handleFollowToggle}
      disabled={loading}
      className={`
        inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all
        ${isFollowing 
          ? 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600' 
          : 'bg-blue-600 text-white hover:bg-blue-700'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4 mr-2" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      {isFollowing ? '取消关注' : '关注'}
    </button>
  );
};

// 🎯 分享组件
interface ShareModalProps {
  bookId: number;
  bookTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ 
  bookId, 
  bookTitle, 
  isOpen, 
  onClose 
}) => {
  const [shareContent, setShareContent] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const shareOptions = [
    { platform: 'wechat', name: '微信', color: 'bg-green-500', icon: '💬' },
    { platform: 'weibo', name: '微博', color: 'bg-orange-500', icon: '🌐' },
    { platform: 'qq', name: 'QQ', color: 'bg-blue-500', icon: '🐧' },
    { platform: 'link', name: '复制链接', color: 'bg-gray-500', icon: '🔗' }
  ];

  const handleShare = async (platform: string) => {
    setLoading(true);
    try {
      const response = await socialApi.shareBook(bookId, {
        platform,
        content: shareContent || `我在阅读《${bookTitle}》，推荐给大家！`
      });
      
      setShareUrl(response.shareUrl);
      
      if (platform === 'link') {
        await navigator.clipboard.writeText(response.shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // 打开对应平台的分享页面
        const shareText = encodeURIComponent(shareContent || `我在阅读《${bookTitle}》，推荐给大家！`);
        const shareLink = encodeURIComponent(response.shareUrl);
        
        let sharePageUrl = '';
        switch (platform) {
          case 'weibo':
            sharePageUrl = `https://service.weibo.com/share/share.php?url=${shareLink}&title=${shareText}`;
            break;
          case 'qq':
            sharePageUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${shareLink}&title=${shareText}`;
            break;
        }
        
        if (sharePageUrl) {
          window.open(sharePageUrl, '_blank');
        }
      }
    } catch (error: any) {
      console.error('分享失败:', error);
      alert(error.response?.data?.error || '分享失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">分享《{bookTitle}》</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            分享内容
          </label>
          <textarea
            value={shareContent}
            onChange={(e) => setShareContent(e.target.value)}
            placeholder={`我在阅读《${bookTitle}》，推荐给大家！`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {shareOptions.map((option) => (
            <button
              key={option.platform}
              onClick={() => handleShare(option.platform)}
              disabled={loading}
              className={`
                ${option.color} text-white p-3 rounded-lg
                hover:opacity-90 transition-opacity
                flex items-center justify-center space-x-2
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <span className="text-lg">{option.icon}</span>
              <span className="font-medium">{option.name}</span>
            </button>
          ))}
        </div>

        {shareUrl && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 truncate mr-2">
                {shareUrl}
              </span>
              <button
                onClick={() => handleShare('link')}
                className="text-blue-600 hover:text-blue-800"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 🎯 讨论组件
interface DiscussionFormProps {
  bookId?: number;
  onSubmit?: (discussion: any) => void;
  onCancel?: () => void;
}

export const DiscussionForm: React.FC<DiscussionFormProps> = ({ 
  bookId, 
  onSubmit, 
  onCancel 
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('GENERAL');
  const [loading, setLoading] = useState(false);

  const discussionTypes = [
    { value: 'GENERAL', label: '一般讨论' },
    { value: 'BOOK_REVIEW', label: '书评讨论' },
    { value: 'CHAPTER', label: '章节讨论' },
    { value: 'AUTHOR', label: '作者讨论' },
    { value: 'QUESTION', label: '问答' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      alert('请填写标题和内容');
      return;
    }

    setLoading(true);
    try {
      const discussion = await socialApi.createDiscussion({
        title: title.trim(),
        content: content.trim(),
        type,
        bookId
      });
      
      onSubmit?.(discussion);
      
      // 重置表单
      setTitle('');
      setContent('');
      setType('GENERAL');
    } catch (error: any) {
      console.error('创建讨论失败:', error);
      alert(error.response?.data?.error || '创建讨论失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          讨论类型
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          {discussionTypes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          讨论标题
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="请输入讨论标题"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          maxLength={100}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          讨论内容
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="请输入讨论内容"
          className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
          rows={6}
        />
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading || !title.trim() || !content.trim()}
          className={`
            flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-medium
            hover:bg-blue-700 transition-colors
            ${loading || !title.trim() || !content.trim() 
              ? 'opacity-50 cursor-not-allowed' 
              : ''
            }
          `}
        >
          {loading ? '发布中...' : '发布讨论'}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
        )}
      </div>
    </form>
  );
};

// 🎯 用户卡片组件
interface UserCardProps {
  user: {
    id: number;
    username: string;
    avatar?: string;
    isVip: boolean;
    followerCount: number;
    followingCount: number;
    booksRead: number;
  };
  showFollowButton?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({ user, showFollowButton = true }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.username}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <Users className="w-6 h-6 text-gray-400" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900">{user.username}</h3>
            {user.isVip && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                VIP
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
            <span>{user.followerCount} 粉丝</span>
            <span>{user.followingCount} 关注</span>
            <span>{user.booksRead} 已读</span>
          </div>
        </div>
        
        {showFollowButton && (
          <FollowButton userId={user.id} />
        )}
      </div>
    </div>
  );
};

// 🎯 社交统计组件
interface SocialStatsProps {
  stats: {
    totalUsers: number;
    totalDiscussions: number;
    totalShares: number;
    activeUsers: number;
  };
}

export const SocialStats: React.FC<SocialStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
        <div className="text-sm text-gray-500">总用户数</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <MessageSquare className="w-8 h-8 text-green-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-gray-900">{stats.totalDiscussions}</div>
        <div className="text-sm text-gray-500">讨论数</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <Share2 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-gray-900">{stats.totalShares}</div>
        <div className="text-sm text-gray-500">分享数</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <Heart className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <div className="text-2xl font-bold text-gray-900">{stats.activeUsers}</div>
        <div className="text-sm text-gray-500">活跃用户</div>
      </div>
    </div>
  );
};

export default {
  FollowButton,
  ShareModal,
  DiscussionForm,
  UserCard,
  SocialStats
};