// frontend/src/pages/Admin/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Eye, TrendingUp, Activity, Calendar } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [stats] = useState({
    totalUsers: 1234,
    totalBooks: 5678,
    totalViews: 98765,
    activeUsers: 456
  });

  const [recentActivity] = useState([
    { id: 1, type: 'user_register', message: '新用户注册：BookLover123', time: '5分钟前' },
    { id: 2, type: 'book_upload', message: '新书上传：《人工智能入门》', time: '10分钟前' },
    { id: 3, type: 'book_view', message: '《JavaScript高级程序设计》被阅读', time: '15分钟前' }
  ]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">管理仪表板</h1>
        <p className="text-gray-600 mt-2">系统概览和实时数据监控</p>
      </div>

      {/* 统计卡片 */}
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
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">活跃用户</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 最近活动 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">最近活动</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">快捷操作</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Users className="w-8 h-8 text-blue-600 mb-2" />
                <p className="font-medium text-gray-900">用户管理</p>
                <p className="text-sm text-gray-500">查看和管理用户</p>
              </button>
              
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <BookOpen className="w-8 h-8 text-green-600 mb-2" />
                <p className="font-medium text-gray-900">书籍管理</p>
                <p className="text-sm text-gray-500">管理平台书籍</p>
              </button>
              
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
                <p className="font-medium text-gray-900">数据统计</p>
                <p className="text-sm text-gray-500">查看详细统计</p>
              </button>
              
              <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Calendar className="w-8 h-8 text-orange-600 mb-2" />
                <p className="font-medium text-gray-900">系统设置</p>
                <p className="text-sm text-gray-500">配置系统参数</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// frontend/src/pages/Admin/Users.tsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, UserPlus, Shield, Ban } from 'lucide-react';

interface User {
  id: number;
  username: string;
  email: string;
  isVip: boolean;
  status: 'active' | 'banned' | 'pending';
  joinDate: string;
  lastLogin: string;
  booksCount: number;
}

const Users: React.FC = () => {
  const [users] = useState<User[]>([
    {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      isVip: false,
      status: 'active',
      joinDate: '2024-01-01',
      lastLogin: '2024-01-20',
      booksCount: 5
    },
    {
      id: 2,
      username: 'vipuser',
      email: 'vip@example.com',
      isVip: true,
      status: 'active',
      joinDate: '2023-12-15',
      lastLogin: '2024-01-19',
      booksCount: 15
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned' | 'pending'>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { text: '正常', className: 'bg-green-100 text-green-800' },
      banned: { text: '封禁', className: 'bg-red-100 text-red-800' },
      pending: { text: '待审', className: 'bg-yellow-100 text-yellow-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

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

      {/* 搜索和过滤 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索用户名或邮箱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">所有状态</option>
              <option value="active">正常</option>
              <option value="banned">封禁</option>
              <option value="pending">待审</option>
            </select>
          </div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  书籍数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  加入时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最后登录
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {user.username}
                          {user.isVip && (
                            <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                              VIP
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.booksCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.joinDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900" title="设为VIP">
                        <Shield className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900" title="封禁用户">
                        <Ban className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页 */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
        <div className="flex-1 flex justify-between sm:hidden">
          <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            上一页
          </button>
          <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            下一页
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              显示 <span className="font-medium">1</span> 到 <span className="font-medium">{filteredUsers.length}</span> 条，
              共 <span className="font-medium">{filteredUsers.length}</span> 条记录
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                上一页
              </button>
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600">
                1
              </button>
              <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                下一页
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;

// frontend/src/pages/Admin/Books.tsx
import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, BookPlus, Eye, Edit, Trash2 } from 'lucide-react';

interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  status: 'ONGOING' | 'COMPLETED' | 'HIATUS';
  chapters: number;
  views: number;
  rating: number;
  isFree: boolean;
  createdAt: string;
}

const Books: React.FC = () => {
  const [books] = useState<Book[]>([
    {
      id: 1,
      title: '示例小说',
      author: '示例作者',
      category: '玄幻',
      status: 'ONGOING',
      chapters: 100,
      views: 5000,
      rating: 4.5,
      isFree: true,
      createdAt: '2024-01-01'
    },
    {
      id: 2,
      title: '另一本书',
      author: '另一个作者',
      category: '都市',
      status: 'COMPLETED',
      chapters: 200,
      views: 8000,
      rating: 4.2,
      isFree: false,
      createdAt: '2023-12-15'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ONGOING' | 'COMPLETED' | 'HIATUS'>('all');

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || book.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ONGOING: { text: '连载中', className: 'bg-green-100 text-green-800' },
      COMPLETED: { text: '已完结', className: 'bg-blue-100 text-blue-800' },
      HIATUS: { text: '暂停', className: 'bg-yellow-100 text-yellow-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.text}
      </span>
    );
  };

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

      {/* 搜索和过滤 */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索书名或作者..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">所有状态</option>
              <option value="ONGOING">连载中</option>
              <option value="COMPLETED">已完结</option>
              <option value="HIATUS">暂停</option>
            </select>
          </div>
        </div>
      </div>

      {/* 书籍列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  书籍信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  章节/浏览
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  评分
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-16 bg-gray-200 rounded flex-shrink-0"></div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {book.title}
                          {!book.isFree && (
                            <span className="ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                              付费
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">作者：{book.author}</div>
                        <div className="text-sm text-gray-500">分类：{book.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(book.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{book.chapters} 章</div>
                    <div className="text-gray-500">{book.views.toLocaleString()} 次浏览</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ⭐ {book.rating.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(book.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900" title="查看详情">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900" title="编辑">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900" title="删除">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Books;

// frontend/src/pages/Admin/Stats.tsx
import React, { useState } from 'react';
import { TrendingUp, Users, BookOpen, Eye, Calendar, BarChart3 } from 'lucide-react';

const Stats: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const stats = {
    overview: {
      totalUsers: 1234,
      totalBooks: 5678,
      totalViews: 98765,
      avgRating: 4.2
    },
    trends: {
      userGrowth: 15.2,
      bookGrowth: 8.7,
      viewGrowth: 23.4,
      ratingTrend: 0.3
    }
  };

  const chartData = [
    { date: '2024-01-01', users: 100, books: 50, views: 1000 },
    { date: '2024-01-02', users: 120, books: 55, views: 1200 },
    { date: '2024-01-03', users: 140, books: 60, views: 1400 },
    { date: '2024-01-04', users: 160, books: 65, views: 1600 },
    { date: '2024-01-05', users: 180, books: 70, views: 1800 },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
          <p className="text-gray-600 mt-1">平台数据分析和趋势展示</p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="7d">最近7天</option>
          <option value="30d">最近30天</option>
          <option value="90d">最近90天</option>
          <option value="1y">最近一年</option>
        </select>
      </div>

      {/* 概览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总用户数</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overview.totalUsers.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+{stats.trends.userGrowth}%</span>
            <span className="text-sm text-gray-500 ml-2">vs 上月</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总书籍数</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overview.totalBooks.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+{stats.trends.bookGrowth}%</span>
            <span className="text-sm text-gray-500 ml-2">vs 上月</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">总浏览量</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overview.totalViews.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+{stats.trends.viewGrowth}%</span>
            <span className="text-sm text-gray-500 ml-2">vs 上月</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">平均评分</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overview.avgRating.toFixed(1)}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+{stats.trends.ratingTrend}%</span>
            <span className="text-sm text-gray-500 ml-2">vs 上月</span>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">用户增长趋势</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">图表功能开发中...</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">书籍分类分布</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">图表功能开发中...</p>
            </div>
          </div>
        </div>
      </div>

      {/* 热门内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">热门书籍</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex items-center justify-center">
                      {item}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">示例书籍 {item}</p>
                      <p className="text-xs text-gray-500">示例作者</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {(1000 - item * 100).toLocaleString()} 次浏览
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">活跃用户</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center justify-center">
                      {item}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">用户{item}</p>
                      <p className="text-xs text-gray-500">阅读爱好者</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {50 - item * 5} 本书
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;