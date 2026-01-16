import { useRef, useLayoutEffect, useState, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell, Heart, Users, Package, PlayCircle, Calculator,
  Lightbulb, ClipboardCheck, Map, MessageSquare, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  path: string;
  label: string;
  mobileLabel?: string;
  icon: React.ReactNode;
}

const tabs: Tab[] = [
  { path: '/notice', label: '공지', icon: <Bell className="w-4 h-4" /> },
  { path: '/pets', label: '페트', icon: <Heart className="w-4 h-4" /> },
  { path: '/boarding', label: '캐릭/탑승', mobileLabel: '탑승', icon: <Users className="w-4 h-4" /> },
  { path: '/items', label: '아이템', icon: <Package className="w-4 h-4" /> },
  { path: '/game', label: '게임', icon: <PlayCircle className="w-4 h-4" /> },
  { path: '/calculator', label: '계산기', icon: <Calculator className="w-4 h-4" /> },
  { path: '/tip', label: '팁', icon: <Lightbulb className="w-4 h-4" /> },
  { path: '/quests', label: '퀘스트', icon: <ClipboardCheck className="w-4 h-4" /> },
  { path: '/maps', label: '지도', icon: <Map className="w-4 h-4" /> },
  { path: '/board', label: '게시판', icon: <MessageSquare className="w-4 h-4" /> },
];

const TabNavigation = () => {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const activeTabRef = useRef<HTMLAnchorElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || (location.pathname === '/' && path === '/pets');
  };

  // 스크롤 상태 체크
  const checkScrollState = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;

    const { scrollLeft, scrollWidth, clientWidth } = nav;
    setShowLeftArrow(scrollLeft > 5);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
  }, []);

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    checkScrollState();
    nav.addEventListener('scroll', checkScrollState, { passive: true });
    window.addEventListener('resize', checkScrollState);

    return () => {
      nav.removeEventListener('scroll', checkScrollState);
      window.removeEventListener('resize', checkScrollState);
    };
  }, [checkScrollState]);

  // 스크롤 함수
  const scroll = useCallback((direction: 'left' | 'right') => {
    const nav = navRef.current;
    if (!nav) return;

    const scrollAmount = 200;
    nav.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  }, []);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const activeTab = activeTabRef.current;
    if (!nav || !activeTab) return;

    const navRect = nav.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    if (tabRect.left < navRect.left || tabRect.right > navRect.right) {
      activeTab.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  }, [location.pathname]);

  return (
    <div className="sticky top-0 z-30 w-full pt-2 animate-slide-down">
      <div className="max-w-6xl mx-auto px-3 md:px-4">
        {/* 탭 컨테이너 */}
        <div
          ref={containerRef}
          className="group/nav relative rounded-2xl border border-white/10 shadow-xl shadow-black/20 overflow-hidden"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* 블러 배경 레이어 */}
          <div className="absolute inset-0 bg-bg-secondary/80 backdrop-blur-md" />
          {/* 상단 하이라이트 - PC에서만 애니메이션 */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent md:animate-aurora z-10" />

          {/* 왼쪽 스크롤 버튼 - PC에서 호버 시에만 */}
          <button
            onClick={() => scroll('left')}
            className={cn(
              'hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20',
              'w-8 h-8 items-center justify-center',
              'bg-bg-secondary/90 backdrop-blur-sm border border-white/10 rounded-full',
              'text-text-muted hover:text-text-primary hover:bg-bg-elevated',
              'shadow-lg transition-all duration-200',
              'opacity-0 pointer-events-none',
              isHovering && showLeftArrow && 'opacity-100 pointer-events-auto'
            )}
            aria-label="왼쪽으로 스크롤"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* 오른쪽 스크롤 버튼 - PC에서 호버 시에만 */}
          <button
            onClick={() => scroll('right')}
            className={cn(
              'hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20',
              'w-8 h-8 items-center justify-center',
              'bg-bg-secondary/90 backdrop-blur-sm border border-white/10 rounded-full',
              'text-text-muted hover:text-text-primary hover:bg-bg-elevated',
              'shadow-lg transition-all duration-200',
              'opacity-0 pointer-events-none',
              isHovering && showRightArrow && 'opacity-100 pointer-events-auto'
            )}
            aria-label="오른쪽으로 스크롤"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* 왼쪽 페이드 그라데이션 */}
          <div
            className={cn(
              'hidden md:block absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none',
              'bg-gradient-to-r from-bg-secondary/80 to-transparent',
              'transition-opacity duration-200',
              showLeftArrow ? 'opacity-100' : 'opacity-0'
            )}
          />

          {/* 오른쪽 페이드 그라데이션 */}
          <div
            className={cn(
              'hidden md:block absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none',
              'bg-gradient-to-l from-bg-secondary/80 to-transparent',
              'transition-opacity duration-200',
              showRightArrow ? 'opacity-100' : 'opacity-0'
            )}
          />

          <nav ref={navRef} className="relative flex overflow-x-auto scrollbar-hide px-2 py-2 will-change-scroll">
            {tabs.map((tab, index) => {
              const active = isActive(tab.path);
              return (
                <Link
                  key={tab.path}
                  ref={active ? activeTabRef : null}
                  to={tab.path}
                  className={cn(
                    'group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-xl mx-0.5',
                    // 모바일: transform/opacity만 트랜지션, PC: all
                    'transition-[transform,opacity,color] md:transition-all duration-200 md:duration-300 ease-out',
                    'opacity-0 animate-stagger-fade',
                    active
                      ? 'text-white'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                  style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'forwards' }}
                >
                  {/* 활성 탭 배경 - GPU 가속 최적화 */}
                  <span
                    className={cn(
                      'absolute inset-0 rounded-xl will-change-transform',
                      'transition-[transform,opacity] duration-200 ease-out',
                      active
                        ? 'bg-gradient-to-r from-accent to-amber-500 shadow-lg shadow-accent/40 scale-100 opacity-100'
                        : 'bg-white/0 scale-95 opacity-0 group-hover:bg-white/5 group-hover:scale-100 group-hover:opacity-100'
                    )}
                  />

                  {/* 활성 탭 글로우 효과 - PC에서만 */}
                  {active && (
                    <span className="hidden md:block absolute inset-0 rounded-xl bg-accent/20 blur-md animate-breathe" />
                  )}

                  {/* 아이콘 - 모바일에서는 간단한 트랜지션 */}
                  <span className={cn(
                    'relative z-10 transition-transform duration-200 ease-out',
                    active
                      ? 'scale-110 md:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                      : 'group-hover:scale-110 md:group-hover:text-accent'
                  )}>
                    {tab.icon}
                  </span>

                  {/* 라벨 */}
                  <span className={cn(
                    'relative z-10 hidden md:inline transition-colors duration-200',
                    active && 'font-semibold'
                  )}>
                    {tab.label}
                  </span>
                  <span className={cn(
                    'relative z-10 md:hidden text-xs',
                    active && 'font-semibold'
                  )}>
                    {tab.mobileLabel || tab.label}
                  </span>

                  {/* 호버 언더라인 (비활성 탭) - PC에서만 */}
                  {!active && (
                    <span className="hidden md:block absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-accent to-amber-500 rounded-full transition-all duration-300 group-hover:w-1/2" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 하단 그라데이션 라인 - PC에서만 애니메이션 */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent md:animate-aurora" />
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;
