import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface UseInfiniteScrollProps<T> {
  items: T[];
  itemsPerPage: number;
}

interface UseInfiniteScrollReturn<T> {
  displayedItems: T[];
  hasMore: boolean;
  isLoading: boolean;
  isInitialLoading: boolean;
  loadMore: () => void;
  reset: () => void;
}

export function useInfiniteScroll<T>({
  items,
  itemsPerPage
}: UseInfiniteScrollProps<T>): UseInfiniteScrollReturn<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const loadingRef = useRef(false);
  const itemsRef = useRef(items);

  // items 변경을 감지하여 리셋 (검색어 변경 시)
  useEffect(() => {
    if (items !== itemsRef.current) {
      console.log('Items changed, resetting pagination');
      itemsRef.current = items;
      setCurrentPage(1);
      setIsLoading(false);
      setIsInitialLoading(false);
      loadingRef.current = false;
      console.log('Search completed, showing results:', items.length);
    }
  }, [items]);

  // 초기 로딩 처리
  useEffect(() => {
    if (items.length > 0 && isInitialLoading) {
      // 초기 데이터 로드 시뮬레이션 (300ms)
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [items.length, isInitialLoading]);

  // 현재 표시할 아이템들을 메모이제이션
  const displayedItems = useMemo(() => {
    const result = items.slice(0, currentPage * itemsPerPage);
    console.log(`Displaying ${result.length} items (page ${currentPage}, total: ${items.length})`);
    return result;
  }, [items, currentPage, itemsPerPage]);

  // 더 보기 가능 여부를 메모이제이션
  const hasMore = useMemo(() => {
    const hasMoreItems = displayedItems.length < items.length;
    console.log(`Has more items: ${hasMoreItems} (displayed: ${displayedItems.length}, total: ${items.length})`);
    return hasMoreItems;
  }, [displayedItems.length, items.length]);

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) {
      console.log('Load more blocked:', { 
        loading: loadingRef.current, 
        hasMore,
        currentItems: displayedItems.length,
        totalItems: items.length
      });
      return;
    }
    
    console.log('Starting load more...');
    loadingRef.current = true;
    setIsLoading(true);
    
    // 실제 로딩 시뮬레이션 (100ms 딜레이)
    setTimeout(() => {
      setCurrentPage(prev => {
        const newPage = prev + 1;
        console.log(`Page updated: ${prev} → ${newPage}`);
        return newPage;
      });
      setIsLoading(false);
      loadingRef.current = false;
    }, 100);
  }, [hasMore, displayedItems.length, items.length]);

  const reset = useCallback(() => {
    console.log('Resetting pagination');
    setCurrentPage(1);
    setIsLoading(false);
    setIsInitialLoading(true);
    loadingRef.current = false;
  }, []);

  return {
    displayedItems,
    hasMore,
    isLoading,
    isInitialLoading,
    loadMore,
    reset
  };
}