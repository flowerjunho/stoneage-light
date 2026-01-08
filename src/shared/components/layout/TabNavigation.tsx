import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface Tab {
  path: string;
  label: string;
  mobileLabel?: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const TabNavigation: React.FC = () => {
  const location = useLocation();
  const tabsRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isHoveringNav, setIsHoveringNav] = useState(false);

  const tabs: Tab[] = [
    {
      path: '/notice',
      label: '공지',
      name: 'notice',
      color: '#f97316',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      path: '/market',
      label: '거래소',
      name: 'market',
      color: '#10b981',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      path: '/pets',
      label: '페트',
      name: 'pets',
      color: '#fbbf24',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      path: '/boarding',
      label: '캐릭/탑승',
      mobileLabel: '탑승',
      name: 'boarding',
      color: '#a855f7',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      path: '/game',
      label: '게임',
      name: 'game',
      color: '#ef4444',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      path: '/calculator',
      label: '계산기',
      name: 'calculator',
      color: '#ec4899',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      path: '/tip',
      label: '팁',
      name: 'tip',
      color: '#22c55e',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      path: '/items',
      label: '아이템',
      name: 'items',
      color: '#3b82f6',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      path: '/quests',
      label: '퀘스트',
      name: 'quests',
      color: '#f43f5e',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      path: '/maps',
      label: '지도',
      name: 'maps',
      color: '#06b6d4',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    {
      path: '/board',
      label: '게시판',
      name: 'board',
      color: '#8b5cf6',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      ),
    },
  ];

  // Find active tab index
  useEffect(() => {
    const currentPath = location.pathname;
    const index = tabs.findIndex(
      tab => currentPath === tab.path ||
        (currentPath === '/' && tab.path === '/pets') ||
        (currentPath === '/auction' && tab.path === '/market')
    );
    setActiveIndex(index >= 0 ? index : 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Update indicator position
  const updateIndicatorPosition = useCallback(() => {
    if (tabsRef.current) {
      const tabElements = tabsRef.current.querySelectorAll('[data-tab]');
      const activeTab = tabElements[activeIndex] as HTMLElement;
      if (activeTab) {
        // scrollLeft를 빼서 스크롤 위치를 보정
        const scrollLeft = tabsRef.current.scrollLeft;
        setIndicatorStyle({
          left: activeTab.offsetLeft - scrollLeft,
          width: activeTab.offsetWidth,
        });
      }
    }
  }, [activeIndex]);

  useEffect(() => {
    updateIndicatorPosition();
  }, [updateIndicatorPosition]);

  // 수평 스크롤 시 인디케이터 위치 업데이트
  useEffect(() => {
    const tabsContainer = tabsRef.current;
    if (tabsContainer) {
      tabsContainer.addEventListener('scroll', updateIndicatorPosition);
      return () => {
        tabsContainer.removeEventListener('scroll', updateIndicatorPosition);
      };
    }
  }, [updateIndicatorPosition]);

  // 스크롤 가능 여부 및 화살표 표시 상태 업데이트
  const updateScrollArrows = useCallback(() => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      const hasOverflow = scrollWidth > clientWidth;
      setShowLeftArrow(hasOverflow && scrollLeft > 5);
      setShowRightArrow(hasOverflow && scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, []);

  useEffect(() => {
    updateScrollArrows();
    const tabsContainer = tabsRef.current;
    if (tabsContainer) {
      tabsContainer.addEventListener('scroll', updateScrollArrows);
      window.addEventListener('resize', updateScrollArrows);
      return () => {
        tabsContainer.removeEventListener('scroll', updateScrollArrows);
        window.removeEventListener('resize', updateScrollArrows);
      };
    }
  }, [updateScrollArrows]);

  // 스크롤 함수
  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 150;
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const activeColor = tabs[activeIndex]?.color || '#fbbf24';

  return (
    <div className="sticky top-0 z-30 w-full">
      <div className="max-w-6xl mx-auto px-3 md:px-6">
        {/* Main Container with glassmorphism */}
        <div
          className="relative rounded-2xl overflow-hidden
                      bg-bg-primary/70 backdrop-blur-xl
                      border border-border shadow-xl"
        >
          {/* Top glow line */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${activeColor}40, transparent)`,
            }}
          />

          {/* Tab Container */}
          <div
            className="relative px-2 py-2 md:px-3 md:py-3"
            onMouseEnter={() => setIsHoveringNav(true)}
            onMouseLeave={() => setIsHoveringNav(false)}
          >
            {/* Left Scroll Button */}
            {showLeftArrow && isHoveringNav && (
              <button
                onClick={() => scrollTabs('left')}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20
                          w-8 h-8 items-center justify-center
                          bg-bg-primary/90 backdrop-blur-sm rounded-full
                          border border-border shadow-lg
                          hover:bg-bg-secondary transition-all duration-200
                          text-text-primary hover:scale-110"
                aria-label="왼쪽으로 스크롤"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Right Scroll Button */}
            {showRightArrow && isHoveringNav && (
              <button
                onClick={() => scrollTabs('right')}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20
                          w-8 h-8 items-center justify-center
                          bg-bg-primary/90 backdrop-blur-sm rounded-full
                          border border-border shadow-lg
                          hover:bg-bg-secondary transition-all duration-200
                          text-text-primary hover:scale-110"
                aria-label="오른쪽으로 스크롤"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Scrollable Tabs */}
            <div
              ref={tabsRef}
              className="flex overflow-x-auto scrollbar-hide gap-1 md:gap-1.5"
            >
              {tabs.map((tab, index) => {
                const isActive =
                  location.pathname === tab.path ||
                  (location.pathname === '/' && tab.path === '/pets') ||
                  (location.pathname === '/auction' && tab.path === '/market');
                const isHovered = hoveredIndex === index;

                return (
                  <Link
                    key={tab.name}
                    to={tab.path}
                    data-tab={tab.name}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`
                      relative flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-3
                      rounded-xl text-sm font-semibold whitespace-nowrap
                      transition-all duration-300 ease-out
                      ${isActive
                        ? 'text-bg-primary'
                        : 'text-text-secondary hover:text-text-primary'
                      }
                    `}
                    style={{
                      zIndex: isActive ? 10 : 1,
                    }}
                  >
                    {/* Hover glow effect */}
                    {!isActive && isHovered && (
                      <div
                        className="absolute inset-0 rounded-xl opacity-20 transition-opacity duration-300"
                        style={{
                          background: `radial-gradient(circle at center, ${tab.color} 0%, transparent 70%)`,
                        }}
                      />
                    )}

                    {/* Icon with color on hover */}
                    <span
                      className={`relative transition-all duration-300 ${
                        isActive ? 'scale-110' : isHovered ? 'scale-105' : 'scale-100'
                      }`}
                      style={{
                        color: isActive ? undefined : isHovered ? tab.color : undefined,
                      }}
                    >
                      {tab.icon}
                    </span>

                    {/* Label */}
                    <span className="hidden md:inline relative">{tab.label}</span>
                    <span className="md:hidden text-xs relative">{tab.mobileLabel || tab.label}</span>

                    {/* Active indicator dot for mobile */}
                    {isActive && (
                      <span
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full md:hidden"
                        style={{ backgroundColor: tab.color }}
                      />
                    )}
                  </Link>
                );
              })}

              {/* Animated Background Indicator */}
              <div
                className="absolute top-2 md:top-3 h-[calc(100%-16px)] md:h-[calc(100%-24px)] rounded-xl
                           transition-all duration-300 ease-out pointer-events-none"
                style={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                  background: `linear-gradient(135deg, ${activeColor} 0%, ${activeColor}dd 100%)`,
                  boxShadow: `0 4px 20px ${activeColor}50, 0 0 30px ${activeColor}30`,
                }}
              >
                {/* Shine effect on indicator */}
                <div
                  className="absolute inset-0 rounded-xl overflow-hidden"
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                               -translate-x-full animate-[shimmer_2s_infinite]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom subtle border */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, ${activeColor}20, transparent)`,
            }}
          />
        </div>
      </div>

      {/* Spacer for fixed nav */}
      <div className="h-1" />
    </div>
  );
};

export default TabNavigation;
