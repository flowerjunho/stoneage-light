import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Map, X, ZoomIn, ZoomOut, RotateCcw, AlertCircle, Loader2, Info } from 'lucide-react';
import mapsData from '@/data/pooyasMaps.json';
import '@/styles/quest-content.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
      <div className="max-w-4xl mx-auto px-4 py-6 iphone16:px-3">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                        flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
          <p className="text-text-secondary">지도 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!map) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 iphone16:px-3">
        <div className="text-center py-16 animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                        flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-text-muted" />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">
            지도를 찾을 수 없습니다
          </h3>
          <p className="text-text-secondary mb-6">
            요청하신 지도가 존재하지 않습니다
          </p>
          <Button onClick={handleGoBack} className="shadow-glow">
            <Map className="w-4 h-4 mr-2" />
            지도 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 iphone16:px-3">
      {/* 헤더 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="mb-4 gap-2 text-text-secondary hover:text-accent group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          지도 목록
        </Button>

        <Badge variant="outline" className="mb-3 text-xs bg-accent/5 text-accent border-accent/20">
          {map.category}
        </Badge>

        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
          {map.title}
        </h1>
      </div>

      {/* 컨텐츠 */}
      <Card className="overflow-hidden">
        <div className="p-6">
          {renderHtmlContent(map.content)}
        </div>
      </Card>

      {/* 푸터 정보 */}
      <div className="mt-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Info className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-base font-semibold text-text-primary">도움말</h3>
          </div>
          <div className="space-y-2.5 text-sm text-text-secondary">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>지도 이미지를 클릭하면 확대해서 볼 수 있습니다</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
              <span>지도 정보는 뿌야의 스톤에이지에서 제공됩니다</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 이미지 확대 모달 */}
      {modalImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in"
          onClick={closeModal}
        >
          <Card
            className="max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-lg font-bold text-text-primary">
                {map?.title}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeModal}
                className="h-8 w-8"
                aria-label="모달 닫기"
              >
                <X className="h-4 w-4" />
              </Button>
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                  className="h-10 w-10 shadow-lg"
                  aria-label="확대"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomReset}
                  disabled={zoomLevel === 1}
                  className="h-10 w-10 shadow-lg"
                  aria-label="원래 크기"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                  className="h-10 w-10 shadow-lg"
                  aria-label="축소"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Badge variant="secondary" className="text-xs justify-center">
                  {Math.round(zoomLevel * 100)}%
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MapDetailPage;
