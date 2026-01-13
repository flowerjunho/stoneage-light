import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import itemsData from '@/data/pooyas_items.json';
import rightItemsData from '@/data/right_items.json';
import { searchMultipleFields } from '@/shared/utils/searchUtils';
import SearchBar from '@/shared/components/ui/SearchBar';

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 iphone16:px-3">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-sm font-medium text-accent">스톤에이지 아이템 도감</span>
          </div>

          {/* 정보성 알림 박스 */}
          <div className="bg-bg-secondary rounded-2xl p-4 border border-border space-y-3">
            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-text-secondary text-left">
                아이템 정보는 각 사이트의 공식 데이터입니다.
              </p>
            </div>
            {activeTab === 'pooyas' ? (
              <div className="flex items-center gap-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400 text-left">
                  아이템을 클릭하면 원본 페이지로 이동합니다.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-blue-500/5 rounded-xl border border-blue-500/20">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 text-left">
                  아이템은 지속적으로 추가될 예정입니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 서브 탭 네비게이션 */}
      <div className="mb-6 px-4 md:px-0">
        {/* 강화표 버튼 */}
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShowEnhanceModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
                       bg-gradient-to-r from-purple-500 to-pink-500 text-white
                       rounded-lg shadow-md hover:shadow-lg hover:scale-105
                       transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            강화 정보
          </button>
        </div>
        <div className="relative flex bg-bg-secondary rounded-2xl p-1.5 border border-border">
          {/* 슬라이딩 배경 인디케이터 */}
          <div
            className="absolute top-1.5 h-[calc(100%-12px)] rounded-xl bg-accent shadow-glow
                       transition-all duration-300 ease-out-expo pointer-events-none"
            style={{
              left: activeTab === 'hwansoo' ? '6px' : 'calc(50% + 2px)',
              width: 'calc(50% - 8px)',
            }}
          />
          <button
            onClick={() => handleTabChange('hwansoo')}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                       text-sm font-medium transition-colors duration-300 ${
                         activeTab === 'hwansoo' ? 'text-text-inverse' : 'text-text-secondary hover:text-text-primary'
                       }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            환수강림
          </button>
          <button
            onClick={() => handleTabChange('pooyas')}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                       text-sm font-medium transition-colors duration-300 ${
                         activeTab === 'pooyas' ? 'text-text-inverse' : 'text-text-secondary hover:text-text-primary'
                       }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            뿌야
          </button>
        </div>
      </div>

      {/* 검색 바 */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="초성으로 검색하세요. 예. ㅇㅎㅎㅌ"
      />

      {/* 통계 정보 */}
      <div className="mb-6">
        <div className="bg-bg-secondary rounded-2xl p-4 border border-border">
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
                  <div className="w-24 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-300"
                      style={{ width: `${(displayedItems.length / filteredItems.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-text-secondary tabular-nums">
                    {displayedItems.length}/{filteredItems.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
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
                <div
                  key={item.id ? `item-${item.id}` : `index-${index}`}
                  onClick={activeTab === 'pooyas' ? () => handleItemClick(item) : undefined}
                  className={`group bg-bg-secondary hover:bg-bg-tertiary border border-border
                            hover:border-accent/50 rounded-2xl p-4 transition-all duration-300
                            hover:shadow-card hover:-translate-y-0.5 active:scale-[0.99] ${
                              activeTab === 'pooyas' ? 'cursor-pointer' : ''
                            }`}
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
                          <svg
                            className="h-4 w-4 text-accent group-hover:text-text-inverse transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                            flex items-center justify-center">
                <svg className="w-10 h-10 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
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
                  <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  스크롤하여 더 보기
                </div>
              )}
            </div>
          )}

          {/* 모든 아이템 로드 완료 */}
          {!hasMore && displayedItems.length > 0 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bg-secondary border border-border">
                <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-text-muted">모든 아이템을 불러왔습니다</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 강화표 모달 */}
      {showEnhanceModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowEnhanceModal(false)}
        >
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* 모달 컨텐츠 */}
          <div
            className="relative w-full max-w-2xl max-h-[80vh] bg-bg-primary rounded-2xl shadow-2xl
                       border border-border overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border
                            bg-gradient-to-r from-purple-500/10 to-pink-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500
                                flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">강화 정보</h2>
                  <p className="text-xs text-text-muted">아이템 강화 확률 및 정보</p>
                </div>
              </div>
              <button
                onClick={() => setShowEnhanceModal(false)}
                className="w-10 h-10 rounded-xl bg-bg-secondary hover:bg-bg-tertiary
                           flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {/* 무기 강화표 */}
              <div className="mb-6">
                <h3 className="text-base font-bold text-cyan-500 mb-2">+ 강화 정보</h3>

                {/* 무기 테이블 */}
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-purple-500 text-white">
                        <th className="border border-purple-400 px-2 py-1.5 text-center">대상</th>
                        <th className="border border-purple-400 px-2 py-1.5 text-center">강화 수치</th>
                        <th className="border border-purple-400 px-2 py-1.5 text-center">능력치</th>
                        <th className="border border-purple-400 px-2 py-1.5 text-center">성공률</th>
                        <th className="border border-purple-400 px-2 py-1.5 text-center">파괴 유무</th>
                        <th className="border border-purple-400 px-2 py-1.5 text-center">필요개수</th>
                        <th className="border border-purple-400 px-2 py-1.5 text-center">수급처</th>
                      </tr>
                    </thead>
                    <tbody className="bg-bg-secondary">
                      {/* 무기 데이터 */}
                      {[
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
                      ].map((row, idx) => (
                        <tr key={`weapon-${idx}`} className={idx % 2 === 0 ? 'bg-bg-primary' : 'bg-bg-secondary'}>
                          {idx === 0 && (
                            <td rowSpan={10} className="border border-border px-2 py-1.5 text-center font-medium text-text-primary">
                              무기
                            </td>
                          )}
                          <td className={`border border-border px-2 py-1.5 text-center ${row.highlight ? 'text-red-500 font-medium' : 'text-text-primary'}`}>
                            {row.level}
                          </td>
                          <td className="border border-border px-2 py-1.5 text-center text-text-secondary">{row.stat}</td>
                          <td className="border border-border px-2 py-1.5 text-center text-text-secondary">{row.rate}</td>
                          <td className={`border border-border px-2 py-1.5 text-center font-medium ${row.destroy ? 'text-yellow-500' : 'text-cyan-500'}`}>
                            {row.destroy ? 'Y' : 'N'}
                          </td>
                          <td className="border border-border px-2 py-1.5 text-center text-red-500">{row.count}</td>
                          {idx === 0 && (
                            <td rowSpan={20} className="border border-border px-2 py-1.5 text-center text-red-500">
                              스톤 상점
                            </td>
                          )}
                        </tr>
                      ))}

                      {/* 방어구 데이터 */}
                      {[
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
                      ].map((row, idx) => (
                        <tr key={`armor-${idx}`} className={idx % 2 === 0 ? 'bg-bg-primary' : 'bg-bg-secondary'}>
                          {idx === 0 && (
                            <td rowSpan={10} className="border border-border px-2 py-1.5 text-center font-medium text-text-primary">
                              방어구
                            </td>
                          )}
                          <td className={`border border-border px-2 py-1.5 text-center ${row.highlight ? 'text-red-500 font-medium' : 'text-text-primary'}`}>
                            {row.level}
                          </td>
                          <td className="border border-border px-2 py-1.5 text-center text-text-secondary">{row.stat}</td>
                          <td className="border border-border px-2 py-1.5 text-center text-text-secondary">{row.rate}</td>
                          <td className={`border border-border px-2 py-1.5 text-center font-medium ${row.destroy ? 'text-yellow-500' : 'text-cyan-500'}`}>
                            {row.destroy ? 'Y' : 'N'}
                          </td>
                          <td className="border border-border px-2 py-1.5 text-center text-red-500">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemsPage;
