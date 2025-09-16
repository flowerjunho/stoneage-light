import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import CharacterTabs from '../components/CharacterTabs';
import PetDetailModal from '../components/PetDetailModal';
import { useDebounce } from '../hooks/useDebounce';
import { matchesConsonantSearch } from '../utils/korean';
import type { Pet } from '../types';

interface BoardingData {
  [character: string]: string[];
}

interface PetRidingData {
  [character: string]: Array<{
    imageUrl: string;
    name: string;
  }>;
}

const BoardingPage: React.FC = () => {
  const [boardingData, setBoardingData] = useState<BoardingData>({});
  const [petRidingData, setPetRidingData] = useState<PetRidingData>({});
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [petData, setPetData] = useState<Pet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);

  // 탑승 데이터와 펫 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      try {
        const [boardingModule, petModule, petRidingModule] = await Promise.all([
          import('../data/boarding.json'),
          import('../data/petData.json'),
          import('../data/pet-riding.json'),
        ]);
        await new Promise(resolve => setTimeout(resolve, 200));
        setBoardingData(boardingModule.default);
        setPetData(petModule.pets);
        setPetRidingData(petRidingModule.default);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // URL 파라미터에서 캐릭터 선택 상태 업데이트
  useEffect(() => {
    const characterParam = searchParams.get('character');
    if (characterParam) {
      setSelectedCharacter(decodeURIComponent(characterParam));
    }
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleCharacterSelect = (character: string | null) => {
    setSelectedCharacter(character);
    // URL 파라미터 업데이트
    const newSearchParams = new URLSearchParams(searchParams);
    if (character) {
      newSearchParams.set('character', encodeURIComponent(character));
    } else {
      newSearchParams.delete('character');
    }
    navigate(`/boarding?${newSearchParams.toString()}`, { replace: true });
  };

  // 페트 클릭 핸들러
  const handlePetClick = (petName: string) => {
    // ⭐️ 제거하고 정확한 이름으로 매칭
    const cleanBoardingName = petName.replace('⭐️', '').trim();

    const matchingPet = petData.find(pet => {
      // petData의 펫 이름에서 띄어쓰기와 (환) 제거
      const cleanPetDataName = pet.name
        .replace(/\s+/g, '') // 모든 띄어쓰기 제거
        .replace(/\(환\)/g, ''); // (환) 제거

      // boarding 데이터의 펫 이름에서도 띄어쓰기와 (환) 제거
      const cleanBoardingNameForCompare = cleanBoardingName
        .replace(/\s+/g, '') // 모든 띄어쓰기 제거
        .replace(/\(환\)/g, ''); // (환) 제거

      return cleanPetDataName === cleanBoardingNameForCompare;
    });

    if (matchingPet) {
      setSelectedPet(matchingPet);
      setIsPetModalOpen(true);
    }
  };

  const handlePetModalClose = () => {
    setIsPetModalOpen(false);
    setSelectedPet(null);
  };

  // 펫 이름으로 이미지 찾기 함수 (pet-riding.json 우선 사용)
  const findPetImage = (petName: string, characterName: string): string => {
    // ⭐️ 제거하고 정확한 이름으로 매칭
    const cleanBoardingName = petName.replace('⭐️', '').trim();

    // 1. pet-riding.json에서 캐릭터별 데이터 확인
    const characterRidingPets = petRidingData[characterName];
    if (characterRidingPets) {
      const ridingPet = characterRidingPets.find(pet => {
        const cleanRidingName = pet.name
          .replace(/\s+/g, '') // 모든 띄어쓰기 제거
          .replace(/\(환\)/g, ''); // (환) 제거

        const cleanBoardingNameForCompare = cleanBoardingName
          .replace(/\s+/g, '') // 모든 띄어쓰기 제거
          .replace(/\(환\)/g, ''); // (환) 제거

        return cleanRidingName === cleanBoardingNameForCompare;
      });

      if (ridingPet) {
        return ridingPet.imageUrl;
      }
    }

    // 2. pet-riding.json에서 찾지 못한 경우 기존 petData.json에서 찾기 (폴백)
    const matchingPet = petData.find(pet => {
      // petData의 펫 이름에서 띄어쓰기와 (환) 제거
      const cleanPetDataName = pet.name
        .replace(/\s+/g, '') // 모든 띄어쓰기 제거
        .replace(/\(환\)/g, ''); // (환) 제거

      // boarding 데이터의 펫 이름에서도 띄어쓰기와 (환) 제거
      const cleanBoardingNameForCompare = cleanBoardingName
        .replace(/\s+/g, '') // 모든 띄어쓰기 제거
        .replace(/\(환\)/g, ''); // (환) 제거

      return cleanPetDataName === cleanBoardingNameForCompare;
    });

    return matchingPet?.imageLink || '';
  };

  // 검색 및 캐릭터 필터링
  const filteredData = React.useMemo(() => {
    let result: BoardingData = {};

    // 캐릭터 선택 필터링
    if (selectedCharacter) {
      if (boardingData[selectedCharacter]) {
        result[selectedCharacter] = boardingData[selectedCharacter];
      }
    } else {
      result = { ...boardingData };
    }

    // 검색 필터링 - 캐릭터명과 펫명 검색 완전 분리
    if (debouncedSearchTerm) {
      const searchResult: BoardingData = {};

      Object.entries(result).forEach(([character, pets]) => {
        // 1. 캐릭터명 검색 - 매칭시 해당 캐릭터만 표시 (펫은 필터링하지 않음)
        const characterMatches = matchesConsonantSearch(character, debouncedSearchTerm);

        // 2. 펫명 검색 - 매칭되는 펫들만 필터링
        const matchingPets = pets.filter(pet => matchesConsonantSearch(pet, debouncedSearchTerm));

        // 디버그 로그 (개발 환경에서만)
        const isDev = typeof window !== 'undefined' && window.location?.hostname === 'localhost';
        if (isDev && debouncedSearchTerm === 'ㅁㅁ') {
          if (characterMatches || matchingPets.length > 0) {
            console.log(
              `[BOARDING DEBUG] 캐릭터: "${character}" | 캐릭터 매칭: ${characterMatches} | 펫 매칭 수: ${matchingPets.length}`
            );
            if (matchingPets.length > 0) {
              console.log(`[BOARDING DEBUG] 매칭된 펫들:`, matchingPets);
            }
          }
        }

        // 3. 결과 결정
        if (characterMatches) {
          // 캐릭터명이 매칭되면 모든 펫 표시
          searchResult[character] = pets;
        } else if (matchingPets.length > 0) {
          // 펫명이 매칭되면 해당 펫들만 표시
          searchResult[character] = matchingPets;
        }
        // 둘 다 매칭 안되면 해당 캐릭터는 결과에서 제외
      });

      result = searchResult;
    }

    return result;
  }, [boardingData, debouncedSearchTerm, selectedCharacter]);

  const isTyping = searchTerm !== debouncedSearchTerm;

  // 캐릭터 목록 추출
  const characters = React.useMemo(() => {
    return Object.keys(boardingData);
  }, [boardingData]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 iphone16:px-3">
        <div className="mb-6 px-2 iphone16:mb-4">
          <div className="h-5 bg-bg-tertiary rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={`skeleton-${index}`} className="bg-bg-secondary rounded-lg p-6 iphone16:p-4">
              <div className="h-6 bg-bg-tertiary rounded w-24 mb-4 animate-pulse"></div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 iphone16:gap-3">
                {Array.from({ length: 8 }, (_, petIndex) => (
                  <div
                    key={`pet-skeleton-${petIndex}`}
                    className="bg-bg-primary rounded-lg p-4 iphone16:p-3 border border-border-primary"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 iphone16:w-20 iphone16:h-20 bg-bg-tertiary rounded animate-pulse mb-3 iphone16:mb-2"></div>
                      <div className="h-4 bg-bg-tertiary rounded w-16 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 타이핑 중일 때 검색 인디케이터 표시
  if (isTyping && searchTerm.trim()) {
    return (
      <div className="max-w-6xl mx-auto px-4 iphone16:px-3">
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          placeholder="Search characters and pets..."
        />
        <div className="mb-6 px-2 iphone16:mb-4">
          <span className="text-text-secondary text-sm font-medium">Searching...</span>
        </div>
        <div className="flex justify-center items-center min-h-80 p-8 iphone16:min-h-48 iphone16:p-6">
          <div className="text-center text-text-secondary">
            <div className="w-16 h-16 mx-auto mb-4 iphone16:w-12 iphone16:h-12">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full animate-spin"
              >
                <path
                  d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.3"
                />
                <path
                  d="M21 21L16.514 16.506"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-base text-text-secondary iphone16:text-sm animate-pulse">
              Searching for characters and pets...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const filteredEntries = Object.entries(filteredData);
  const totalCharacters = filteredEntries.length;
  const totalPets = filteredEntries.reduce((sum, [, pets]) => sum + pets.length, 0);

  if (filteredEntries.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 iphone16:px-3">
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          placeholder="Search characters and pets..."
        />
        <div className="mb-6 px-2 iphone16:mb-4">
          <span className="text-text-secondary text-sm font-medium">0 characters found</span>
        </div>
        <div className="flex justify-center items-center min-h-80 p-8 iphone16:min-h-48 iphone16:p-6">
          <div className="text-center text-text-muted">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-text-muted iphone16:w-12 iphone16:h-12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3 className="text-xl mb-2 text-text-secondary iphone16:text-lg">
              No characters found
            </h3>
            <p className="text-base m-0 iphone16:text-sm">
              {debouncedSearchTerm
                ? `No characters or pets match "${debouncedSearchTerm}". Try different search terms.`
                : 'Try adjusting your search terms'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 iphone16:px-3">
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          placeholder="Search characters and pets..."
        />
      </div>

      <CharacterTabs
        characters={characters}
        selectedCharacter={selectedCharacter}
        onCharacterSelect={handleCharacterSelect}
      />

      <div className="max-w-6xl mx-auto px-4 iphone16:px-3">
        <div className="mb-6 px-2 iphone16:mb-4 flex justify-between items-center">
          <span className="text-text-secondary text-sm font-medium">
            {totalCharacters} characters, {totalPets} pets shown
          </span>
          <span className="text-text-secondary text-xs font-medium iphone16:hidden">
            ⭐ 특정 캐릭터만 탑승 가능
          </span>
        </div>

        <div className="space-y-6 mb-8 iphone16:space-y-4 iphone16:mb-6">
          {filteredEntries.map(([character, pets]) => (
            <div
              key={character}
              className="bg-bg-secondary rounded-lg p-6 iphone16:p-4 border border-border-primary"
            >
              <div className="flex items-center justify-between mb-4 iphone16:mb-3">
                <h2 className="text-xl font-bold text-text-primary iphone16:text-lg">
                  {character}
                </h2>
                <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium iphone16:text-xs iphone16:px-2">
                  {pets.length}개
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 iphone16:gap-3">
                {pets.map((pet, index) => {
                  const petImage = findPetImage(pet, character);
                  return (
                    <div
                      key={`${character}-${pet}-${index}`}
                      className="bg-bg-primary rounded-lg p-4 border border-border-primary hover:border-accent/30 transition-colors iphone16:p-3 cursor-pointer hover:bg-bg-secondary"
                      onClick={() => handlePetClick(pet)}
                    >
                      <div className="flex flex-col items-center text-center">
                        {petImage && (
                          <div className="mb-3 iphone16:mb-2">
                            <img
                              src={petImage}
                              alt={pet}
                              className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 iphone16:w-20 iphone16:h-20 object-contain rounded"
                              loading="lazy"
                              onError={e => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <span className="text-text-primary text-sm font-medium iphone16:text-xs break-words">
                          {pet.startsWith('⭐️') ? (
                            <>
                              <span className="text-yellow-400 mr-1">⭐️</span>
                              {pet.replace('⭐️', '')}
                            </>
                          ) : (
                            pet
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 페트 상세 모달 */}
      <PetDetailModal isOpen={isPetModalOpen} onClose={handlePetModalClose} pet={selectedPet} />
    </>
  );
};

export default BoardingPage;
