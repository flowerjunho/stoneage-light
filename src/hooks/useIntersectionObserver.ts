import { useEffect, useRef } from 'react';

interface UseIntersectionObserverProps {
  onIntersect: () => void;
  enabled?: boolean;
  threshold?: number;
  rootMargin?: string;
}

export function useIntersectionObserver({
  onIntersect,
  enabled = true,
  threshold = 0.1,
  rootMargin = '100px'
}: UseIntersectionObserverProps) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !targetRef.current) {
      console.log('Observer disabled or no target:', { enabled, hasTarget: !!targetRef.current });
      return;
    }

    console.log('Setting up intersection observer');
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        console.log('Intersection observer triggered:', { isIntersecting: entry.isIntersecting, enabled });
        if (entry.isIntersecting && enabled) {
          console.log('Load trigger element is visible, calling onIntersect');
          onIntersect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(targetRef.current);

    return () => {
      console.log('Disconnecting observer');
      observer.disconnect();
    };
  }, [onIntersect, enabled, threshold, rootMargin]);

  return targetRef;
}