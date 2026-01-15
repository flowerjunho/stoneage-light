import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  placeholder = '초성으로 검색하세요. 예) ㅇㄱㄹㅎ',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused = activeElement instanceof HTMLInputElement ||
                            activeElement instanceof HTMLTextAreaElement ||
                            activeElement?.getAttribute('contenteditable') === 'true';

      if (isInputFocused) return;

      if (e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClear = () => {
    onSearchChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 md:mb-8 px-4 md:px-0">
      <div
        className={cn(
          "group relative flex items-center",
          "bg-bg-secondary rounded-2xl",
          "border-2 transition-all duration-300 ease-out",
          isFocused
            ? "border-accent shadow-glow"
            : "border-border hover:border-border-light"
        )}
      >
        {/* Search Icon */}
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 md:w-14 md:h-14",
            "transition-colors duration-300",
            isFocused ? "text-accent" : "text-text-muted"
          )}
        >
          <Search className="w-5 h-5 md:w-6 md:h-6" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "flex-1 bg-transparent border-none outline-none",
            "py-3.5 md:py-4 pr-4 text-base md:text-lg",
            "text-text-primary placeholder-text-muted",
            "font-body"
          )}
        />

        {/* Clear Button */}
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="w-10 h-10 mr-2 rounded-xl hover:bg-bg-tertiary"
            aria-label="검색어 지우기"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {/* Keyboard shortcut hint (desktop only) */}
        {!searchTerm && !isFocused && (
          <div className="hidden md:flex items-center gap-1 mr-4">
            <kbd className="px-2 py-1 text-xs font-medium text-text-muted bg-bg-tertiary rounded-md border border-border">
              /
            </kbd>
          </div>
        )}
      </div>

      {/* Search Tips */}
      {isFocused && !searchTerm && (
        <div className="mt-3 px-2 animate-fade-in">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-text-muted">추천 검색:</span>
            {['ㅇㄱㄹㅎ', 'ㅌㅍㄴㄹ', 'ㅍㄹㅁ'].map(term => (
              <Badge
                key={term}
                variant="accent"
                className="cursor-pointer hover:bg-accent hover:text-text-inverse transition-colors duration-200"
                onMouseDown={e => {
                  e.preventDefault();
                  onSearchChange(term);
                }}
              >
                {term}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Active search indicator */}
      {searchTerm && (
        <div className="mt-2 px-2 animate-fade-in">
          <span className="text-xs text-text-muted">
            &quot;<span className="text-accent font-medium">{searchTerm}</span>&quot; 검색 중...
          </span>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
