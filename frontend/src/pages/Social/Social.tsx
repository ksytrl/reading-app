// frontend/src/pages/Social/Social.tsx
import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, TrendingUp, Search } from 'lucide-react';
import { SocialStats, UserCard } from '../../components/Social/SocialFeatures';
import { socialApi } from '../../services/socialApi';

const Social: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'discussions' | 'trending'>('users');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDiscussions: 0,
    totalShares: 0,
    activeUsers: 0
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSocialData();
  }, []);

  const loadSocialData = async () => {
    try {
      const [statsData, usersData] = await Promise.all([
        socialApi.getSocialStats(),
        socialApi.getPopularUsers()
      ]);
      setStats(statsData);
      setUsers(usersData.users || []);
    } catch (error) {
      console.error('加载社交数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">社交中心</h1>
        <p className="text-gray-600">与其他读者交流，分享阅读心得</p>
      </div>

      <SocialStats stats={stats} />

      <div className="mt-8">
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            热门用户
          </button>
          <button
            onClick={() => setActiveTab('discussions')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'discussions'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            热门讨论
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'trending'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            动态趋势
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user: any) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}

        {activeTab === 'discussions' && (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">讨论功能开发中...</p>
          </div>
        )}

        {activeTab === 'trending' && (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">趋势分析功能开发中...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Social;