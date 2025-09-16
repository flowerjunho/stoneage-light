import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import ElementFilter, { type ElementType } from '../components/ElementFilter';
import GradeFilter, { type GradeType } from '../components/GradeFilter';
import StatFilter, { type StatFilterItem } from '../components/StatFilter';
import FavoriteFilter from '../components/FavoriteFilter';
import PetGrid from '../components/PetGrid';
import FloatingFilterButton from '../components/FloatingFilterButton';
import type { Pet } from '../types';

const PetsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [pets, setPets] = useState<Pet[]>([]);
  const [elementFilters, setElementFilters] = useState<ElementType[]>([]);
  const [gradeFilters, setGradeFilters] = useState<GradeType[]>([]);
  const [statFilters, setStatFilters] = useState<StatFilterItem[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // 공유 모달 관련 상태
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharedPet, setSharedPet] = useState<Pet | null>(null);

  // 데이터 로딩을 비동기로 처리
  useEffect(() => {
    const loadPetsData = async () => {
      try {
        // 동적 import로 JSON 데이터 로드 (시뮬레이션)
        const module = await import('../data/petData.json');

        // 실제 로딩 느낌을 위한 최소 지연시간
        await new Promise(resolve => setTimeout(resolve, 200));

        setPets(module.pets);
      } catch {
        // Failed to load pets data
      }
    };

    loadPetsData();
  }, []);

  // URL 파라미터 체크 및 공유 모달 처리
  useEffect(() => {
    const isShareMode = searchParams.get('share') === 'true';
    const sharedPetId = searchParams.get('pet');

    if (isShareMode && sharedPetId && pets.length > 0) {
      const foundPet = pets.find(
        pet => pet.id === sharedPetId || pet.name === decodeURIComponent(sharedPetId)
      );
      if (foundPet) {
        setSharedPet(foundPet);
        setIsShareModalOpen(true);
      }
    }
  }, [searchParams, pets]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleElementFilterChange = (filters: ElementType[]) => {
    setElementFilters(filters);
  };

  const handleGradeFilterChange = (filters: GradeType[]) => {
    setGradeFilters(filters);
  };

  const handleStatFilterChange = (filters: StatFilterItem[]) => {
    setStatFilters(filters);
  };

  const handleFavoriteFilterChange = (favoritesOnly: boolean) => {
    setShowFavoritesOnly(favoritesOnly);
  };

  const handleClearAllFilters = () => {
    setElementFilters([]);
    setGradeFilters([]);
    setStatFilters([]);
  };

  // 공유 모달 닫기 핸들러
  const handleShareModalClose = useCallback(() => {
    setIsShareModalOpen(false);
    setSharedPet(null);
    // URL 파라미터 제거
    navigate('/pets', { replace: true });
  }, [navigate]);

  // 모달이 열릴 때 body 스크롤 막기 및 ESC 키 처리
  useEffect(() => {
    if (isShareModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // ESC 키로 모달 닫기
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isShareModalOpen) {
        handleShareModalClose();
      }
    };

    if (isShareModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isShareModalOpen, handleShareModalClose]);

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 iphone16:px-3">
        {/* 환수강림 라이트 사이트 링크 */}
        <div className="text-right px-4 py-1">
          <a
            href="https://www.hwansoo.top/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-accent hover:text-accent/80
                     font-medium transition-all duration-200 hover:underline text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            환수강림 라이트 사이트
          </a>
        </div>

        <SearchBar searchTerm={searchTerm} onSearchChange={handleSearchChange} />
        <ElementFilter
          onFilterChange={handleElementFilterChange}
          initialFilters={elementFilters}
          onClearAllFilters={handleClearAllFilters}
          hasFiltersActive={
            elementFilters.length > 0 ||
            gradeFilters.length > 0 ||
            statFilters.filter(f => f.enabled).length > 0
          }
        />
        <GradeFilter onFilterChange={handleGradeFilterChange} initialFilters={gradeFilters} />
        <StatFilter onFilterChange={handleStatFilterChange} initialFilters={statFilters} />
        <FavoriteFilter
          onFilterChange={handleFavoriteFilterChange}
          initialValue={showFavoritesOnly}
        />
      </div>

      <PetGrid
        pets={pets}
        searchTerm={searchTerm}
        elementFilters={elementFilters}
        gradeFilters={gradeFilters}
        statFilters={statFilters}
        showFavoritesOnly={showFavoritesOnly}
      />

      <FloatingFilterButton
        elementFilters={elementFilters}
        gradeFilters={gradeFilters}
        statFilters={statFilters}
        showFavoritesOnly={showFavoritesOnly}
        onElementFilterChange={handleElementFilterChange}
        onGradeFilterChange={handleGradeFilterChange}
        onStatFilterChange={handleStatFilterChange}
        onFavoriteFilterChange={handleFavoriteFilterChange}
      />

      {/* 공유 모달 */}
      {isShareModalOpen && sharedPet && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleShareModalClose}
        >
          <div
            className="max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* 카드와 동일한 디자인 */}
            <div className="bg-bg-secondary rounded-lg p-4 h-full border border-border-primary flex flex-col">
              {/* Top Section - Image and Info */}
              <div className="flex gap-4 mb-4 pb-3 border-b border-border">
                {/* Pet Image */}
                <div className="flex-shrink-0">
                  {sharedPet.imageLink ? (
                    <div className="w-36 h-36 bg-bg-tertiary rounded-lg overflow-hidden border border-border">
                      <img
                        src={sharedPet.imageLink}
                        alt={sharedPet.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-36 h-36 bg-bg-tertiary rounded-lg border border-border flex items-center justify-center">
                      <span className="text-text-secondary text-xs">이미지 없음</span>
                    </div>
                  )}
                </div>

                {/* Pet Info */}
                <div className="flex-1 flex flex-col justify-between text-right">
                  {/* 상단 그룹: 이름과 속성 */}
                  <div>
                    {/* Name and Close */}
                    <div className="flex items-start justify-end gap-2">
                      <h3 className="text-xl font-bold text-text-primary leading-tight text-right">
                        {sharedPet.name}
                      </h3>
                      <button
                        onClick={handleShareModalClose}
                        className="group p-0.5 rounded-md hover:bg-bg-tertiary transition-all duration-200 active:scale-95 flex-shrink-0"
                        aria-label="모달 닫기"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          className="text-text-secondary group-hover:text-text-primary transition-colors"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Elements */}
                    <div className="mt-2">
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {sharedPet.elementStats.earth > 0 && (
                          <span className="bg-green-500/10 border-green-500/30 text-green-400 text-sm px-2 py-1 rounded border">
                            地 {sharedPet.elementStats.earth}
                          </span>
                        )}
                        {sharedPet.elementStats.water > 0 && (
                          <span className="bg-blue-500/10 border-blue-500/30 text-blue-400 text-sm px-2 py-1 rounded border">
                            水 {sharedPet.elementStats.water}
                          </span>
                        )}
                        {sharedPet.elementStats.fire > 0 && (
                          <span className="bg-red-500/10 border-red-500/30 text-red-400 text-sm px-2 py-1 rounded border">
                            火 {sharedPet.elementStats.fire}
                          </span>
                        )}
                        {sharedPet.elementStats.wind > 0 && (
                          <span className="bg-amber-500/10 border-amber-500/30 text-amber-400 text-sm px-2 py-1 rounded border">
                            風 {sharedPet.elementStats.wind}
                          </span>
                        )}
                      </div>

                      {/* Element Progress Bars */}
                      <div className="mt-2 space-y-1">
                        {sharedPet.elementStats.earth > 0 && (
                          <div className="flex items-center gap-2 justify-end">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 10 }, (_, i) => (
                                <div
                                  key={`earth-${i}`}
                                  className={`h-1.5 w-2 rounded-sm ${
                                    i < sharedPet.elementStats.earth
                                      ? 'bg-green-500'
                                      : 'bg-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-green-400 w-4">地</span>
                          </div>
                        )}
                        {sharedPet.elementStats.water > 0 && (
                          <div className="flex items-center gap-2 justify-end">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 10 }, (_, i) => (
                                <div
                                  key={`water-${i}`}
                                  className={`h-1.5 w-2 rounded-sm ${
                                    i < sharedPet.elementStats.water ? 'bg-blue-500' : 'bg-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-blue-400 w-4">水</span>
                          </div>
                        )}
                        {sharedPet.elementStats.fire > 0 && (
                          <div className="flex items-center gap-2 justify-end">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 10 }, (_, i) => (
                                <div
                                  key={`fire-${i}`}
                                  className={`h-1.5 w-2 rounded-sm ${
                                    i < sharedPet.elementStats.fire ? 'bg-red-500' : 'bg-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-red-400 w-4">火</span>
                          </div>
                        )}
                        {sharedPet.elementStats.wind > 0 && (
                          <div className="flex items-center gap-2 justify-end">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 10 }, (_, i) => (
                                <div
                                  key={`wind-${i}`}
                                  className={`h-1.5 w-2 rounded-sm ${
                                    i < sharedPet.elementStats.wind ? 'bg-amber-500' : 'bg-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-amber-400 w-4">風</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Grade - 맨 밑에 위치 */}
                  <div className="flex justify-end">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-xl uppercase tracking-wide ${
                        sharedPet.grade === '영웅'
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-black'
                          : sharedPet.grade === '희귀'
                            ? 'bg-gradient-to-r from-purple-500 to-purple-400 text-white'
                            : 'bg-bg-tertiary text-text-secondary'
                      }`}
                    >
                      {sharedPet.grade}
                    </span>
                  </div>
                </div>
              </div>

              {/* Basic Stats */}
              <div className="mb-2">
                <h4 className="text-sm font-medium text-text-secondary mb-1.5">초기치</h4>
                <div className="bg-bg-tertiary rounded-md p-2 border border-border">
                  <div className="grid grid-cols-4 gap-1 text-center text-sm">
                    <div>
                      <div className="text-text-secondary text-xs mb-1">공격력</div>
                      <div className="font-bold text-text-primary font-mono">
                        {sharedPet.baseStats.attack}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs mb-1">방어력</div>
                      <div className="font-bold text-text-primary font-mono">
                        {sharedPet.baseStats.defense}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs mb-1">순발력</div>
                      <div className="font-bold text-text-primary font-mono">
                        {sharedPet.baseStats.agility}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs mb-1">내구력</div>
                      <div className="font-bold text-text-primary font-mono">
                        {sharedPet.baseStats.vitality}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Growth Stats */}
              <div className="mb-2">
                <h4 className="text-sm font-medium text-text-secondary mb-1.5">성장률</h4>
                <div className="bg-bg-primary rounded-md p-2 border border-border space-y-2">
                  <div className="grid grid-cols-4 gap-1 text-center text-sm">
                    <div>
                      <div className="text-text-secondary text-xs mb-1">공격력</div>
                      <div className="font-bold text-accent font-mono">
                        {sharedPet.growthStats.attack}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs mb-1">방어력</div>
                      <div className="font-bold text-accent font-mono">
                        {sharedPet.growthStats.defense}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs mb-1">순발력</div>
                      <div className="font-bold text-accent font-mono">
                        {sharedPet.growthStats.agility}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-secondary text-xs mb-1">내구력</div>
                      <div className="font-bold text-accent font-mono">
                        {sharedPet.growthStats.vitality}
                      </div>
                    </div>
                  </div>
                  <div className="text-center pt-1 border-t border-border bg-accent/5 rounded">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-sm text-text-secondary font-medium">총성장률</span>
                      <span className="text-base font-bold text-accent font-mono">
                        {sharedPet.totalGrowth}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="pt-1.5 border-t border-border mt-auto">
                <div className="bg-bg-tertiary rounded-md p-1.5 space-y-0.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">탑승:</span>
                    <span
                      className={`font-medium text-sm px-1.5 py-0.5 rounded ${
                        sharedPet.rideable === '탑승가능'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {sharedPet.rideable === '탑승가능' ? '가능' : '불가'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start text-sm">
                    <span className="text-text-secondary shrink-0">획득처:</span>
                    <span className="text-text-primary text-right leading-tight ml-2 text-sm">
                      {sharedPet.source}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PetsPage;
