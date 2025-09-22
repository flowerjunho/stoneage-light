import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import ElementFilter, { type ElementFilterItem } from '../components/ElementFilter';
import GradeFilter, { type GradeType } from '../components/GradeFilter';
import StatFilter, { type StatFilterItem } from '../components/StatFilter';
import FavoriteFilter from '../components/FavoriteFilter';
import PetGrid from '../components/PetGrid';
import FloatingFilterButton from '../components/FloatingFilterButton';
import skillsData from '../data/skills.json';
import { searchMultipleFields } from '../utils/searchUtils';
import type { Pet } from '../types';

// 스킬 데이터 타입 정의
interface Skill {
  name: string;
  description: string;
  locations?: string[];
  price?: string | number;
  currency?: string;
}

interface SkillCategory {
  categoryName: string;
  skills: Skill[];
}

interface SkillsData {
  petSkills: {
    general: SkillCategory;
    special: SkillCategory;
  };
}

const PetsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // 서브탭 상태 관리 (URL 쿼리 파라미터로 관리)
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'info';
  });

  // 탭 변경 함수 - 깜빡임 방지를 위한 간단한 구조
  const handleTabChange = useCallback(
    (tab: string) => {
      if (tab === activeTab) return;

      setActiveTab(tab);
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('tab', tab);
        return newParams;
      });
    },
    [activeTab, setSearchParams]
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [pets, setPets] = useState<Pet[]>([]);
  const [elementFilters, setElementFilters] = useState<ElementFilterItem[]>([]);
  const [gradeFilters, setGradeFilters] = useState<GradeType[]>([]);
  const [statFilters, setStatFilters] = useState<StatFilterItem[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // 기술 탭 관련 상태
  const [skillSearchTerm, setSkillSearchTerm] = useState('');
  const [activeSkillCategory, setActiveSkillCategory] = useState('general');
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedMap, setSelectedMap] = useState<{ title: string; imageUrl: string } | null>(null);

  // URL 파라미터 초기화만 처리 (mount 시점에만)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && (tabParam === 'info' || tabParam === 'skills')) {
      setActiveTab(tabParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 의존성 배열을 비워서 mount 시점에만 실행

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

  const handleElementFilterChange = (filters: ElementFilterItem[]) => {
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

  // 지도 모달 핸들러
  const handleMapClick = (title: string, imageUrl: string) => {
    setSelectedMap({ title, imageUrl });
    setMapModalOpen(true);
  };

  const handleMapModalClose = () => {
    setMapModalOpen(false);
    setSelectedMap(null);
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
    if (isShareModalOpen || mapModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // ESC 키로 모달 닫기
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isShareModalOpen) {
          handleShareModalClose();
        } else if (mapModalOpen) {
          handleMapModalClose();
        }
      }
    };

    if (isShareModalOpen || mapModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isShareModalOpen, mapModalOpen, handleShareModalClose]);

  // useMemo로 탭 콘텐츠를 미리 렌더링
  const infoTabContent = useMemo(() => (
    <div>
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
      <GradeFilter
        onFilterChange={handleGradeFilterChange}
        initialFilters={gradeFilters}
      />
      <StatFilter onFilterChange={handleStatFilterChange} initialFilters={statFilters} />
      <FavoriteFilter
        onFilterChange={handleFavoriteFilterChange}
        initialValue={showFavoritesOnly}
      />

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
    </div>
  ), [
    searchTerm, 
    elementFilters, 
    gradeFilters, 
    statFilters, 
    showFavoritesOnly, 
    pets,
    handleElementFilterChange,
    handleGradeFilterChange,
    handleStatFilterChange,
    handleFavoriteFilterChange,
    handleClearAllFilters,
    handleSearchChange
  ]);

  const skillsTabContent = useMemo(() => (
    <div className="space-y-6">
      {/* 학습 지역 설명 */}
      <div className="bg-bg-secondary rounded-lg p-4 border border-border">
        <h3 className="text-sm font-medium text-text-primary mb-2">
          📍 특수 학습 지역 안내
        </h3>
        <div className="space-y-1 text-xs text-text-secondary">
          <div>
            <button
              onClick={() =>
                handleMapClick(
                  'SBC본부 지도',
                  'http://pooyas.com/stoneage_info/map/cave/sainus/sbc.gif'
                )
              }
              className="font-medium text-accent hover:text-accent/80 transition-colors cursor-pointer underline"
            >
              SBC(지도보기):
            </button>
            <span className="ml-1">쿠링의 대광산 꼭대기층 SBC본부</span>
          </div>
          <div>
            <button
              onClick={() =>
                handleMapClick(
                  'JBA본부 지도',
                  'http://pooyas.com/stoneage_info/map/cave/zaru/ratotojba.gif'
                )
              }
              className="font-medium text-accent hover:text-accent/80 transition-colors cursor-pointer underline"
            >
              JBA(지도보기):
            </button>
            <span className="ml-1">라토토의 대동굴 꼭대기층 JBA본부</span>
          </div>
        </div>
      </div>

      {/* 기술 검색 */}
      <SearchBar
        searchTerm={skillSearchTerm}
        onSearchChange={setSkillSearchTerm}
        placeholder="기술이름으로 초성검색 하세요."
      />

      {/* 기술 카테고리 탭 (서브-서브탭) */}
      <div className="border-b border-border">
        <nav className="flex">
          {Object.entries((skillsData as SkillsData).petSkills).map(
            ([categoryKey, category]) => {
              const filteredSkills = skillSearchTerm
                ? category.skills.filter((skill: Skill) =>
                    searchMultipleFields(skillSearchTerm, [skill.name])
                  )
                : category.skills;
              const count = filteredSkills.length;

              return (
                <button
                  key={categoryKey}
                  onClick={() => setActiveSkillCategory(categoryKey)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                    activeSkillCategory === categoryKey
                      ? 'border-accent text-accent'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                  }`}
                >
                  {category.categoryName}
                  {skillSearchTerm && (
                    <span className="ml-2 px-2 py-1 text-xs bg-accent/10 text-accent rounded-full">
                      {count}
                    </span>
                  )}
                </button>
              );
            }
          )}
        </nav>
      </div>

      {/* 선택된 카테고리의 기술 표시 */}
      {(() => {
        const category = (skillsData as SkillsData).petSkills[
          activeSkillCategory as keyof typeof skillsData.petSkills
        ];
        if (!category) return null;

        const filteredSkills = skillSearchTerm
          ? category.skills.filter((skill: Skill) =>
              searchMultipleFields(skillSearchTerm, [skill.name])
            )
          : category.skills;

        if (filteredSkills.length === 0) {
          return skillSearchTerm ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-text-primary mb-2">
                검색 결과가 없습니다
              </h3>
              <p className="text-text-secondary">다른 검색어를 시도해보세요</p>
            </div>
          ) : null;
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((skill: Skill, index: number) => (
              <div
                key={`${activeSkillCategory}-${index}`}
                className="bg-bg-secondary rounded-lg p-4 border border-border"
              >
                <h3 className="font-semibold text-text-primary mb-2">{skill.name}</h3>
                <p className="text-text-secondary text-sm mb-3">{skill.description}</p>

                <div className="space-y-2">
                  {skill.price && skill.currency && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-text-secondary">가격:</span>
                      <span className="text-sm font-semibold text-accent">
                        {skill.price} {skill.currency}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-medium text-text-secondary block mb-1">
                      학습 가능 지역:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {skill.locations && skill.locations.length > 0 ? (
                        skill.locations.map((location: string, locIndex: number) => (
                          <span
                            key={locIndex}
                            className="inline-block px-2 py-1 bg-bg-tertiary text-text-primary text-xs rounded border border-border"
                          >
                            {location}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-text-secondary">정보 없음</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  ), [skillSearchTerm, activeSkillCategory, handleMapClick]);

  return (
    <div className="max-w-6xl mx-auto px-4 iphone16:px-3">
      {/* 환수강림 라이트 사이트 링크 */}
      <div className="text-right px-4 py-1 space-y-1">
        <div>
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
        <div>
          <a
            href="https://discord.gg/WYdT8JqUZm"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-accent hover:text-accent/80
                     font-medium transition-all duration-200 hover:underline text-sm"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            환수강림 라이트 디스코드
          </a>
        </div>
      </div>

      {/* 서브탭 네비게이션 */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-bg-secondary rounded-lg p-1">
          <button
            onClick={() => handleTabChange('info')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'info'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            정보
          </button>
          <button
            onClick={() => handleTabChange('skills')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'skills'
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
            }`}
          >
            기술
          </button>
        </div>
      </div>

      {/* 탭 컨텐츠 영역 - useMemo로 미리 렌더링 후 display 전환 */}
      <div className="min-h-screen">
        <div 
          className={`transition-opacity duration-100 ${
            activeTab === 'info' ? 'opacity-100 block' : 'opacity-0 hidden'
          }`}
        >
          {infoTabContent}
        </div>
        <div 
          className={`transition-opacity duration-100 ${
            activeTab === 'skills' ? 'opacity-100 block' : 'opacity-0 hidden'
          }`}
        >
          {skillsTabContent}
        </div>
      </div>

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

      {/* 지도 모달 */}
      {mapModalOpen && selectedMap && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleMapModalClose}
        >
          <div
            className="bg-bg-secondary rounded-lg border border-border max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-bold text-text-primary">{selectedMap.title}</h3>
              <button
                onClick={handleMapModalClose}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 지도 이미지 */}
            <div className="p-4">
              <img
                src={selectedMap.imageUrl}
                alt={selectedMap.title}
                className="w-full h-auto max-h-[70vh] object-contain rounded"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetsPage;