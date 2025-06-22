// src/pages/Home/Home.tsx
import { useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { useBookStore } from '../../store/bookStore';
import BookCard from '../../components/BookCard/BookCard';

const Home = () => {
  const { books, loading, error, fetchBooks } = useBookStore();

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">❌ {error}</div>
        <button 
          onClick={() => fetchBooks()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          重试
        </button>
      </div>
    );
  }

  const featuredBooks = books.filter(book => book.isFeatured);
  const recentBooks = books.slice(0, 8);

  return (
    <div className="space-y-8">
      {/* 横幅 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg">
        <h2 className="text-3xl font-bold mb-2">发现优秀小说</h2>
        <p className="text-lg opacity-90">海量精品小说，精彩章节每日更新</p>
        <div className="mt-4 text-sm opacity-75">
          📚 当前收录 {books.length} 本精品小说
        </div>
      </div>
      
      {/* 推荐书籍 */}
      {featuredBooks.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold mb-6">⭐ 编辑推荐</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}

      {/* 最新更新 */}
      <div>
        <h3 className="text-2xl font-bold mb-6">📖 最新更新</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentBooks.map(book => (
            <BookCard key={book.id} book={book} variant="compact" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;