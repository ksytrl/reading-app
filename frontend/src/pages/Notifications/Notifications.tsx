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