// frontend/src/pages/Achievements/Achievements.tsx
import React, { useState, useEffect } from 'react';
import { Award, Lock, CheckCircle, Star, Trophy } from 'lucide-react';

const Achievements: React.FC = () => {
  const [achievements] = useState([
    {
      id: 1,
      title: '初来乍到',
      description: '注册账户并完成首次登录',
      icon: '🎉',
      unlocked: true,
      unlockedAt: '2024-01-01',
      points: 10
    },
    {
      id: 2,
      title: '书虫入门',
      description: '阅读第一本书',
      icon: '📚',
      unlocked: true,
      unlockedAt: '2024-01-02',
      points: 50
    },
    {
      id: 3,
      title: '阅读达人',
      description: '累计阅读10本书',
      icon: '🏆',
      unlocked: false,
      progress: 3,
      target: 10,
      points: 100
    },
    {
      id: 4,
      title: '深度阅读者',
      description: '单本书阅读时长超过5小时',
      icon: '⏰',
      unlocked: false,
      points: 75
    }
  ]);

  const [totalPoints] = useState(60);
  const [unlockedCount] = useState(2);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">成就系统</h1>
        <p className="text-gray-600">解锁成就，获得积分奖励</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{unlockedCount}</div>
          <div className="text-sm text-gray-500">已解锁成就</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Star className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{totalPoints}</div>
          <div className="text-sm text-gray-500">累计积分</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{achievements.length}</div>
          <div className="text-sm text-gray-500">总成就数</div>
        </div>
      </div>

      <div className="space-y-4">
        {achievements.map((achievement) => (
          <div 
            key={achievement.id} 
            className={`bg-white rounded-lg shadow p-6 ${achievement.unlocked ? '' : 'opacity-75'}`}
          >
            <div className="flex items-center space-x-4">
              <div className={`text-4xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                {achievement.unlocked ? achievement.icon : '🔒'}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">{achievement.title}</h3>
                  {achievement.unlocked && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-2">{achievement.description}</p>
                
                {achievement.unlocked ? (
                  <div className="text-sm text-gray-500">
                    解锁时间：{new Date(achievement.unlockedAt!).toLocaleDateString()}
                  </div>
                ) : achievement.progress !== undefined ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">
                        进度：{achievement.progress} / {achievement.target}
                      </span>
                      <span className="text-sm text-gray-500">
                        {Math.round((achievement.progress / achievement.target!) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(achievement.progress / achievement.target!) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">尚未解锁</div>
                )}
              </div>
              
              <div className="text-right">
                <div className="bg-yellow-100 text-yellow-800 text-sm px-2 py-1 rounded-full">
                  +{achievement.points} 积分
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;

// frontend/src/pages/Notifications/Notifications.tsx
import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Circle, Trash2, Filter } from 'lucide-react';

const Notifications: React.FC = () => {
  const [notifications] = useState([
    {
      id: 1,
      type: 'book_update',
      title: '《示例小说》更新了新章节',
      message: '第100章：大结局已发布',
      read: false,
      createdAt: '2024-01-20T10:00:00Z'
    },
    {
      id: 2,
      type: 'achievement',
      title: '成就解锁',
      message: '恭喜解锁"阅读达人"成就！',
      read: true,
      createdAt: '2024-01-19T15:30:00Z'
    },
    {
      id: 3,
      type: 'social',
      title: '新的粉丝',
      message: '用户"BookLover"关注了你',
      read: false,
      createdAt: '2024-01-18T09:15:00Z'
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'book_update': return '📚';
      case 'achievement': return '🏆';
      case 'social': return '👥';
      default: return '📢';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">通知中心</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} 条未读通知` : '所有通知已读'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">全部通知</option>
            <option value="unread">未读通知</option>
            <option value="read">已读通知</option>
          </select>
          
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">暂无通知</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`bg-white rounded-lg shadow p-4 ${notification.read ? '' : 'border-l-4 border-blue-500'}`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-gray-900">{notification.title}</h3>
                    {!notification.read && (
                      <Circle className="w-2 h-2 text-blue-500 fill-current" />
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                  <div className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {!notification.read && (
                    <button className="p-1 text-gray-400 hover:text-green-600" title="标记为已读">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button className="p-1 text-gray-400 hover:text-red-600" title="删除">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

// frontend/src/pages/MultiFormatReader/MultiFormatReader.tsx
import React from 'react';
import { FileText, AlertCircle } from 'lucide-react';

const MultiFormatReader: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">多格式阅读器</h1>
        <p className="text-gray-600 mb-6">支持txt、epub、pdf等多种格式</p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 inline-block">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">此功能正在开发中，敬请期待...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiFormatReader;

// frontend/src/pages/Admin/Users.tsx - 简化版本
import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, UserPlus, Shield, Ban } from 'lucide-react';

const Users: React.FC = () => {
  const [users] = useState([
    {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      isVip: false,
      status: 'active',
      joinDate: '2024-01-01',
      lastLogin: '2024-01-20',
      booksCount: 5
    }
  ]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-600 mt-1">管理平台所有用户</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center">
          <UserPlus className="w-4 h-4 mr-2" />
          添加用户
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <p className="text-gray-500">用户管理功能开发中...</p>
        </div>
      </div>
    </div>
  );
};

export default Users;

// frontend/src/pages/Admin/Books.tsx - 简化版本
import React from 'react';
import { BookPlus } from 'lucide-react';

const Books: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">书籍管理</h1>
          <p className="text-gray-600 mt-1">管理平台所有书籍</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center">
          <BookPlus className="w-4 h-4 mr-2" />
          添加书籍
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <p className="text-gray-500">书籍管理功能开发中...</p>
        </div>
      </div>
    </div>
  );
};

export default Books;

// frontend/src/pages/Admin/Stats.tsx - 简化版本
import React from 'react';
import { TrendingUp, Users, BookOpen, Eye } from 'lucide-react';

const Stats: React.FC = () => {
  const stats = {
    totalUsers: 1234,
    totalBooks: 5678,
    totalViews: 98765,
    activeUsers: 456
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
        <p className="text-gray-600 mt-1">平台数据分析和趋势展示</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总用户数</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总书籍数</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalBooks.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">总浏览量</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">活跃用户</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">详细统计功能开发中...</p>
      </div>
    </div>
  );
};

export default Stats;

// frontend/src/pages/Errors/NotFound.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center">
        <div className="text-6xl font-bold text-gray-400 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">页面不存在</h1>
        <p className="text-gray-600 mb-8">抱歉，您访问的页面不存在或已被移除。</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回上页
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Home className="w-4 h-4 mr-2" />
            回到首页
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;