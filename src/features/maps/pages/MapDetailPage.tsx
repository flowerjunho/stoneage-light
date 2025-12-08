import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import mapsData from '@/data/pooyasMaps.json';
import '@/styles/quest-content.css';

interface MapData {
  idx: number;
  category: string;
  title: string;
  content: string;
}

const MapDetailPage: React.FC = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [map, setMap] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // 중복 제거된 지도 데이터
  const uniqueMaps = useMemo(() => {
    const seen = new Set<string>();
    return (mapsData as MapData[]).filter(m => {
      if (seen.has(m.title)) {
        return false;
      }
      seen.add(m.title);
      return true;
    });
  }, []);

  useEffect(() => {
    const loadMap = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));

      if (mapId) {
        const mapIdx = parseInt(mapId, 10);
        const foundMap = uniqueMaps.find(m => m.idx === mapIdx);
        if (foundMap) {
          setMap(foundMap);
        }
      }

      setIsLoading(false);
    };

    loadMap();
  }, [mapId, uniqueMaps]);

  const handleGoBack = () => {
    const currentSearch = searchParams.get('search');
    const currentCategory = searchParams.get('category');
    let mapsUrl = '/maps';
    const params = new URLSearchParams();
    if (currentSearch) params.set('search', currentSearch);
    if (currentCategory) params.set('category', currentCategory);
    if (params.toString()) mapsUrl += `?${params.toString()}`;
    navigate(mapsUrl);
  };

  // 이미지 클릭 핸들러
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const imgSrc = (target as HTMLImageElement).src;
      setModalImage(imgSrc);
    }
  }, []);

  // 모달 닫기
  const closeModal = useCallback(() => {
    setModalImage(null);
    setZoomLevel(1);
  }, []);

  // 확대/축소
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  // ESC 키로 모달 닫기 및 스크롤 막기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalImage) {
        closeModal();
      }
    };

    if (modalImage) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalImage, closeModal]);

  // HTML 콘텐츠를 그대로 렌더링하는 함수
  const renderHtmlContent = (htmlContent: string) => {
    // 이미지 src에 도메인이 없을 경우 https://pooyas.com 추가
    const processedContent = htmlContent.replace(
      /(<img[^>]+src=")(?!https?:\/\/)([^"]+)(")/gi,
      '$1https://pooyas.com$2$3'
    );

    return (
      <div
        className="quest-content map-content cursor-pointer"
        dangerouslySetInnerHTML={{ __html: processedContent }}
        onClick={handleImageClick}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 iphone16:px-3">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <p className="mt-4 text-text-secondary">지도 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!map) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 iphone16:px-3">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-text-primary mb-2">
            지도를 찾을 수 없습니다
          </h3>
          <p className="text-text-secondary mb-6">
            요청하신 지도가 존재하지 않습니다
          </p>
          <button
            onClick={handleGoBack}
            className="bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200"
          >
            지도 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 iphone16:px-3">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors duration-200 group"
          >
            <svg
              className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">지도 목록</span>
          </button>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full">
            {map.category}
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
          {map.title}
        </h1>
      </div>

      {/* 컨텐츠 */}
      <div className="bg-bg-secondary rounded-xl border border-border">
        <div className="p-6">
          {renderHtmlContent(map.content)}
        </div>
      </div>

      {/* 푸터 정보 */}
      <div className="mt-8 text-center">
        <div className="bg-bg-secondary rounded-xl p-6 border border-border">
          <h3 className="text-lg font-bold text-text-primary mb-4">💡 도움말</h3>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>• 지도 이미지를 클릭하면 확대해서 볼 수 있습니다</p>
            <p>• 지도 정보는 뿌야의 스톤에이지에서 제공됩니다</p>
          </div>
        </div>
      </div>

      {/* 이미지 확대 모달 */}
      {modalImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-bg-primary rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden border-2 border-border shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-lg font-bold text-text-primary">
                {map?.title}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-bg-tertiary rounded-md transition-colors"
                aria-label="모달 닫기"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-text-secondary hover:text-text-primary"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-4 overflow-auto max-h-[calc(80vh-60px)] relative">
              <div className="flex items-center justify-center min-h-full">
                <img
                  src={modalImage}
                  alt="확대된 지도"
                  className="h-auto transition-transform duration-200"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                />
              </div>

              {/* 확대/축소 버튼 */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                  className="w-10 h-10 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg flex items-center justify-center text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  aria-label="확대"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <button
                  onClick={handleZoomReset}
                  disabled={zoomLevel === 1}
                  className="w-10 h-10 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg flex items-center justify-center text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  aria-label="원래 크기"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12h4l2-9 4 18 2-9h6" />
                  </svg>
                </button>
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                  className="w-10 h-10 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg flex items-center justify-center text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  aria-label="축소"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <div className="text-xs text-text-secondary text-center bg-bg-secondary/80 rounded px-1">
                  {Math.round(zoomLevel * 100)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapDetailPage;
