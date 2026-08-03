import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, Info, MousePointer, RefreshCw, Sparkles, Archive, ExternalLink, Search, Zap, Check, ArrowDown } from 'lucide-react';
import itemsData from '@/data/pooyas_items.json';
import rightItemsData from '@/data/right_items.json';
import { searchMultipleFields } from '@/shared/utils/searchUtils';
import { EventTracker } from '@/shared/utils/eventTracker';
import SearchBar from '@/shared/components/ui/SearchBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Item {
  id: string;
  name: string;
  imageUrl: string;
  options?: string;
  materials?: string;
  description?: string;
  link?: string;
}

// 로컬 이미지 경로 처리 (로컬/프로덕션 환경 모두 지원)
const getImageUrl = (url: string): string => {
  // 외부 URL (http/https)은 그대로 반환
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // 로컬 이미지는 BASE_URL 적용
  return `${import.meta.env.BASE_URL}${url}`;
};

const ItemsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [displayedItems, setDisplayedItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<'pooyas' | 'hwansoo'>(() => {
    const tabFromUrl = searchParams.get('tab');
    return tabFromUrl === 'pooyas' || tabFromUrl === 'hwansoo' ? tabFromUrl : 'hwansoo';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showEnhanceModal, setShowEnhanceModal] = useState(false);

  const ITEMS_PER_PAGE = 50;

  // 탭 변경 핸들러
  const handleTabChange = useCallback(
    (tab: 'pooyas' | 'hwansoo') => {
      setActiveTab(tab);
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('tab', tab);
        return newParams;
      });
    },
    [setSearchParams]
  );

  useEffect(() => {
    // 데이터 로딩 시뮬레이션
    const loadItems = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      setAllItems(itemsData as Item[]);
      setIsLoading(false);
    };

    loadItems();
  }, []);

  // 탭에 따른 아이템 필터링 (초성 검색 포함)
  const filteredItems = useMemo(() => {
    if (activeTab === 'pooyas') {
      // 검색어가 없으면 모든 아이템 반환
      if (!searchTerm.trim()) {
        return allItems;
      }
      return allItems.filter(item =>
        searchMultipleFields(searchTerm, [item.name, item.options, item.materials])
      );
    }
    if (activeTab === 'hwansoo') {
      // 검색어가 없으면 모든 아이템 반환
      if (!searchTerm.trim()) {
        return rightItemsData;
      }
      return rightItemsData.filter(item =>
        searchMultipleFields(searchTerm, [item.name, item.description, item.materials])
      );
    }
    return [];
  }, [allItems, activeTab, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        EventTracker.trackEvent('SEARCH', '아이템', searchTerm.trim());
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 무한스크롤을 위한 더 많은 아이템 로드
  const loadMoreItems = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    // 로딩 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 500));

    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const newItems = filteredItems.slice(startIndex, endIndex);

    if (newItems.length > 0) {
      setDisplayedItems(prev => {
        const existingIds = new Set(prev.map(item => item.id));
        const uniqueNewItems = newItems.filter(item => !existingIds.has(item.id));
        return [...prev, ...uniqueNewItems];
      });
      setCurrentPage(prev => prev + 1);

      // 더 이상 로드할 아이템이 없는지 확인
      if (endIndex >= filteredItems.length) {
        setHasMore(false);
      }
    } else {
      setHasMore(false);
    }

    setIsLoadingMore(false);
  }, [currentPage, filteredItems, isLoadingMore, hasMore]);

  // 검색어나 탭이 변경될 때 리셋
  useEffect(() => {
    setDisplayedItems([]);
    setCurrentPage(0);
    setHasMore(true);

    if (filteredItems.length > 0) {
      const initialItems = filteredItems.slice(0, ITEMS_PER_PAGE);
      setDisplayedItems(initialItems);
      setCurrentPage(1);
      setHasMore(filteredItems.length > ITEMS_PER_PAGE);
    }
  }, [filteredItems]);

  // 스크롤 이벤트로 무한스크롤 구현
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || isLoadingMore || displayedItems.length === 0) {
        return;
      }

      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;

      // 페이지 하단에서 300px 위에 도달하면 로드
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        loadMoreItems();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [loadMoreItems, hasMore, isLoadingMore, activeTab, displayedItems.length]);

  const handleItemClick = (item: Item) => {
    if (item.link) {
      window.open(item.link, '_blank', 'noopener,noreferrer');
    }
  };

  // 강화 데이터
  const weaponEnhanceData = [
    { level: '+1', stat: '공+1', rate: '100%', destroy: false, count: '1개' },
    { level: '+2', stat: '공+1', rate: '90%', destroy: false, count: '1개' },
    { level: '+3', stat: '공+1,관통 +10', rate: '80%', destroy: false, count: '1개' },
    { level: '+4', stat: '공+1', rate: '70%', destroy: false, count: '1개' },
    { level: '+5', stat: '공+1', rate: '60%', destroy: true, count: '2개' },
    { level: '+6', stat: '공2,명중 +3', rate: '50%', destroy: true, count: '2개' },
    { level: '+7', stat: '공+1', rate: '30%', destroy: true, count: '2개' },
    { level: '+8', stat: '공+1', rate: '20%', destroy: true, count: '2개' },
    { level: '+9', stat: '공+2,관통 +5', rate: '10%', destroy: true, count: '2개', highlight: true },
    { level: '+10', stat: '공+3,명중+5', rate: '5%', destroy: true, count: '2개', highlight: true },
  ];

  const armorEnhanceData = [
    { level: '+1', stat: '방+1', rate: '100%', destroy: false, count: '1개' },
    { level: '+2', stat: '방+1', rate: '90%', destroy: false, count: '1개' },
    { level: '+3', stat: '방+2,쉴드+10', rate: '80%', destroy: false, count: '1개' },
    { level: '+4', stat: '방+1', rate: '70%', destroy: false, count: '1개' },
    { level: '+5', stat: '방+1', rate: '60%', destroy: true, count: '2개' },
    { level: '+6', stat: '방+2,내구력+10', rate: '50%', destroy: true, count: '2개' },
    { level: '+7', stat: '방+1', rate: '30%', destroy: true, count: '2개' },
    { level: '+8', stat: '방+2,쉴드+5', rate: '20%', destroy: true, count: '2개' },
    { level: '+9', stat: '방+2', rate: '10%', destroy: true, count: '2개', highlight: true },
    { level: '+10', stat: '방+3,내구력+10', rate: '5%', destroy: true, count: '2개', highlight: true },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 iphone16:px-3">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <Package className="w-4 h-4" />
            스톤에이지 아이템 도감
          </Badge>

          {/* 정보성 알림 박스 */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-accent" />
              </div>
              <p className="text-sm text-text-secondary text-left">
                아이템 정보는 각 사이트의 공식 데이터입니다.
              </p>
            </div>
            {activeTab === 'pooyas' ? (
              <div className="flex items-center gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <MousePointer className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400 text-left">
                  아이템을 클릭하면 원본 페이지로 이동합니다.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-blue-500/5 rounded-xl border border-blue-500/20">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 text-left">
                  아이템은 지속적으로 추가될 예정입니다.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* 서브 탭 네비게이션 */}
      <div className="mb-6 px-4 md:px-0">
        {/* 강화표 버튼 */}
        <div className="flex justify-end mb-2">
          <Button
            onClick={() => setShowEnhanceModal(true)}
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Zap className="w-4 h-4" />
            강화 정보
          </Button>
        </div>
        <Card className="relative p-1.5">
          {/* 슬라이딩 배경 인디케이터 */}
          <div
            className="absolute top-1.5 h-[calc(100%-12px)] rounded-xl bg-accent shadow-glow
                       transition-all duration-300 ease-out-expo pointer-events-none"
            style={{
              left: activeTab === 'hwansoo' ? '6px' : 'calc(50% + 2px)',
              width: 'calc(50% - 8px)',
            }}
          />
          <Button
            variant="ghost"
            onClick={() => handleTabChange('hwansoo')}
            className={cn(
              "relative z-10 flex-1 w-1/2 gap-2 rounded-xl transition-colors duration-300",
              activeTab === 'hwansoo' ? 'text-text-inverse hover:bg-transparent' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Sparkles className="w-4 h-4" />
            환수강림
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleTabChange('pooyas')}
            className={cn(
              "relative z-10 flex-1 w-1/2 gap-2 rounded-xl transition-colors duration-300",
              activeTab === 'pooyas' ? 'text-text-inverse hover:bg-transparent' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Archive className="w-4 h-4" />
            뿌야
          </Button>
        </Card>
      </div>

      {/* 검색 바 */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="초성으로 검색하세요. 예. ㅇㅎㅎㅌ"
      />

      {/* 통계 정보 */}
      <div className="mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <span className="text-lg">📦</span>
              </div>
              <div>
                <p className="text-sm text-text-secondary">
                  {activeTab === 'hwansoo' ? '환수강림' : '뿌야'}
                </p>
                <p className="text-lg font-bold text-text-primary tabular-nums">
                  {activeTab === 'pooyas' ? allItems.length.toLocaleString() : rightItemsData.length.toLocaleString()}
                  <span className="text-sm font-normal text-text-muted ml-1">아이템</span>
                </p>
              </div>
            </div>
            {searchTerm && (
              <div className="text-right">
                <p className="text-xs text-text-muted">검색 결과</p>
                <p className="text-lg font-bold text-accent tabular-nums">{filteredItems.length}</p>
              </div>
            )}
          </div>
          {displayedItems.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">로드됨</span>
                <div className="flex items-center gap-2">
                  <Progress
                    value={(displayedItems.length / filteredItems.length) * 100}
                    className="w-24 h-1.5"
                  />
                  <span className="text-text-secondary tabular-nums">
                    {displayedItems.length}/{filteredItems.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* 아이템 목록 */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                        flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-text-secondary">아이템 목록을 불러오는 중...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedItems.length > 0 ? (
            displayedItems.map((item, index) => {
              return (
                <Card
                  key={item.id ? `item-${item.id}` : `index-${index}`}
                  onClick={activeTab === 'pooyas' ? () => handleItemClick(item) : undefined}
                  className={cn(
                    "group p-4 transition-all duration-300",
                    "hover:border-accent/50 hover:shadow-card hover:-translate-y-0.5 active:scale-[0.99]",
                    activeTab === 'pooyas' && "cursor-pointer"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* 아이템 이미지 */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 flex items-center justify-center bg-bg-tertiary rounded-xl overflow-hidden
                                    border border-border group-hover:border-accent/30 transition-colors">
                        {item.imageUrl ? (
                          <img
                            src={getImageUrl(item.imageUrl)}
                            alt={item.name}
                            className="w-full h-full object-contain p-1"
                            onError={e => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling!.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className="hidden text-text-muted text-xs">No Image</div>
                      </div>
                    </div>

                    {/* 아이템 정보 */}
                    <div className="flex-1 min-w-0">
                      {/* 아이템 이름 */}
                      <h3 className="text-text-primary font-semibold group-hover:text-accent transition-colors duration-200 mb-1.5">
                        {item.name || '아이템'}
                      </h3>

                      {/* 옵션 정보 (재료/획득) - 뿌야 탭 */}
                      {activeTab === 'pooyas' && item.options && (
                        <p className="text-sm text-text-secondary line-clamp-2 mb-1">{item.options}</p>
                      )}

                      {/* 설명 정보 - 환수강림 탭 */}
                      {activeTab === 'hwansoo' && item.description && (
                        <p className="text-sm text-text-secondary line-clamp-2 mb-1">{item.description}</p>
                      )}

                      {/* 획득 정보 - 환수강림 탭만 */}
                      {activeTab === 'hwansoo' && item.materials && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase tracking-wide text-text-muted">획득:</span>
                          <span className="text-xs text-text-secondary">{item.materials}</span>
                        </div>
                      )}

                      {/* 전체 텍스트 정보 - 뿌야 탭만 */}
                      {activeTab === 'pooyas' &&
                        item.materials &&
                        item.materials !== item.options && (
                          <p className="text-xs text-text-muted whitespace-pre-wrap break-words line-clamp-2">
                            {item.materials}
                          </p>
                        )}
                    </div>

                    {/* 링크 아이콘 - 뿌야 탭만 */}
                    {activeTab === 'pooyas' && (
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-accent/10 group-hover:bg-accent group-hover:shadow-glow
                                      rounded-xl flex items-center justify-center transition-all duration-300">
                          <ExternalLink className="h-4 w-4 text-accent group-hover:text-text-inverse transition-colors" />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                            flex items-center justify-center">
                <Search className="w-10 h-10 text-text-muted" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">검색 결과가 없습니다</h3>
              <p className="text-text-secondary">다른 키워드로 검색해보세요</p>
            </div>
          ) : null}

          {/* 로딩 상태 */}
          {hasMore && displayedItems.length > 0 && (
            <div className="text-center py-8">
              {isLoadingMore ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-bg-secondary border border-border
                                flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-sm text-text-secondary">더 많은 아이템을 불러오는 중...</p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm text-text-muted">
                  <ArrowDown className="w-4 h-4 animate-bounce" />
                  스크롤하여 더 보기
                </div>
              )}
            </div>
          )}

          {/* 모든 아이템 로드 완료 */}
          {!hasMore && displayedItems.length > 0 && (
            <div className="text-center py-8">
              <Badge variant="secondary" className="gap-2">
                <Check className="w-4 h-4 text-accent" />
                모든 아이템을 불러왔습니다
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* 강화표 모달 */}
      <Dialog open={showEnhanceModal} onOpenChange={setShowEnhanceModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 -mx-6 -mt-6 px-6 pt-6 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500
                              flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle>강화 정보</DialogTitle>
                <DialogDescription>아이템 강화 확률 및 정보</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(80vh-120px)] -mx-6 px-6">
            {/* 무기 강화표 */}
            <div className="mb-6">
              <h3 className="text-base font-bold text-cyan-500 mb-3">+ 강화 정보</h3>

              {/* 무기 테이블 */}
              <div className="overflow-x-auto mb-4 rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-purple-500 hover:bg-purple-500">
                      <TableHead className="text-white text-center border-r border-purple-400">대상</TableHead>
                      <TableHead className="text-white text-center border-r border-purple-400">강화 수치</TableHead>
                      <TableHead className="text-white text-center border-r border-purple-400">능력치</TableHead>
                      <TableHead className="text-white text-center border-r border-purple-400">성공률</TableHead>
                      <TableHead className="text-white text-center border-r border-purple-400">파괴 유무</TableHead>
                      <TableHead className="text-white text-center border-r border-purple-400">필요개수</TableHead>
                      <TableHead className="text-white text-center">수급처</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* 무기 데이터 */}
                    {weaponEnhanceData.map((row, idx) => (
                      <TableRow key={`weapon-${idx}`} className={idx % 2 === 0 ? 'bg-bg-primary' : 'bg-bg-secondary'}>
                        {idx === 0 && (
                          <TableCell rowSpan={10} className="text-center font-medium text-text-primary border-r border-border">
                            무기
                          </TableCell>
                        )}
                        <TableCell className={cn(
                          "text-center border-r border-border",
                          row.highlight ? 'text-red-500 font-medium' : 'text-text-primary'
                        )}>
                          {row.level}
                        </TableCell>
                        <TableCell className="text-center text-text-secondary border-r border-border">{row.stat}</TableCell>
                        <TableCell className="text-center text-text-secondary border-r border-border">{row.rate}</TableCell>
                        <TableCell className={cn(
                          "text-center font-medium border-r border-border",
                          row.destroy ? 'text-yellow-500' : 'text-cyan-500'
                        )}>
                          {row.destroy ? 'Y' : 'N'}
                        </TableCell>
                        <TableCell className="text-center text-red-500 border-r border-border">{row.count}</TableCell>
                        {idx === 0 && (
                          <TableCell rowSpan={20} className="text-center text-red-500">
                            스톤 상점
                          </TableCell>
                        )}
                      </TableRow>
                    ))}

                    {/* 방어구 데이터 */}
                    {armorEnhanceData.map((row, idx) => (
                      <TableRow key={`armor-${idx}`} className={idx % 2 === 0 ? 'bg-bg-primary' : 'bg-bg-secondary'}>
                        {idx === 0 && (
                          <TableCell rowSpan={10} className="text-center font-medium text-text-primary border-r border-border">
                            방어구
                          </TableCell>
                        )}
                        <TableCell className={cn(
                          "text-center border-r border-border",
                          row.highlight ? 'text-red-500 font-medium' : 'text-text-primary'
                        )}>
                          {row.level}
                        </TableCell>
                        <TableCell className="text-center text-text-secondary border-r border-border">{row.stat}</TableCell>
                        <TableCell className="text-center text-text-secondary border-r border-border">{row.rate}</TableCell>
                        <TableCell className={cn(
                          "text-center font-medium border-r border-border",
                          row.destroy ? 'text-yellow-500' : 'text-cyan-500'
                        )}>
                          {row.destroy ? 'Y' : 'N'}
                        </TableCell>
                        <TableCell className="text-center text-red-500 border-r border-border">{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemsPage;
