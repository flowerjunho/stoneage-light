import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Info, Lightbulb, ExternalLink, MapPin, Search, Map } from 'lucide-react';
import SearchBar from '@/shared/components/ui/SearchBar';
import ElementFilter, { type ElementFilterItem } from '@/shared/components/filters/ElementFilter';
import GradeFilter, { type GradeType } from '@/shared/components/filters/GradeFilter';
import StatFilter, { type StatFilterItem } from '@/shared/components/filters/StatFilter';
import FavoriteFilter from '@/shared/components/filters/FavoriteFilter';
import { type SortOption } from '@/shared/components/ui/SortDropdown';
import PetGrid from '@/features/pets/components/PetGrid';
import FloatingFilterButton from '@/shared/components/filters/FloatingFilterButton';
import skillsData from '@/data/skills.json';
import { searchMultipleFields } from '@/shared/utils/searchUtils';
import type { Pet } from '@/shared/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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
  const [sortOption, setSortOption] = useState<SortOption>('default');

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
        const module = await import('@/data/petData.json');

        // 실제 로딩 느낌을 위한 최소 지연시간
        await new Promise(resolve => setTimeout(resolve, 200));

        setPets((module as any).pets || module.default || []);
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

  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort);
  };

  // 지도 모달 핸들러
  const handleMapClick = (title: string, imageUrl: string) => {
    setSelectedMap({ title, imageUrl });
    setMapModalOpen(true);
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
          setMapModalOpen(false);
          setSelectedMap(null);
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
  const infoTabContent = useMemo(
    () => (
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
        <GradeFilter onFilterChange={handleGradeFilterChange} initialFilters={gradeFilters} />
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
          sortOption={sortOption}
          onSortChange={handleSortChange}
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
    ),
    [
      searchTerm,
      elementFilters,
      gradeFilters,
      statFilters,
      showFavoritesOnly,
      sortOption,
      pets,
      handleElementFilterChange,
      handleGradeFilterChange,
      handleStatFilterChange,
      handleFavoriteFilterChange,
      handleSortChange,
      handleClearAllFilters,
      handleSearchChange,
    ]
  );

  const skillsTabContent = useMemo(
    () => (
      <div className="space-y-6">
        {/* 학습 지역 설명 */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">특수 학습 지역 안내</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl">
              <Button
                size="sm"
                onClick={() =>
                  handleMapClick(
                    'SBC본부 지도',
                    'http://pooyas.com/stoneage_info/map/cave/sainus/sbc.gif'
                  )
                }
              >
                SBC 지도보기
              </Button>
              <span className="text-text-secondary">쿠링의 대광산 꼭대기층 SBC본부</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl">
              <Button
                size="sm"
                onClick={() =>
                  handleMapClick(
                    'JBA본부 지도',
                    'http://pooyas.com/stoneage_info/map/cave/zaru/ratotojba.gif'
                  )
                }
              >
                JBA 지도보기
              </Button>
              <span className="text-text-secondary">라토토의 대동굴 꼭대기층 JBA본부</span>
            </div>
          </div>
        </Card>

        {/* 기술 검색 */}
        <SearchBar
          searchTerm={skillSearchTerm}
          onSearchChange={setSkillSearchTerm}
          placeholder="기술이름으로 초성검색 하세요."
        />

        {/* 기술 카테고리 탭 (서브-서브탭) */}
        <Card className="p-1">
          <div className="flex gap-2">
            {Object.entries((skillsData as SkillsData).petSkills).map(([categoryKey, category]) => {
              const filteredSkills = skillSearchTerm
                ? category.skills.filter((skill: Skill) =>
                    searchMultipleFields(skillSearchTerm, [skill.name])
                  )
                : category.skills;
              const count = filteredSkills.length;
              const isActive = activeSkillCategory === categoryKey;

              return (
                <Button
                  key={categoryKey}
                  variant={isActive ? 'default' : 'ghost'}
                  onClick={() => setActiveSkillCategory(categoryKey)}
                  className={cn(
                    "flex-1 gap-2",
                    isActive && "shadow-glow"
                  )}
                >
                  {category.categoryName}
                  {skillSearchTerm && (
                    <Badge
                      variant={isActive ? 'secondary' : 'outline'}
                      className={cn(
                        "text-xs",
                        isActive && "bg-white/20 text-white border-transparent"
                      )}
                    >
                      {count}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </Card>

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
              <div className="text-center py-16 animate-fade-in">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                              flex items-center justify-center">
                  <Search className="w-10 h-10 text-text-muted" />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">검색 결과가 없습니다</h3>
                <p className="text-text-secondary">다른 검색어를 시도해보세요</p>
              </div>
            ) : null;
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSkills.map((skill: Skill, index: number) => (
                <Card
                  key={`${activeSkillCategory}-${index}`}
                  className="group p-5 hover:border-accent/30 hover:shadow-card transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-bold text-text-primary group-hover:text-accent transition-colors">
                      {skill.name}
                    </h3>
                    {skill.price && skill.currency && (
                      <Badge variant="outline" className="shrink-0 bg-accent/10 text-accent border-accent/20">
                        {skill.price} {skill.currency}
                      </Badge>
                    )}
                  </div>
                  <p className="text-text-secondary text-sm mb-4 leading-relaxed">{skill.description}</p>

                  <div className="pt-3 border-t border-border">
                    <span className="text-[10px] font-medium text-text-muted uppercase tracking-wide block mb-2">
                      학습 가능 지역
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {skill.locations && skill.locations.length > 0 ? (
                        skill.locations.map((location: string, locIndex: number) => (
                          <Badge
                            key={locIndex}
                            variant="secondary"
                            className="text-xs"
                          >
                            {location}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-text-muted italic">정보 없음</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          );
        })()}
      </div>
    ),
    [skillSearchTerm, activeSkillCategory, handleMapClick]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 iphone16:px-3">
      {/* 환수강림 라이트 사이트 링크 */}
      <div className="flex flex-wrap justify-end gap-2 px-4 py-3">
        <a
          href="https://www.hwansoo.top/"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl
                   bg-bg-secondary border border-border
                   hover:border-accent/50 hover:bg-accent/5
                   transition-all duration-300 text-sm"
        >
          <ExternalLink className="w-4 h-4 text-accent transition-transform duration-300 group-hover:scale-110" />
          <span className="text-text-secondary group-hover:text-text-primary transition-colors">
            환수강림 라이트 사이트
          </span>
        </a>
        <a
          href="https://discord.gg/WYdT8JqUZm"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl
                   bg-bg-secondary border border-border
                   hover:border-[#5865F2]/50 hover:bg-[#5865F2]/5
                   transition-all duration-300 text-sm"
        >
          <svg
            className="w-4 h-4 text-[#5865F2] transition-transform duration-300 group-hover:scale-110"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          <span className="text-text-secondary group-hover:text-text-primary transition-colors">
            디스코드
          </span>
        </a>
      </div>

      {/* 서브탭 네비게이션 */}
      <div className="mb-6 px-4 md:px-0">
        <Card className="relative p-1.5">
          {/* 슬라이딩 배경 인디케이터 */}
          <div
            className="absolute top-1.5 h-[calc(100%-12px)] rounded-xl bg-accent shadow-glow
                       transition-all duration-300 ease-out-expo pointer-events-none"
            style={{
              left: activeTab === 'info' ? '6px' : 'calc(50% + 2px)',
              width: 'calc(50% - 8px)',
            }}
          />
          <Button
            variant="ghost"
            onClick={() => handleTabChange('info')}
            className={cn(
              "relative z-10 flex-1 w-1/2 gap-2 rounded-xl transition-colors duration-300",
              activeTab === 'info' ? 'text-text-inverse hover:bg-transparent' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Info className="w-4 h-4" />
            정보
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleTabChange('skills')}
            className={cn(
              "relative z-10 flex-1 w-1/2 gap-2 rounded-xl transition-colors duration-300",
              activeTab === 'skills' ? 'text-text-inverse hover:bg-transparent' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Lightbulb className="w-4 h-4" />
            기술
          </Button>
        </Card>
      </div>

      {/* 탭 컨텐츠 영역 - useMemo로 미리 렌더링 후 display 전환 */}
      <div className="min-h-screen">
        <div
          className={cn(
            "transition-opacity duration-100",
            activeTab === 'info' ? 'opacity-100 block' : 'opacity-0 hidden'
          )}
        >
          {infoTabContent}
        </div>
        <div
          className={cn(
            "transition-opacity duration-100",
            activeTab === 'skills' ? 'opacity-100 block' : 'opacity-0 hidden'
          )}
        >
          {skillsTabContent}
        </div>
      </div>

      {/* 공유 모달 */}
      <Dialog open={isShareModalOpen} onOpenChange={(open) => !open && handleShareModalClose()}>
        <DialogContent className="max-w-md">
          {sharedPet && (
            <div className="flex flex-col">
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
                    {/* Name */}
                    <h3 className="text-xl font-bold text-text-primary leading-tight text-right">
                      {sharedPet.name}
                    </h3>

                    {/* Elements */}
                    <div className="mt-2">
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {sharedPet.elementStats.earth > 0 && (
                          <Badge variant="earth">地 {sharedPet.elementStats.earth}</Badge>
                        )}
                        {sharedPet.elementStats.water > 0 && (
                          <Badge variant="water">水 {sharedPet.elementStats.water}</Badge>
                        )}
                        {sharedPet.elementStats.fire > 0 && (
                          <Badge variant="fire">火 {sharedPet.elementStats.fire}</Badge>
                        )}
                        {sharedPet.elementStats.wind > 0 && (
                          <Badge variant="wind">風 {sharedPet.elementStats.wind}</Badge>
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
                                  className={cn(
                                    "h-1.5 w-2 rounded-sm",
                                    i < sharedPet.elementStats.earth ? 'bg-green-500' : 'bg-gray-600'
                                  )}
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
                                  className={cn(
                                    "h-1.5 w-2 rounded-sm",
                                    i < sharedPet.elementStats.water ? 'bg-blue-500' : 'bg-gray-600'
                                  )}
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
                                  className={cn(
                                    "h-1.5 w-2 rounded-sm",
                                    i < sharedPet.elementStats.fire ? 'bg-red-500' : 'bg-gray-600'
                                  )}
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
                                  className={cn(
                                    "h-1.5 w-2 rounded-sm",
                                    i < sharedPet.elementStats.wind ? 'bg-amber-500' : 'bg-gray-600'
                                  )}
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
                    <Badge
                      variant={
                        sharedPet.grade === '영웅' ? 'hero' :
                        sharedPet.grade === '희귀' ? 'rare' : 'normal'
                      }
                      className="uppercase tracking-wide"
                    >
                      {sharedPet.grade}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Basic Stats */}
              <div className="mb-2">
                <h4 className="text-sm font-medium text-text-secondary mb-1.5">초기치</h4>
                <Card className="p-2">
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
                </Card>
              </div>

              {/* Growth Stats */}
              <div className="mb-2">
                <h4 className="text-sm font-medium text-text-secondary mb-1.5">성장률</h4>
                <Card className="p-2 space-y-2">
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
                </Card>
              </div>

              {/* Info Section */}
              <div className="pt-1.5 border-t border-border mt-auto">
                <Card className="p-1.5 space-y-0.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">탑승:</span>
                    <Badge
                      variant={sharedPet.rideable === '탑승가능' ? 'outline' : 'destructive'}
                      className={cn(
                        "text-sm",
                        sharedPet.rideable === '탑승가능'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      )}
                    >
                      {sharedPet.rideable === '탑승가능' ? '가능' : '불가'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-start text-sm">
                    <span className="text-text-secondary shrink-0">획득처:</span>
                    <span className="text-text-primary text-right leading-tight ml-2 text-sm">
                      {sharedPet.source}
                    </span>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 지도 모달 */}
      <Dialog open={mapModalOpen} onOpenChange={setMapModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Map className="w-5 h-5 text-accent" />
              </div>
              <DialogTitle>{selectedMap?.title}</DialogTitle>
            </div>
          </DialogHeader>
          <div className="pt-4">
            {selectedMap && (
              <img
                src={selectedMap.imageUrl}
                alt={selectedMap.title}
                className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
                loading="lazy"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PetsPage;
