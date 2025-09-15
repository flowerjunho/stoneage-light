import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import ElementFilter, { type ElementType } from '../components/ElementFilter';
import StatFilter, { type StatFilterItem } from '../components/StatFilter';
import PetGrid from '../components/PetGrid';
import FloatingFilterButton from '../components/FloatingFilterButton';
import type { Pet } from '../types';

const PetsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pets, setPets] = useState<Pet[]>([]);
  const [elementFilters, setElementFilters] = useState<ElementType[]>([]);
  const [statFilters, setStatFilters] = useState<StatFilterItem[]>([]);

  // 데이터 로딩을 비동기로 처리
  useEffect(() => {
    const loadPetsData = async () => {
      try {
        // 동적 import로 JSON 데이터 로드 (시뮬레이션)
        const module = await import('../data/pets.json');
        
        // 실제 로딩 느낌을 위한 최소 지연시간
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setPets(module.default);
      } catch (error) {
        // Failed to load pets data
      }
    };

    loadPetsData();
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleElementFilterChange = (filters: ElementType[]) => {
    setElementFilters(filters);
  };

  const handleStatFilterChange = (filters: StatFilterItem[]) => {
    setStatFilters(filters);
  };

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            환수강림 라이트 사이트
          </a>
        </div>
        
        <SearchBar 
          searchTerm={searchTerm} 
          onSearchChange={handleSearchChange} 
        />
        <ElementFilter 
          onFilterChange={handleElementFilterChange}
          initialFilters={elementFilters}
        />
        <StatFilter 
          onFilterChange={handleStatFilterChange}
          initialFilters={statFilters}
        />
      </div>
      
      <PetGrid 
        pets={pets} 
        searchTerm={searchTerm} 
        elementFilters={elementFilters}
        statFilters={statFilters}
      />
      
      <FloatingFilterButton
        elementFilters={elementFilters}
        statFilters={statFilters}
        onElementFilterChange={handleElementFilterChange}
        onStatFilterChange={handleStatFilterChange}
      />
    </>
  );
};

export default PetsPage;