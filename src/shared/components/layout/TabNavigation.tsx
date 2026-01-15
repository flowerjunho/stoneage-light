import { useRef, useLayoutEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell, Heart, Users, Package, PlayCircle, Calculator,
  Lightbulb, ClipboardCheck, Map, MessageSquare
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

  const isActive = (path: string) => {
    return location.pathname === path || (location.pathname === '/' && path === '/pets');
  };

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
        <div className="relative bg-gradient-to-b from-bg-secondary/90 to-bg-secondary/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl shadow-black/20 overflow-hidden">
          {/* 상단 하이라이트 - 애니메이션 */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent animate-aurora" />

          <nav ref={navRef} className="relative flex overflow-x-auto scrollbar-hide px-2 py-2">
            {tabs.map((tab, index) => {
              const active = isActive(tab.path);
              return (
                <Link
                  key={tab.path}
                  ref={active ? activeTabRef : null}
                  to={tab.path}
                  className={cn(
                    'group relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-xl mx-0.5',
                    'transition-all duration-300 ease-out',
                    'opacity-0 animate-stagger-fade',
                    active
                      ? 'text-white'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                  style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'forwards' }}
                >
                  {/* 활성 탭 배경 - 부드러운 스케일 애니메이션 */}
                  <span
                    className={cn(
                      'absolute inset-0 rounded-xl transition-all duration-300 ease-out',
                      active
                        ? 'bg-gradient-to-r from-accent to-amber-500 shadow-lg shadow-accent/40 scale-100 opacity-100'
                        : 'bg-white/0 scale-95 opacity-0 group-hover:bg-white/5 group-hover:scale-100 group-hover:opacity-100'
                    )}
                  />

                  {/* 활성 탭 글로우 효과 */}
                  {active && (
                    <span className="absolute inset-0 rounded-xl bg-accent/20 blur-md animate-breathe" />
                  )}

                  {/* 아이콘 - 부드러운 트랜지션 */}
                  <span className={cn(
                    'relative z-10 transition-all duration-300 ease-out',
                    active
                      ? 'scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                      : 'group-hover:scale-110 group-hover:text-accent'
                  )}>
                    {tab.icon}
                  </span>

                  {/* 라벨 - 부드러운 전환 */}
                  <span className={cn(
                    'relative z-10 hidden md:inline transition-all duration-300',
                    active && 'font-semibold'
                  )}>
                    {tab.label}
                  </span>
                  <span className={cn(
                    'relative z-10 md:hidden text-xs transition-all duration-300',
                    active && 'font-semibold'
                  )}>
                    {tab.mobileLabel || tab.label}
                  </span>

                  {/* 호버 언더라인 (비활성 탭) */}
                  {!active && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-accent to-amber-500 rounded-full transition-all duration-300 group-hover:w-1/2" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 하단 그라데이션 라인 - 애니메이션 */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent animate-aurora" />
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;
