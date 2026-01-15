import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell, Heart, Users, Package, PlayCircle, Calculator,
  Lightbulb, ClipboardCheck, Map, MessageSquare, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
      icon: <Bell className="w-5 h-5" />,
    },
    {
      path: '/pets',
      label: '페트',
      name: 'pets',
      color: '#fbbf24',
      icon: <Heart className="w-5 h-5" />,
    },
    {
      path: '/boarding',
      label: '캐릭/탑승',
      mobileLabel: '탑승',
      name: 'boarding',
      color: '#a855f7',
      icon: <Users className="w-5 h-5" />,
    },
    {
      path: '/items',
      label: '아이템',
      name: 'items',
      color: '#3b82f6',
      icon: <Package className="w-5 h-5" />,
    },
    {
      path: '/game',
      label: '게임',
      name: 'game',
      color: '#ef4444',
      icon: <PlayCircle className="w-5 h-5" />,
    },
    {
      path: '/calculator',
      label: '계산기',
      name: 'calculator',
      color: '#ec4899',
      icon: <Calculator className="w-5 h-5" />,
    },
    {
      path: '/tip',
      label: '팁',
      name: 'tip',
      color: '#22c55e',
      icon: <Lightbulb className="w-5 h-5" />,
    },
    {
      path: '/quests',
      label: '퀘스트',
      name: 'quests',
      color: '#f43f5e',
      icon: <ClipboardCheck className="w-5 h-5" />,
    },
    {
      path: '/maps',
      label: '지도',
      name: 'maps',
      color: '#06b6d4',
      icon: <Map className="w-5 h-5" />,
    },
    {
      path: '/board',
      label: '게시판',
      name: 'board',
      color: '#8b5cf6',
      icon: <MessageSquare className="w-5 h-5" />,
    },
  ];

  useEffect(() => {
    const currentPath = location.pathname;
    const index = tabs.findIndex(
      tab => currentPath === tab.path ||
        (currentPath === '/' && tab.path === '/pets')
    );
    setActiveIndex(index >= 0 ? index : 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const updateIndicatorPosition = useCallback(() => {
    if (tabsRef.current) {
      const tabElements = tabsRef.current.querySelectorAll('[data-tab]');
      const activeTab = tabElements[activeIndex] as HTMLElement;
      if (activeTab) {
        const scrollLeft = tabsRef.current.scrollLeft;
        setIndicatorStyle({
          left: activeTab.offsetLeft - scrollLeft,
          width: activeTab.offsetWidth,
        });
      }
    }
  }, [activeIndex]);

  // 선택된 탭으로 자동 스크롤
  const scrollToActiveTab = useCallback(() => {
    if (tabsRef.current) {
      const tabElements = tabsRef.current.querySelectorAll('[data-tab]');
      const activeTab = tabElements[activeIndex] as HTMLElement;
      if (activeTab) {
        const container = tabsRef.current;
        const tabLeft = activeTab.offsetLeft;
        const tabWidth = activeTab.offsetWidth;
        const containerWidth = container.clientWidth;
        const scrollLeft = container.scrollLeft;

        // 탭이 보이지 않는 경우에만 스크롤
        if (tabLeft < scrollLeft) {
          // 탭이 왼쪽에 숨겨진 경우
          container.scrollTo({
            left: tabLeft - 16,
            behavior: 'smooth',
          });
        } else if (tabLeft + tabWidth > scrollLeft + containerWidth) {
          // 탭이 오른쪽에 숨겨진 경우
          container.scrollTo({
            left: tabLeft + tabWidth - containerWidth + 16,
            behavior: 'smooth',
          });
        }
      }
    }
  }, [activeIndex]);

  useEffect(() => {
    // 탭 변경 시 먼저 스크롤 후 인디케이터 위치 업데이트
    scrollToActiveTab();
    // 스크롤 애니메이션 후 인디케이터 업데이트
    const timer = setTimeout(() => {
      updateIndicatorPosition();
    }, 100);
    return () => clearTimeout(timer);
  }, [scrollToActiveTab, updateIndicatorPosition]);

  useEffect(() => {
    const tabsContainer = tabsRef.current;
    if (tabsContainer) {
      tabsContainer.addEventListener('scroll', updateIndicatorPosition);
      return () => {
        tabsContainer.removeEventListener('scroll', updateIndicatorPosition);
      };
    }
  }, [updateIndicatorPosition]);

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
        <Card
          variant="glass"
          className="relative rounded-2xl overflow-hidden shadow-xl"
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollTabs('left')}
                className={cn(
                  "hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20",
                  "w-8 h-8 rounded-full bg-bg-primary/90 backdrop-blur-sm",
                  "border border-border shadow-lg hover:scale-110"
                )}
                aria-label="왼쪽으로 스크롤"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}

            {/* Right Scroll Button */}
            {showRightArrow && isHoveringNav && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollTabs('right')}
                className={cn(
                  "hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20",
                  "w-8 h-8 rounded-full bg-bg-primary/90 backdrop-blur-sm",
                  "border border-border shadow-lg hover:scale-110"
                )}
                aria-label="오른쪽으로 스크롤"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}

            {/* Scrollable Tabs */}
            <div
              ref={tabsRef}
              className="flex overflow-x-auto scrollbar-hide gap-1 md:gap-1.5"
            >
              {tabs.map((tab, index) => {
                const isActive =
                  location.pathname === tab.path ||
                  (location.pathname === '/' && tab.path === '/pets');
                const isHovered = hoveredIndex === index;

                return (
                  <Link
                    key={tab.name}
                    to={tab.path}
                    data-tab={tab.name}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={cn(
                      "relative flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-3",
                      "rounded-xl text-sm font-semibold whitespace-nowrap",
                      "transition-all duration-300 ease-out",
                      isActive
                        ? "text-bg-primary"
                        : "text-text-secondary hover:text-text-primary"
                    )}
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
                      className={cn(
                        "relative transition-all duration-300",
                        isActive ? "scale-110" : isHovered ? "scale-105" : "scale-100"
                      )}
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
                className={cn(
                  "absolute top-2 md:top-3 h-[calc(100%-16px)] md:h-[calc(100%-24px)] rounded-xl",
                  "transition-all duration-300 ease-out pointer-events-none"
                )}
                style={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                  background: `linear-gradient(135deg, ${activeColor} 0%, ${activeColor}dd 100%)`,
                  boxShadow: `0 4px 20px ${activeColor}50, 0 0 30px ${activeColor}30`,
                }}
              >
                {/* Shine effect on indicator */}
                <div className="absolute inset-0 rounded-xl overflow-hidden">
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
        </Card>
      </div>

      {/* Spacer for fixed nav */}
      <div className="h-1" />
    </div>
  );
};

export default TabNavigation;
