// src/components/BookCard/BookCard.tsx
import { Link } from 'react-router-dom';
import { Star, BookOpen } from 'lucide-react';
import type { Book } from '../../types';

interface BookCardProps {
  book: Book;
  variant?: 'default' | 'compact';
}

const BookCard = ({ book, variant = 'default' }: BookCardProps) => {
  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}万`;
    }
    return num.toString();
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ONGOING': return '连载';
      case 'COMPLETED': return '完结';
      case 'PAUSED': return '暂停';
      default: return '未知';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONGOING': return 'text-green-600 bg-green-100';
      case 'COMPLETED': return 'text-blue-600 bg-blue-100';
      case 'PAUSED': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (variant === 'compact') {
    return (
      <Link to={`/book/${book.id}`} className="block group">
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              {book.cover ? (
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-12 h-16 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {book.title}
              </h3>
              <p className="text-sm text-gray-600 truncate">{book.author}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(book.status)}`}>
                  {getStatusText(book.status)}
                </span>
                <span className="text-xs text-gray-500">
                  {formatNumber(book.totalWords)}字
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/book/${book.id}`} className="block group">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <div className="aspect-[3/4] relative">
          {book.cover ? (
            <img
              src={book.cover}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center group-hover:bg-gray-300 transition-colors">
              <BookOpen className="h-16 w-16 text-gray-400" />
            </div>
          )}
          {!book.isFree && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
              VIP
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
            {book.title}
          </h3>
          <p className="text-sm text-gray-600 mb-2">{book.author}</p>
          
          {book.description && (
            <p className="text-sm text-gray-700 line-clamp-2 mb-3">
              {book.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span className={`px-2 py-1 rounded-full font-medium ${getStatusColor(book.status)}`}>
              {getStatusText(book.status)}
            </span>
            <span>{formatNumber(book.totalWords)}字</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium">{book.rating}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {book.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BookCard;