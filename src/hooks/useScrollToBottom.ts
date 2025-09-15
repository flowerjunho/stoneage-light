import { useEffect, useCallback, useRef } from 'react';

interface UseScrollToBottomProps {
  onBottom: () => void;
  threshold?: number; // 하단에서 얼마나 떨어져 있을 때 트리거할지 (px)
  enabled?: boolean;
}

export function useScrollToBottom({
  onBottom,
  threshold = 300,
  enabled = true
}: UseScrollToBottomProps) {
  const timeoutRef = useRef<number | undefined>(undefined);

  const handleScroll = useCallback(() => {
    if (!enabled) return;

    // 쓰로틀링: 100ms마다 한 번씩만 체크
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      const scrollTop = Math.max(
        window.pageYOffset,
        document.documentElement.scrollTop,
        document.body.scrollTop
      );
      
      const scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      
      const clientHeight = window.innerHeight;

      const scrolledToBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - threshold;

      if (scrolledToBottom) {
        onBottom();
      }
    }, 100);
  }, [onBottom, threshold, enabled]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleScroll, enabled]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}