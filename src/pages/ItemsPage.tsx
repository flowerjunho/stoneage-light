import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import itemsData from '../data/pooyas_items.json';

interface Item {
  id: string;
  name: string;
  imageUrl: string;
  options: string;
  materials: string;
  link: string;
}

const ItemsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [displayedItems, setDisplayedItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState<'pooyas' | 'hwansoo'>(() => {
    const tabFromUrl = searchParams.get('tab');
    return (tabFromUrl === 'pooyas' || tabFromUrl === 'hwansoo') ? tabFromUrl : 'hwansoo';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const ITEMS_PER_PAGE = 50;

  // 탭 변경 핸들러
  const handleTabChange = useCallback((tab: 'pooyas' | 'hwansoo') => {
    setActiveTab(tab);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tab);
      return newParams;
    });
  }, [setSearchParams]);

  useEffect(() => {
    // 데이터 로딩 시뮬레이션
    const loadItems = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      setAllItems(itemsData as Item[]);
      setIsLoading(false);
    };

    loadItems();
  }, []);

  // 탭에 따른 아이템 필터링
  const filteredItems = useMemo(() => {
    if (activeTab === 'pooyas') {
      return allItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.options.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.materials.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // 환수강림 탭은 아직 데이터가 없음
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
      if (activeTab !== 'pooyas' || !hasMore || isLoadingMore || displayedItems.length === 0) {
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
    <div className="max-w-6xl mx-auto px-4 py-8 iphone16:px-3">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="text-center text-text-secondary space-y-4">
          <p className="text-base md:text-lg">스톤에이지 아이템 도감</p>
          
          {/* 정보성 알림 박스 */}
          <div className="bg-bg-secondary border-l-4 border-accent rounded-r-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <div className="text-accent text-lg flex-shrink-0">📦</div>
              <div className="text-left">
                <p className="text-sm font-medium text-text-primary">
                  아이템 정보는 각 사이트의 공식 데이터입니다.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-yellow-500 text-lg flex-shrink-0">💡</div>
              <div className="text-left">
                <p className="text-sm text-text-secondary">
                  아이템을 클릭하면 원본 페이지로 이동합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 서브 탭 네비게이션 */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-bg-secondary rounded-lg p-1">
          <button
            onClick={() => handleTabChange('hwansoo')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'hwansoo'
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            환수강림
          </button>
          <button
            onClick={() => handleTabChange('pooyas')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'pooyas'
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            뿌야
          </button>
        </div>
      </div>

      {/* 검색 바 */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="아이템 검색..."
            className="w-full px-4 py-3 pl-12 bg-bg-secondary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className="mb-6">
        <div className="bg-bg-secondary rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              {activeTab === 'hwansoo' ? '환수강림' : '뿌야'} - 총 <span className="font-bold text-accent">{activeTab === 'pooyas' ? allItems.length : 0}</span>개의 아이템
            </span>
            {searchTerm && (
              <span className="text-text-secondary">
                검색 결과: <span className="font-bold text-accent">{filteredItems.length}</span>개
              </span>
            )}
          </div>
          {activeTab === 'pooyas' && displayedItems.length > 0 && (
            <div className="mt-2 text-xs text-text-muted">
              현재 표시: <span className="font-bold text-accent">{displayedItems.length}</span>개 / 전체 {filteredItems.length}개
            </div>
          )}
        </div>
      </div>

      {/* 아이템 목록 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <p className="mt-4 text-text-secondary">아이템 목록을 불러오는 중...</p>
        </div>
      ) : activeTab === 'hwansoo' ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔨</div>
          <h3 className="text-xl font-bold text-text-primary mb-2">
            환수강림 아이템 준비 중
          </h3>
          <p className="text-text-secondary">
            환수강림 아이템 데이터를 준비 중입니다
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedItems.length > 0 ? (
            displayedItems.map((item, index) => {
              return (
                <div
                  key={item.id ? `item-${item.id}` : `index-${index}`}
                  onClick={() => handleItemClick(item)}
                  className="group bg-bg-secondary hover:bg-bg-tertiary border border-border hover:border-accent rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4">
                    {/* 아이템 이미지 */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 flex items-center justify-center bg-bg-tertiary rounded-lg overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
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
                      <h3 className="text-text-primary font-medium group-hover:text-accent transition-colors duration-200 mb-2 text-base">
                        {item.name || '아이템'}
                      </h3>

                      {/* 옵션 정보 (재료/획득) */}
                      {item.options && (
                        <div className="mb-1">
                          <p className="text-sm text-text-secondary line-clamp-2">
                            {item.options}
                          </p>
                        </div>
                      )}

                      {/* 전체 텍스트 정보 */}
                      {item.materials && item.materials !== item.options && (
                        <div className="mb-1">
                          <p className="text-xs text-text-muted whitespace-pre-wrap break-words">
                            {item.materials}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 링크 아이콘 */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-accent/10 group-hover:bg-accent/20 rounded-full flex items-center justify-center transition-colors duration-200">
                        <svg
                          className="h-4 w-4 text-accent"
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
                  </div>
                </div>
              );
            })
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-text-primary mb-2">검색 결과가 없습니다</h3>
              <p className="text-text-secondary">다른 키워드로 검색해보세요</p>
            </div>
          ) : null}

          {/* 로딩 상태 */}
          {activeTab === 'pooyas' && hasMore && displayedItems.length > 0 && (
            <div className="text-center py-6">
              {isLoadingMore ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                  <p className="text-sm text-text-secondary">더 많은 아이템을 불러오는 중...</p>
                </div>
              ) : (
                <p className="text-sm text-text-muted">스크롤하여 더 많은 아이템 보기</p>
              )}
            </div>
          )}

          {/* 모든 아이템 로드 완료 */}
          {activeTab === 'pooyas' && !hasMore && displayedItems.length > 0 && (
            <div className="text-center py-6">
              <p className="text-sm text-text-muted">모든 아이템을 불러왔습니다</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default ItemsPage;