import { Star } from 'lucide-react';

export default function Rating({
  value = 0,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
}) {
  const px = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(value);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={`transition-transform duration-150 ${
              interactive ? 'cursor-pointer hover:scale-125 active:scale-95' : 'cursor-default'
            }`}
          >
            <Star
              className={`${px} transition-colors duration-200 ${
                filled
                  ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                  : interactive
                    ? 'fill-gray-200 text-gray-200 hover:fill-amber-200 hover:text-amber-200'
                    : 'fill-gray-200 text-gray-200'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}