// frontend/src/pages/UserProfile/UserProfile.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, BookOpen, Calendar, Award, Settings } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载用户数据
    setTimeout(() => {
      setUser({
        id: userId,
        username: '示例用户',
        avatar: null,
        isVip: false,
        joinDate: '2024-01-01',
        followerCount: 123,
        followingCount: 45,
        booksRead: 67,
        totalReadingTime: 12345
      });
      setLoading(false);
    }, 1000);
  }, [userId]);

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

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">用户不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-gray-400" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
              {user.isVip && (
                <span className="bg-yellow-100 text-yellow-800 text-sm px-2 py-1 rounded-full">
                  VIP
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl font-semibold text-gray-900">{user.followerCount}</div>
                <div className="text-sm text-gray-500">粉丝</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-900">{user.followingCount}</div>
                <div className="text-sm text-gray-500">关注</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-900">{user.booksRead}</div>
                <div className="text-sm text-gray-500">已读书籍</div>
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-900">{Math.floor(user.totalReadingTime / 60)}</div>
                <div className="text-sm text-gray-500">阅读小时</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2" />
            <span>加入时间：{new Date(user.joinDate).toLocaleDateString()}</span>
          </div>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            关注
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            最近阅读
          </h3>
          <p className="text-gray-500">暂无阅读记录</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            成就徽章
          </h3>
          <p className="text-gray-500">暂无成就</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;