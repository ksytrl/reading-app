// frontend/src/pages/Search/Search.tsx
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search as SearchIcon, 
  Filter, 
  SortAsc, 
  X, 
  Clock,
  TrendingUp,
  Star,
  BookOpen 
} from 'lucide-react';
import { useBookStore } from '../../store/bookStore';
import BookCard from '../../components/BookCard/BookCard';

const Search = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { books, loading, error, fetchBooks, clearError } = useBookStore();
  
  // 搜索状态
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
  const [showFilters, setShowFilters] = useState(false);
  
  // 搜索历史
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // 分类选项
  const categories = [
    { value: '', label: '全部分类' },
    { value: '玄幻', label: '玄幻' },
    { value: '科幻', label: '科幻' },
    { value: '武侠', label: '武侠' },
    { value: '经典', label: '经典' },
    { value: '用户上传', label: '用户上传' }
  ];

  // 排序选项
  const sortOptions = [
    { value: 'relevance', label: '相关度' },
    { value: 'updated', label: '最近更新' },
    { value: 'rating', label: '评分最高' },
    { value: 'popular', label: '最受欢迎' },
    { value: 'newest', label: '最新发布' }
  ];

// 在 frontend/src/pages/Search/Search.tsx 中找到 performSearch 函数，替换为：

// 执行搜索
const performSearch = useCallback(async (query: string, cat: string, sort: string) => {
  const params: any = {};
  
  if (query.trim()) {
    params.search = query.trim();
    
    // 添加到搜索历史
    if (query.trim() && !searchHistory.includes(query.trim())) {
      const newHistory = [query.trim(), ...searchHistory.slice(0, 4)];
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }
  }
  
  if (cat) params.category = cat;
  if (sort && sort !== 'relevance') params.sort = sort; // 🎯 添加排序参数

  console.log('🔍 搜索页面发起请求:', params); // 🎯 添加调试日志

  try {
    await fetchBooks(params);
    console.log('✅ 搜索完成'); // 🎯 添加调试日志
  } catch (error) {
    console.error('❌ 搜索失败:', error); // 🎯 添加调试日志
  }
}, [fetchBooks, searchHistory]);

  // 处理搜索提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 更新URL参数
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (category) params.set('category', category);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    
    setSearchParams(params);
    performSearch(searchQuery, category, sortBy);
  };

  // 清除搜索
  const clearSearch = () => {
    setSearchQuery('');
    setCategory('');
    setSortBy('relevance');
    setSearchParams({});
    fetchBooks();
  };

  // 使用搜索历史
  const useHistoryItem = (item: string) => {
    setSearchQuery(item);
    performSearch(item, category, sortBy);
  };

  // 删除搜索历史项
  const removeHistoryItem = (item: string) => {
    const newHistory = searchHistory.filter(h => h !== item);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // 初始化搜索
  useEffect(() => {
    const query = searchParams.get('q') || '';
    const cat = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'relevance';
    
    setSearchQuery(query);
    setCategory(cat);
    setSortBy(sort);
    
    performSearch(query, cat, sort);
  }, [searchParams, performSearch]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 搜索表单 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* 主搜索框 */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索书名、作者、关键词..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* 筛选器 */}
          <div className="flex flex-wrap items-center gap-4">
            {/* 分类筛选 */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* 排序方式 */}
            <div className="flex items-center space-x-2">
              <SortAsc className="h-4 w-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* 搜索按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '搜索中...' : '搜索'}
            </button>

            {/* 清除按钮 */}
            {(searchQuery || category || sortBy !== 'relevance') && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-gray-600 hover:text-gray-800 text-sm"
              >
                清除筛选
              </button>
            )}
          </div>
        </form>

        {/* 搜索历史 */}
        {searchHistory.length > 0 && !searchQuery && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              搜索历史
            </h4>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => useHistoryItem(item)}
                  className="group flex items-center bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-sm text-gray-700 transition-colors"
                >
                  <span>{item}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeHistoryItem(item);
                    }}
                    className="ml-2 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 搜索结果统计 */}
      {!loading && (
        <div className="flex items-center justify-between">
          <div className="text-gray-600">
            {searchQuery ? (
              <span>搜索 "<strong>{searchQuery}</strong>" 找到 <strong>{books.length}</strong> 个结果</span>
            ) : (
              <span>共 <strong>{books.length}</strong> 本书籍</span>
            )}
          </div>
          
          {books.length > 0 && (
            <div className="text-sm text-gray-500">
              按{sortOptions.find(s => s.value === sortBy)?.label}排序
            </div>
          )}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-red-600">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <SearchIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? '没有找到相关书籍' : '开始搜索书籍'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchQuery 
              ? '尝试调整搜索关键词或筛选条件' 
              : '输入书名、作者或关键词来搜索书籍'
            }
          </p>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              浏览全部书籍
            </button>
          )}
        </div>
      )}

      {/* 热门搜索建议 */}
      {!searchQuery && !loading && books.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            热门搜索
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['玄幻', '科幻', '武侠', '完结小说', '新书推荐', '经典名著', '用户上传', '高评分'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (['玄幻', '科幻', '武侠', '经典', '用户上传'].includes(tag)) {
                    setCategory(tag);
                    setSearchQuery('');
                  } else {
                    setSearchQuery(tag);
                    setCategory('');
                  }
                  performSearch(tag.includes('玄幻') ? '' : tag, tag.includes('玄幻') ? tag : '', sortBy);
                }}
                className="text-left p-3 bg-white rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors border"
              >
                <div className="font-medium">{tag}</div>
                <div className="text-sm text-gray-500">点击搜索</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;