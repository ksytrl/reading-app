// frontend/src/components/Layout/Header.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, BookOpen, Menu } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 临时状态，后续从store获取

  // 🎯 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // 🎯 快速搜索建议
  const quickSearchTags = ['玄幻', '科幻', '武侠', '完结'];

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">阅读App</span>
          </Link>

          {/* 🎯 改进的搜索框 */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索书籍、作者..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              {/* 🎯 搜索建议下拉 */}
              {searchQuery && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50">
                  <div className="p-4">
                    <button
                      onClick={handleSearch}
                      className="w-full text-left p-2 hover:bg-blue-50 rounded flex items-center"
                    >
                      <Search className="h-4 w-4 mr-2 text-blue-600" />
                      搜索 "<strong>{searchQuery}</strong>"
                    </button>
                    
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-2">热门搜索</p>
                      <div className="flex flex-wrap gap-2">
                        {quickSearchTags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => {
                              setSearchQuery(tag);
                              navigate(`/search?q=${encodeURIComponent(tag)}`);
                            }}
                            className="px-2 py-1 bg-gray-100 hover:bg-blue-100 rounded text-sm text-gray-700"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* 导航菜单 */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition-colors">
              首页
            </Link>
            <Link to="/search" className="text-gray-700 hover:text-blue-600 transition-colors">
              搜索
            </Link>
            <Link to="/bookshelf" className="text-gray-700 hover:text-blue-600 transition-colors">
              书架
            </Link>
          </nav>

          {/* 用户菜单 */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center space-x-2">
                <Link to="/profile" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline">个人中心</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="text-gray-700 hover:text-blue-600 transition-colors">
                  登录
                </Link>
                <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  注册
                </Link>
              </div>
            )}

            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 🎯 移动端搜索框 */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索书籍、作者..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>
        </div>

        {/* 移动端菜单 */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-2">
              <Link to="/" className="py-2 text-gray-700 hover:text-blue-600">首页</Link>
              <Link to="/search" className="py-2 text-gray-700 hover:text-blue-600">搜索</Link>
              <Link to="/bookshelf" className="py-2 text-gray-700 hover:text-blue-600">书架</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;