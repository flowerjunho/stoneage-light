import React from 'react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  placeholder = 'Search pets...',
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4 iphone16:px-3 iphone16:mb-4">
      <div className="relative flex items-center bg-bg-secondary border border-border rounded-xl px-4 transition-all duration-200 focus-within:border-accent focus-within:shadow-lg focus-within:shadow-accent/10 iphone16:px-3 iphone16:rounded-lg">
        <svg
          className="w-5 h-5 text-text-muted mr-3 flex-shrink-0 iphone16:w-4 iphone16:h-4 iphone16:mr-2"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none py-3.5 text-base text-text-primary placeholder-text-muted font-inherit iphone16:py-3 iphone16:text-sm"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="bg-none border-none p-1 cursor-pointer text-text-muted rounded transition-all duration-200 hover:text-text-primary hover:bg-bg-tertiary flex items-center justify-center ml-2"
            aria-label="Clear search"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
