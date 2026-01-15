import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="max-w-6xl mx-auto px-4 iphone16:px-3 mb-6 animate-slide-up">
      {/* 서브탭: 심플한 언더라인 스타일 (메인 탭과 차별화) */}
      <div className="relative border-b border-border/30">
        <div className="relative">
          {/* 왼쪽 스크롤 버튼 - PC에서만 표시 */}
          {isPC && canScrollLeft && (
            <button
              onClick={scrollLeft}
              className={cn(
                'absolute left-0 top-0 z-10 h-full',
                'bg-gradient-to-r from-bg-primary via-bg-primary/90 to-transparent',
                'pl-0 pr-4 flex items-center',
                'transition-all duration-300 opacity-0 animate-fadeIn'
              )}
              style={{ animationFillMode: 'forwards' }}
              aria-label="Scroll left"
            >
              <div className={cn(
                'w-7 h-7 rounded-full',
                'bg-bg-secondary/80 border border-border/50',
                'flex items-center justify-center',
                'hover:border-accent/50 hover:bg-accent/10',
                'active:scale-95 transition-all duration-200'
              )}>
                <ChevronLeft className="w-4 h-4 text-text-secondary" />
              </div>
            </button>
          )}

          {/* 오른쪽 스크롤 버튼 - PC에서만 표시 */}
          {isPC && canScrollRight && (
            <button
              onClick={scrollRight}
              className={cn(
                'absolute right-0 top-0 z-10 h-full',
                'bg-gradient-to-l from-bg-primary via-bg-primary/90 to-transparent',
                'pr-0 pl-4 flex items-center',
                'transition-all duration-300 opacity-0 animate-fadeIn'
              )}
              style={{ animationFillMode: 'forwards' }}
              aria-label="Scroll right"
            >
              <div className={cn(
                'w-7 h-7 rounded-full',
                'bg-bg-secondary/80 border border-border/50',
                'flex items-center justify-center',
                'hover:border-accent/50 hover:bg-accent/10',
                'active:scale-95 transition-all duration-200'
              )}>
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </div>
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex overflow-x-auto scrollbar-hide scroll-smooth"
          >
            {/* 전체 보기 탭 */}
            <button
              onClick={() => onCharacterSelect(null)}
              className={cn(
                'group relative flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap',
                'transition-all duration-300 ease-out',
                'opacity-0 animate-stagger-fade',
                'iphone16:px-3 iphone16:py-2.5 iphone16:text-xs',
                selectedCharacter === null
                  ? 'text-accent'
                  : 'text-text-muted hover:text-text-primary'
              )}
              style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
            >
              {/* 언더라인 인디케이터 */}
              <span
                className={cn(
                  'absolute bottom-0 left-0 right-0 h-0.5',
                  'bg-gradient-to-r from-accent to-amber-500',
                  'transition-all duration-300 ease-out origin-left',
                  selectedCharacter === null
                    ? 'scale-x-100 opacity-100'
                    : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-30'
                )}
              />

              <span className="relative z-10">전체</span>
            </button>

            {/* 캐릭터별 탭들 */}
            {characters.map((character, index) => (
              <button
                key={character}
                onClick={() => onCharacterSelect(character)}
                className={cn(
                  'group relative flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap',
                  'transition-all duration-300 ease-out',
                  'opacity-0 animate-stagger-fade',
                  'iphone16:px-3 iphone16:py-2.5 iphone16:text-xs',
                  selectedCharacter === character
                    ? 'text-accent'
                    : 'text-text-muted hover:text-text-primary'
                )}
                style={{ animationDelay: `${(index + 1) * 25}ms`, animationFillMode: 'forwards' }}
              >
                {/* 언더라인 인디케이터 */}
                <span
                  className={cn(
                    'absolute bottom-0 left-0 right-0 h-0.5',
                    'bg-gradient-to-r from-accent to-amber-500',
                    'transition-all duration-300 ease-out origin-left',
                    selectedCharacter === character
                      ? 'scale-x-100 opacity-100'
                      : 'scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-30'
                  )}
                />

                <span className="relative z-10">{character}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterTabs;
