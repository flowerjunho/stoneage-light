import React from 'react';

/**
 * GitHub Pages 등 서브 경로(BASE_URL) 배포 환경에서도
 * 로컬 정적 자산(/pets/..., /images/..., /sa.jpg 등)이 404 없이 정상 로딩되도록 절대 URL을 보장하는 유틸리티
 */
export const getAssetUrl = (url?: string): string => {
  if (!url) return '';

  // 외부 HTTP/HTTPS 링크인 경우 그대로 반환
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 슬래시 제거 후 경로 정규화
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;

  // 이미 'stoneage-light' 키워드가 포함되어 있는 경우 중복 적용 방지
  if (cleanPath.startsWith('stoneage-light')) {
    return url.startsWith('/') ? url : `/${url}`;
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  return `${prefix}${cleanPath}`;
};

// 기존 getPetImageUrl 호환 유지
export const getPetImageUrl = getAssetUrl;

/**
 * 이미지 로딩 실패 시 폴백 처리 헬퍼 함수
 */
export const handleImageErrorWithFallback = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  onFail?: (target: HTMLImageElement) => void
) => {
  const target = e.currentTarget;
  if (onFail) {
    onFail(target);
  } else {
    target.style.display = 'none';
  }
};
