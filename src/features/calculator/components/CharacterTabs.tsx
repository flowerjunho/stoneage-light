import React, { useRef, useState, useEffect, useCallback } from 'react';

interface CharacterTabsProps {
  characters: string[];
  selectedCharacter: string | null;
  onCharacterSelect: (character: string | null) => void;
}

const CharacterTabs: React.FC<CharacterTabsProps> = ({
  characters,
  selectedCharacter,
  onCharacterSelect,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isPC, setIsPC] = useState(false);

  // PC 환경 감지
  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(
        userAgent
      );
      const isTablet = /ipad|android(?!.*mobile)/.test(userAgent);
      setIsPC(!isMobile && !isTablet && window.innerWidth >= 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 스크롤 상태 업데이트
  const updateScrollButtons = useCallback(() => {
    if (!scrollRef.current || !isPC) return;

    const element = scrollRef.current;
    const scrollLeft = element.scrollLeft;
    const scrollWidth = element.scrollWidth;
    const clientWidth = element.clientWidth;

    // 스크롤 여유 공간 (10px 정도의 여유를 둠)
    const scrollTolerance = 10;

    setCanScrollLeft(scrollLeft > scrollTolerance);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - scrollTolerance);
  }, [isPC]);

  // 초기 스크롤 상태 확인 및 이벤트 리스너 등록
  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !isPC) return;

    updateScrollButtons();
    element.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      element.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [isPC, characters, updateScrollButtons]);

  // 스크롤 함수
  const scrollLeft = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 iphone16:px-3 mb-6">
      <div className="border-b border-border-secondary">
        <div className="relative">
          {/* 왼쪽 스크롤 버튼 - PC에서만 표시 */}
          {isPC && canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-0 z-10 h-full bg-gradient-to-r from-bg-primary to-transparent pl-2 pr-4 flex items-center hover:from-bg-secondary transition-all duration-200"
              aria-label="Scroll left"
            >
              <div className="w-8 h-8 rounded-full bg-bg-secondary border border-border-primary shadow-md flex items-center justify-center hover:bg-bg-tertiary hover:border-accent/30 transition-colors">
                <svg
                  className="w-4 h-4 text-text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </div>
            </button>
          )}

          {/* 오른쪽 스크롤 버튼 - PC에서만 표시 */}
          {isPC && canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-0 z-10 h-full bg-gradient-to-l from-bg-primary to-transparent pr-2 pl-4 flex items-center hover:from-bg-secondary transition-all duration-200"
              aria-label="Scroll right"
            >
              <div className="w-8 h-8 rounded-full bg-bg-secondary border border-border-primary shadow-md flex items-center justify-center hover:bg-bg-tertiary hover:border-accent/30 transition-colors">
                <svg
                  className="w-4 h-4 text-text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
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
            {characters.map(character => (
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
        </div>
      </div>
    </div>
  );
};

export default CharacterTabs;
