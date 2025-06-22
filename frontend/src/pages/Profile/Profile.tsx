// src/pages/Profile/Profile.tsx
import { useAuthStore } from '../../store/authStore';
import { User, Calendar, BookOpen, Star, Award } from 'lucide-react';

const Profile = () => {
  const { user, isLoggedIn } = useAuthStore();

  if (!isLoggedIn || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">请先登录查看个人信息</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 用户信息卡片 */}
      <div className="bg-white rounded-lg shadow p-8">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
            <p className="text-gray-600">{user.email || '未设置邮箱'}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                注册时间：{formatDate(user.createdAt)}
              </span>
              {user.isVip && (
                <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  <Award className="h-4 w-4 mr-1" />
                  VIP会员
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">书架收藏</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
          <p className="text-sm text-gray-500">本书籍</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Star className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">阅读记录</h3>
          <p className="text-3xl font-bold text-yellow-500 mt-2">0</p>
          <p className="text-sm text-gray-500">章节</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Award className="h-8 w-8 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900">阅读时长</h3>
          <p className="text-3xl font-bold text-green-500 mt-2">0</p>
          <p className="text-sm text-gray-500">小时</p>
        </div>
      </div>

      {/* 最近阅读 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">最近阅读</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>暂无阅读记录</p>
            <p className="text-sm">开始阅读您的第一本书吧！</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;