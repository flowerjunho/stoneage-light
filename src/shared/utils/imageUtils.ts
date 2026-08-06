import React from 'react';

/**
 * hwansoo.top 이미지 로드 실패 시 hwansoo.vip 호스트로 전환하는 fallback 핸들러
 */
export const handleImageErrorWithFallback = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  onFinalError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void
) => {
  const img = e.currentTarget;
  if (img.src && img.src.includes('hwansoo.top') && !img.dataset.fallbackTried) {
    img.dataset.fallbackTried = 'true';
    img.style.display = '';
    img.src = img.src.replace(/hwansoo\.top/g, 'hwansoo.vip');
    return;
  }

  if (onFinalError) {
    onFinalError(e);
  } else {
    img.style.display = 'none';
  }
};
