// frontend/src/components/StarRating/StarRating.tsx
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

const StarRating = ({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  interactive = false,
  onRatingChange 
}: StarRatingProps) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const handleStarClick = (selectedRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(selectedRating);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {[...Array(maxRating)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= rating;
        const isHalfFilled = starValue - 0.5 <= rating && starValue > rating;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleStarClick(starValue)}
            disabled={!interactive}
            className={`relative ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <Star 
              className={`${sizeClasses[size]} ${
                isFilled || isHalfFilled 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300'
              }`}
            />
            {isHalfFilled && (
              <Star 
                className={`${sizeClasses[size]} text-yellow-400 fill-current absolute top-0 left-0`}
                style={{ clipPath: 'inset(0 50% 0 0)' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;