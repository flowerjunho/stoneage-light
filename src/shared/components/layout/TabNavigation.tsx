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

  // 선택된 탭이 보이도록 스크롤 (렌더 직후 동기 실행)
  useLayoutEffect(() => {
    const nav = navRef.current;
    const activeTab = activeTabRef.current;
    if (!nav || !activeTab) return;

    const navRect = nav.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    // 탭이 보이지 않는 경우에만 스크롤
    if (tabRect.left < navRect.left || tabRect.right > navRect.right) {
      activeTab.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  }, [location.pathname]);

  return (
    <div className="sticky top-0 z-30 w-full bg-bg-primary/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-6xl mx-auto">
        <nav ref={navRef} className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const active = isActive(tab.path);
            return (
              <Link
                key={tab.path}
                ref={active ? activeTabRef : null}
                to={tab.path}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap',
                  'border-b-2 transition-colors',
                  active
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
                )}
              >
                {tab.icon}
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden text-xs">{tab.mobileLabel || tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;
