// frontend/src/components/Layout/Layout.tsx
import { useState, useEffect, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  BookOpen, 
  User, 
  Upload, 
  Menu, 
  X,
  Wifi,
  WifiOff,
  Download,
  Smartphone,
  RotateCcw,
  Bell,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useOffline } from '../../hooks/useOffline';
import { usePWA } from '../../hooks/usePWA';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 🌐 离线状态和PWA功能
  const { 
    isOnline, 
    isOffline, 
    wasOffline, 
    offlineDuration,
    attemptReconnect,
    getConnectionDescription 
  } = useOffline();
  
  const {
    isInstallable,
    showInstallPrompt,
    isStandalone,
    hasUpdate
  } = usePWA();

  // 📱 自动关闭移动端菜单
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // 📱 处理PWA安装
  const handleInstallApp = async () => {
    try {
      // 这里应该调用实际的PWA安装逻辑
      console.log('📱 PWA安装请求');
      // 如果usePWA hook中有installApp方法，应该调用它
      // await installApp();
    } catch (error) {
      console.error('❌ PWA安装失败:', error);
    }
  };

  // 🔄 处理应用更新
  const handleUpdateApp = async () => {
    try {
      // 这里应该调用实际的PWA更新逻辑
      console.log('🔄 应用更新请求');
      // 如果usePWA hook中有updateApp方法，应该调用它
      // await updateApp();
    } catch (error) {
      console.error('❌ 应用更新失败:', error);
    }
  };

  // 🔗 导航链接配置
  const navLinks = [
    { to: '/', label: '首页', icon: Home, requireAuth: false },
    { to: '/search', label: '搜索', icon: Search, requireAuth: false },
    { to: '/bookshelf', label: '书架', icon: BookOpen, requireAuth: true },
    { to: '/upload', label: '上传', icon: Upload, requireAuth: true },
    { to: '/profile', label: '我的', icon: User, requireAuth: true },
  ];

  // 🎨 获取链接样式
  const getLinkStyle = (path: string) => {
    const isActive = location.pathname === path;
    return `flex items-center space-x-2 p-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
    }`;
  };

  // 📱 移动端底部导航样式
  const getMobileLinkStyle = (path: string) => {
    const isActive = location.pathname === path;
    return `flex flex-col items-center justify-center p-2 transition-colors ${
      isActive
        ? 'text-blue-600'
        : 'text-gray-500'
    }`;
  };

  // 🕐 格式化离线时长
  const formatOfflineDuration = (duration: number): string => {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}分${seconds}秒`;
    }
    return `${seconds}秒`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 🔔 离线/更新通知栏 */}
      {(isOffline || hasUpdate || (wasOffline && isOnline)) && (
        <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isOffline 
            ? 'bg-red-500' 
            : hasUpdate 
              ? 'bg-green-500'
              : 'bg-blue-500'
        } text-white px-4 py-2 shadow-lg`}>
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              {isOffline ? (
                <WifiOff className="h-4 w-4" />
              ) : hasUpdate ? (
                <Download className="h-4 w-4" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              
              <span className="text-sm font-medium">
                {isOffline && (
                  `🔌 离线模式 - 已离线 ${formatOfflineDuration(offlineDuration)}`
                )}
                {hasUpdate && '🎉 新版本可用！'}
                {wasOffline && isOnline && '🌐 网络已恢复'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {isOffline && (
                <button
                  onClick={attemptReconnect}
                  className="flex items-center space-x-1 px-3 py-1 bg-white bg-opacity-20 rounded-lg text-sm hover:bg-opacity-30 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>重试</span>
                </button>
              )}
              
              {hasUpdate && (
                <button
                  onClick={handleUpdateApp}
                  className="flex items-center space-x-1 px-3 py-1 bg-white bg-opacity-20 rounded-lg text-sm hover:bg-opacity-30 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  <span>更新</span>
                </button>
              )}
              
              {isOnline && (
                <span className="text-xs opacity-75">
                  {getConnectionDescription()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📱 PWA安装提示栏 */}
      {!isStandalone && isInstallable && showInstallPrompt && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 shadow-lg"
             style={{ top: (isOffline || hasUpdate || (wasOffline && isOnline)) ? '40px' : '0' }}>
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5" />
              <div>
                <p className="font-medium">安装阅读App</p>
                <p className="text-sm opacity-90">添加到主屏幕，获得更好的体验</p>
              </div>
            </div>
            
            <button
              onClick={handleInstallApp}
              className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 rounded-lg text-sm font-medium hover:bg-opacity-30 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>安装</span>
            </button>
          </div>
        </div>
      )}

      {/* 📱 顶部导航栏 */}
      <header className={`bg-white shadow-sm border-b border-gray-200 transition-all duration-300 ${
        (isOffline || hasUpdate || (wasOffline && isOnline)) || (!isStandalone && isInstallable && showInstallPrompt)
          ? 'mt-10 md:mt-12' 
          : ''
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 🏠 Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">阅读App</span>
              {isStandalone && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">PWA</span>
              )}
            </Link>

            {/* 🖥️ 桌面端导航 */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map(({ to, label, icon: Icon, requireAuth }) => {
                if (requireAuth && !user) return null;
                
                return (
                  <Link key={to} to={to} className={getLinkStyle(to)}>
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* 🔧 右侧操作区 */}
            <div className="flex items-center space-x-3">
              {/* 🌐 网络状态指示器（桌面端） */}
              <div className="hidden md:flex items-center space-x-2">
                {isOnline ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Wifi className="h-4 w-4" />
                    <span className="text-xs">在线</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-red-600">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-xs">离线</span>
                  </div>
                )}
              </div>

              {/* 🔔 通知图标 */}
              {hasUpdate && (
                <button
                  onClick={handleUpdateApp}
                  className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  title="有新版本可用"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                </button>
              )}

              {/* 👤 用户菜单 */}
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="hidden md:block text-sm text-gray-600">
                    欢迎, {user.username}
                  </span>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="text-sm text-red-600 hover:text-red-700 transition-colors"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    登录
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link
                    to="/register"
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    注册
                  </Link>
                </div>
              )}

              {/* 📱 移动端菜单按钮 */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 📱 移动端菜单 */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-3 space-y-2">
              {/* 👤 用户信息 */}
              {user ? (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-900">
                    {user.username}
                  </span>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="text-sm text-red-600"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4 py-2 border-b border-gray-100">
                  <Link to="/login" className="text-sm text-gray-600">
                    登录
                  </Link>
                  <Link to="/register" className="text-sm text-blue-600">
                    注册
                  </Link>
                </div>
              )}

              {/* 🔗 导航链接 */}
              {navLinks.map(({ to, label, icon: Icon, requireAuth }) => {
                if (requireAuth && !user) return null;
                
                return (
                  <Link key={to} to={to} className={getLinkStyle(to)}>
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </Link>
                );
              })}

              {/* 🌐 网络状态 */}
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  {isOnline ? (
                    <Wifi className="h-4 w-4 text-green-600" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm text-gray-600">
                    {isOnline ? `在线 - ${getConnectionDescription()}` : '离线模式'}
                  </span>
                </div>
                
                {isOffline && (
                  <button
                    onClick={attemptReconnect}
                    className="text-sm text-blue-600"
                  >
                    重连
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 📱 主内容区域 */}
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>

      {/* 📱 移动端底部导航 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
        <div className="flex">
          {navLinks.slice(0, 5).map(({ to, label, icon: Icon, requireAuth }) => {
            if (requireAuth && !user) return null;
            
            return (
              <Link
                key={to}
                to={to}
                className={`${getMobileLinkStyle(to)} flex-1 min-w-0`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;