// src/components/Layout/Layout.tsx
import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Home as HomeIcon, 
  LogIn, 
  User, 
  LogOut, 
  BookmarkIcon, 
  Settings, 
  ChevronDown,
  Upload as UploadIcon,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, isLoggedIn, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setShowMobileMenu(false);
    navigate('/');
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              onClick={closeMobileMenu}
            >
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">阅读App</h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                to="/" 
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <HomeIcon className="h-4 w-4" />
                <span>首页</span>
              </Link>
              
              {isLoggedIn && (
                <>
                  <Link 
                    to="/bookshelf" 
                    className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <BookmarkIcon className="h-4 w-4" />
                    <span>书架</span>
                  </Link>
                  
                  <Link 
                    to="/upload" 
                    className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <UploadIcon className="h-4 w-4" />
                    <span>上传</span>
                  </Link>
                </>
              )}
            </nav>

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {isLoggedIn ? (
                <div className="relative">
                  {/* User Button */}
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">
                      {user?.username}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>

                  {/* Desktop Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                      <div className="py-1">
                        <div className="px-4 py-3 border-b">
                          <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                          <p className="text-xs text-gray-500">{user?.email || '未设置邮箱'}</p>
                          {user?.isVip && (
                            <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              VIP会员
                            </span>
                          )}
                        </div>
                        
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="h-4 w-4 mr-3" />
                          个人中心
                        </Link>
                        
                        <Link
                          to="/bookshelf"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <BookmarkIcon className="h-4 w-4 mr-3" />
                          我的书架
                        </Link>
                        
                        <Link
                          to="/upload"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <UploadIcon className="h-4 w-4 mr-3" />
                          上传书籍
                        </Link>
                        
                        <Link
                          to="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="h-4 w-4 mr-3" />
                          阅读设置
                        </Link>
                        
                        <hr className="my-1" />
                        
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          退出登录
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>登录</span>
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 pb-4 border-t">
              <div className="flex flex-col space-y-2 pt-4">
                <Link
                  to="/"
                  className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  onClick={closeMobileMenu}
                >
                  <HomeIcon className="h-4 w-4" />
                  <span>首页</span>
                </Link>

                {isLoggedIn ? (
                  <>
                    <Link
                      to="/bookshelf"
                      className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={closeMobileMenu}
                    >
                      <BookmarkIcon className="h-4 w-4" />
                      <span>我的书架</span>
                    </Link>
                    
                    <Link
                      to="/upload"
                      className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={closeMobileMenu}
                    >
                      <UploadIcon className="h-4 w-4" />
                      <span>上传书籍</span>
                    </Link>
                    
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={closeMobileMenu}
                    >
                      <User className="h-4 w-4" />
                      <span>个人中心</span>
                    </Link>
                    
                    <Link
                      to="/settings"
                      className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={closeMobileMenu}
                    >
                      <Settings className="h-4 w-4" />
                      <span>阅读设置</span>
                    </Link>

                    <hr className="my-2" />
                    
                    <div className="px-3 py-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                          <p className="text-xs text-gray-500">{user?.email || '未设置邮箱'}</p>
                        </div>
                      </div>
                      {user?.isVip && (
                        <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full mb-2">
                          VIP会员
                        </span>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>退出登录</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      onClick={closeMobileMenu}
                    >
                      <LogIn className="h-4 w-4" />
                      <span>登录</span>
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg mx-3"
                      onClick={closeMobileMenu}
                    >
                      <span>注册</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">阅读App</h3>
              <p className="text-gray-400 text-sm">
                为您提供优质的在线阅读体验，支持用户上传和海量书籍
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">功能</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/" className="hover:text-white transition-colors">书籍浏览</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">在线阅读</Link></li>
                <li><Link to="/upload" className="hover:text-white transition-colors">上传书籍</Link></li>
                <li><Link to="/bookshelf" className="hover:text-white transition-colors">个人书架</Link></li>
                <li><Link to="/profile" className="hover:text-white transition-colors">阅读记录</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">分类</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/?category=玄幻" className="hover:text-white transition-colors">玄幻</Link></li>
                <li><Link to="/?category=都市" className="hover:text-white transition-colors">都市</Link></li>
                <li><Link to="/?category=历史" className="hover:text-white transition-colors">历史</Link></li>
                <li><Link to="/?category=科幻" className="hover:text-white transition-colors">科幻</Link></li>
                <li><Link to="/?category=用户上传" className="hover:text-white transition-colors">用户上传</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">联系我们</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>客服邮箱: support@readingapp.com</li>
                <li>意见反馈: feedback@readingapp.com</li>
                <li>技术支持: tech@readingapp.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 阅读App. All rights reserved. | 支持用户上传txt书籍</p>
          </div>
        </div>
      </footer>

      {/* Click outside to close menus */}
      {(showUserMenu || showMobileMenu) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => {
            setShowUserMenu(false);
            setShowMobileMenu(false);
          }}
        />
      )}
    </div>
  );
};

export default Layout;