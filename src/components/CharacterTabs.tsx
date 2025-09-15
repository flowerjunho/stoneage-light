import React from 'react';

interface CharacterTabsProps {
  characters: string[];
  selectedCharacter: string | null;
  onCharacterSelect: (character: string | null) => void;
}

const CharacterTabs: React.FC<CharacterTabsProps> = ({ 
  characters, 
  selectedCharacter, 
  onCharacterSelect 
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 iphone16:px-3 mb-6">
      <div className="border-b border-border-secondary">
        <div className="flex overflow-x-auto scrollbar-hide">
          {/* 전체 보기 탭 */}
          <button
            onClick={() => onCharacterSelect(null)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap iphone16:px-3 iphone16:py-2 iphone16:text-xs ${
              selectedCharacter === null
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-text-muted'
            }`}
          >
            전체
          </button>
          
          {/* 캐릭터별 탭들 */}
          {characters.map((character) => (
            <button
              key={character}
              onClick={() => onCharacterSelect(character)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 whitespace-nowrap iphone16:px-3 iphone16:py-2 iphone16:text-xs ${
                selectedCharacter === character
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-text-muted'
              }`}
            >
              {character}
            </button>
          ))}
        </div>
        
        {/* 별표 펫 설명 */}
        <div className="flex justify-end py-2 px-2">
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <span className="text-yellow-400">⭐</span>
            <span>특정 캐릭터만 탑승 가능</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterTabs;