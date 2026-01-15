import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, AlertCircle, X, Search, Loader2, Users, PawPrint, Star } from 'lucide-react';
import SearchBar from '@/shared/components/ui/SearchBar';
import CharacterTabs from '@/features/calculator/components/CharacterTabs';
import PetDetailModal from '@/features/pets/components/PetDetailModal';
import CharacterDetailModal from '@/features/calculator/components/CharacterDetailModal';
import ShareButton from '@/shared/components/ui/ShareButton';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { matchesConsonantSearch } from '@/shared/utils/korean';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Pet } from '@/shared/types';

interface BoardingData {
  [character: string]: string[];
}

interface PetRidingData {
  [character: string]: Array<{
    imageUrl: string;
    name: string;
  }>;
}

interface Character {
  id: string;
  name: string;
  url: string;
  description: string;
  colors: string[];
  weapons: Array<{
    type: string;
    image: string | string[];
  }>;
}

const BoardingPage: React.FC = () => {
  const [boardingData, setBoardingData] = useState<BoardingData>({});
  const [petRidingData, setPetRidingData] = useState<PetRidingData>({});
  const [charactersData, setCharactersData] = useState<Character[]>([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [petData, setPetData] = useState<Pet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedPetRidingImage, setSelectedPetRidingImage] = useState<string>('');
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [selectedCharacterData, setSelectedCharacterData] = useState<Character | null>(null);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertTimeoutId, setAlertTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // 공유 모드 감지
  const isShareMode = searchParams.get('share') === 'true';
  const sharedPetName = searchParams.get('pet');

  // 탑승 데이터와 펫 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      try {
        const [boardingModule, petModule, petRidingModule, charactersModule] = await Promise.all([
          import('@/data/boarding.json'),
          import('@/data/petData.json'),
          import('@/data/pet-riding.json'),
          import('@/data/characters.json'),
        ]);
        await new Promise(resolve => setTimeout(resolve, 200));
        setBoardingData(boardingModule.default || boardingModule);
        setPetData((petModule as any).pets || petModule.default || []);
        setPetRidingData(petRidingModule.default || petRidingModule);
        setCharactersData((charactersModule as any).characters || charactersModule.default || []);
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

  // 컴포넌트 언마운트 시 timeout 정리
  useEffect(() => {
    return () => {
      if (alertTimeoutId) {
        clearTimeout(alertTimeoutId);
      }
    };
  }, [alertTimeoutId]);

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
  const handlePetClick = (petName: string, characterName: string) => {
    // ⭐️, ⭐ 둘 다 제거하고 정확한 이름으로 매칭
    const cleanBoardingName = petName.replace(/⭐️?/g, '').trim();

    const matchingPet = petData.find(pet => {
      // 정확한 이름 매칭만 수행 (띄어쓰기만 제거, (환)은 유지)
      const cleanPetDataName = pet.name.replace(/\s+/g, ''); // 띄어쓰기만 제거
      const cleanBoardingNameForCompare = cleanBoardingName.replace(/\s+/g, ''); // 띄어쓰기만 제거

      return cleanPetDataName === cleanBoardingNameForCompare;
    });

    if (matchingPet) {
      const ridingImage = findPureRidingImage(petName, characterName);
      setSelectedPet(matchingPet);
      setSelectedPetRidingImage(ridingImage);
      setIsPetModalOpen(true);
    } else {
      // 기존 timeout이 있다면 제거
      if (alertTimeoutId) {
        clearTimeout(alertTimeoutId);
      }

      // 페트 정보가 없는 경우 alert 표시
      setAlertMessage(`${cleanBoardingName}의 정보가 없습니다.`);
      setShowAlert(true);

      // 3초 후 자동으로 alert 숨기기
      const timeoutId = setTimeout(() => {
        setShowAlert(false);
        setAlertMessage('');
        setAlertTimeoutId(null);
      }, 3000);

      setAlertTimeoutId(timeoutId);
    }
  };

  const handlePetModalClose = () => {
    setIsPetModalOpen(false);
    setSelectedPet(null);
    setSelectedPetRidingImage('');
  };

  // 캐릭터명 매핑 테이블 (boarding.json과 characters.json의 이름이 다른 경우)
  const characterNameMapping: { [key: string]: string } = {
    // 현재는 매핑이 필요하지 않음 - characters.json에 직접 "울보소녀" 존재
    // 필요시 다른 매핑 추가
  };

  // 캐릭터 클릭 핸들러
  const handleCharacterClick = (characterName: string) => {
    // 별 아이콘(⭐, ⭐️) 제거하고 텍스트만 추출
    const cleanCharacterName = characterName.replace(/⭐️?/g, '').trim();
    
    // 매핑된 이름이 있으면 사용, 없으면 정제된 이름 사용
    const mappedName = characterNameMapping[cleanCharacterName] || cleanCharacterName;
    
    const characterData = charactersData.find(char => char.name === mappedName);
    if (characterData) {
      setSelectedCharacterData(characterData);
      setIsCharacterModalOpen(true);
    }
  };

  const handleCharacterModalClose = () => {
    setIsCharacterModalOpen(false);
    setSelectedCharacterData(null);
  };

  const handleAlertClose = () => {
    if (alertTimeoutId) {
      clearTimeout(alertTimeoutId);
      setAlertTimeoutId(null);
    }
    setShowAlert(false);
    setAlertMessage('');
  };

  // 바닥 페이지용: 탑승 이미지 없으면 일반 이미지 폴백
  const findPetImage = (petName: string, characterName: string): string => {
    // ⭐️, ⭐ 둘 다 제거하고 정확한 이름으로 매칭
    const cleanBoardingName = petName.replace(/⭐️?/g, '').trim();

    // 1. pet-riding.json에서 캐릭터별 탑승 이미지 찾기
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

      if (ridingPet && ridingPet.imageUrl) {
        // 로컬 이미지인 경우 base URL 추가
        if (ridingPet.imageUrl.startsWith('/')) {
          return `${import.meta.env.BASE_URL}${ridingPet.imageUrl.slice(1)}`;
        }
        return ridingPet.imageUrl;
      }
    }

    // 2. 탑승 이미지가 없으면 일반 이미지를 폴백으로 사용 (바닥 페이지용)
    const matchingPet = petData.find(pet => {
      // 정확한 매칭 시도
      const cleanPetDataName = pet.name.replace(/\s+/g, '');
      const cleanBoardingNameForCompare = cleanBoardingName.replace(/\s+/g, '');

      if (cleanPetDataName === cleanBoardingNameForCompare) {
        return true;
      }

      // (환) 제거 후 매칭
      const cleanPetDataNameNoEnv = pet.name.replace(/\s+/g, '').replace(/\(환\)/g, '');

      const cleanBoardingNameNoEnv = cleanBoardingName.replace(/\s+/g, '').replace(/\(환\)/g, '');

      return cleanPetDataNameNoEnv === cleanBoardingNameNoEnv;
    });

    return matchingPet?.imageLink || '';
  };

  // 모달용: 순수한 탑승 이미지만 반환 (일반 이미지 폴백 없음)
  const findPureRidingImage = (petName: string, characterName: string): string => {
    // ⭐️, ⭐ 둘 다 제거하고 정확한 이름으로 매칭
    const cleanBoardingName = petName.replace(/⭐️?/g, '').trim();

    // pet-riding.json에서만 탑승 이미지 찾기
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

      if (ridingPet && ridingPet.imageUrl) {
        // 로컬 이미지인 경우 base URL 추가
        if (ridingPet.imageUrl.startsWith('/')) {
          return `${import.meta.env.BASE_URL}${ridingPet.imageUrl.slice(1)}`;
        }
        return ridingPet.imageUrl;
      }
    }

    // 탑승 이미지가 없으면 빈 문자열 반환 (모달용 - 폴백 없음)
    return '';
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

  // 일반 모드로 돌아가기
  const handleBackToAllPets = () => {
    navigate('/boarding', { replace: true });
  };

  // 공유 모드에서 표시할 페트 찾기
  const sharedPet =
    isShareMode && sharedPetName
      ? petData.find(pet => {
          const cleanPetName = pet.name.replace(/\s+/g, '').replace(/\(환\)/g, '');
          const cleanSharedName = decodeURIComponent(sharedPetName)
            .replace(/\s+/g, '')
            .replace(/\(환\)/g, '');
          return cleanPetName === cleanSharedName;
        })
      : null;

  const isTyping = searchTerm !== debouncedSearchTerm;

  // 캐릭터 목록 추출
  const characters = React.useMemo(() => {
    return Object.keys(boardingData);
  }, [boardingData]);

  // 공유 모드일 때
  if (isShareMode && sharedPet) {
    const shareUrl = `${window.location.origin}/stoneage-light/boarding?pet=${encodeURIComponent(sharedPet.name)}&share=true`;

    // 탑승 데이터에서 해당 페트가 탑승 가능한 캐릭터들 찾기
    const ridingCharacters = Object.entries(boardingData)
      .filter(([, pets]) =>
        pets.some(pet => {
          const cleanBoardingName = pet
            .replace('⭐️', '')
            .trim()
            .replace(/\s+/g, '')
            .replace(/\(환\)/g, '');
          const cleanPetName = sharedPet.name.replace(/\s+/g, '').replace(/\(환\)/g, '');
          return cleanBoardingName === cleanPetName;
        })
      )
      .map(([character]) => character);

    return (
      <div className="max-w-4xl mx-auto px-4 iphone16:px-3 py-8">
        {/* 뒤로가기 버튼 */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToAllPets}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            모든 페트 보기
          </Button>
        </div>

        {/* 공유 페트 카드 */}
        <Card className="p-8">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-text-primary">{sharedPet.name}</h1>
            <ShareButton
              shareUrl={shareUrl}
              title={`${sharedPet.name} 탑승 정보 - 스톤에이지`}
              size="md"
              showText
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 페트 이미지 */}
            <div className="flex justify-center">
              <div className="relative w-48 h-48 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5
                            border border-accent/20 flex items-center justify-center overflow-hidden">
                <img
                  src={sharedPet.imageLink}
                  alt={sharedPet.name}
                  className="w-40 h-40 object-contain"
                  loading="eager"
                />
              </div>
            </div>

            {/* 페트 정보 */}
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">기본 정보</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary">등급:</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        sharedPet.grade === '영웅' && 'border-yellow-500 text-yellow-500',
                        sharedPet.grade === '희귀' && 'border-purple-500 text-purple-500',
                      )}
                    >
                      {sharedPet.grade}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-text-secondary">속성:</span>
                    <div className="ml-2 inline-flex flex-wrap gap-1">
                      {sharedPet.elementStats.earth > 0 && (
                        <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs">
                          지 {sharedPet.elementStats.earth}
                        </Badge>
                      )}
                      {sharedPet.elementStats.water > 0 && (
                        <Badge variant="outline" className="border-blue-500/50 text-blue-400 text-xs">
                          수 {sharedPet.elementStats.water}
                        </Badge>
                      )}
                      {sharedPet.elementStats.fire > 0 && (
                        <Badge variant="outline" className="border-red-500/50 text-red-400 text-xs">
                          화 {sharedPet.elementStats.fire}
                        </Badge>
                      )}
                      {sharedPet.elementStats.wind > 0 && (
                        <Badge variant="outline" className="border-amber-500/50 text-amber-400 text-xs">
                          풍 {sharedPet.elementStats.wind}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-text-secondary">획득처:</span>
                    <span className="ml-2 text-text-primary font-medium">{sharedPet.source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary">탑승:</span>
                    <Badge
                      variant={sharedPet.rideable === '탑승가능' ? 'default' : 'destructive'}
                      className={sharedPet.rideable === '탑승가능' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
                    >
                      {sharedPet.rideable}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 탑승 가능 캐릭터 */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">탑승 가능 캐릭터</h3>
                <div className="space-y-2">
                  {ridingCharacters.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {ridingCharacters.map(character => (
                        <Badge
                          key={character}
                          variant="secondary"
                          className="bg-accent/10 text-accent border-accent/30"
                        >
                          {character}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-text-secondary text-sm">탑승 불가</span>
                  )}
                </div>
              </div>

              {/* 능력치 */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">능력치</h3>
                <Card variant="glass" className="p-4 space-y-2">
                  {[
                    {
                      label: '공격력',
                      value: sharedPet.baseStats.attack,
                      growth: sharedPet.growthStats.attack,
                      color: 'text-red-400',
                    },
                    {
                      label: '방어력',
                      value: sharedPet.baseStats.defense,
                      growth: sharedPet.growthStats.defense,
                      color: 'text-blue-400',
                    },
                    {
                      label: '순발력',
                      value: sharedPet.baseStats.agility,
                      growth: sharedPet.growthStats.agility,
                      color: 'text-yellow-400',
                    },
                    {
                      label: '내구력',
                      value: sharedPet.baseStats.vitality,
                      growth: sharedPet.growthStats.vitality,
                      color: 'text-green-400',
                    },
                  ].map(({ label, value, growth, color }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-text-secondary text-sm">{label}:</span>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${color}`}>{value}</span>
                        <Badge variant="outline" className="text-xs">+{growth}</Badge>
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-text-primary font-medium">총 성장률:</span>
                      <span className="text-accent font-bold text-lg">{sharedPet.totalGrowth}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // 공유 모드이지만 페트를 찾을 수 없는 경우
  if (isShareMode && !sharedPet) {
    return (
      <div className="max-w-4xl mx-auto px-4 iphone16:px-3 py-8">
        <Card className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-bg-secondary border border-border
                        flex items-center justify-center">
            <PawPrint className="w-10 h-10 text-text-muted" />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">페트를 찾을 수 없습니다</h3>
          <p className="text-text-secondary mb-6">
            요청하신 페트가 존재하지 않거나 링크가 잘못되었습니다.
          </p>
          <Button onClick={handleBackToAllPets}>
            모든 페트 보기
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 iphone16:px-3 py-6">
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                        flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
          <p className="text-text-secondary">탑승 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 타이핑 중일 때 검색 인디케이터 표시
  if (isTyping && searchTerm.trim()) {
    return (
      <div className="max-w-6xl mx-auto px-4 iphone16:px-3 py-6">
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          placeholder="초성으로 검색하세요. 예)ㅅㄱㅁㄴ, ㅎㅂㅌ"
        />
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                        flex items-center justify-center">
            <Search className="w-8 h-8 text-accent animate-pulse" />
          </div>
          <p className="text-text-secondary">검색 중...</p>
        </div>
      </div>
    );
  }

  const filteredEntries = Object.entries(filteredData);
  const totalCharacters = filteredEntries.length;
  const totalPets = filteredEntries.reduce((sum, [, pets]) => sum + pets.length, 0);

  if (filteredEntries.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 iphone16:px-3 py-6">
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          placeholder="초성으로 검색하세요. 예)ㅅㄱㅁㄴ, ㅎㅂㅌ"
        />
        <Card className="text-center py-16 mt-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-bg-secondary border border-border
                        flex items-center justify-center">
            <Search className="w-10 h-10 text-text-muted" />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">
            검색 결과가 없습니다
          </h3>
          <p className="text-text-secondary">
            {debouncedSearchTerm
              ? `"${debouncedSearchTerm}"에 해당하는 캐릭터나 펫이 없습니다.`
              : '다른 검색어를 입력해보세요.'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 iphone16:px-3 py-6">
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          placeholder="초성으로 검색하세요. 예)ㅅㄱㅁㄴ, ㅎㅂㅌ"
        />
      </div>

      <CharacterTabs
        characters={characters}
        selectedCharacter={selectedCharacter}
        onCharacterSelect={handleCharacterSelect}
      />

      <div className="max-w-6xl mx-auto px-4 iphone16:px-3 pb-20">
        {/* 통계 정보 */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <span className="text-text-primary font-bold">{totalCharacters}</span>
                <span className="text-text-secondary text-sm">캐릭터</span>
              </div>
              <div className="flex items-center gap-2">
                <PawPrint className="w-4 h-4 text-accent" />
                <span className="text-text-primary font-bold">{totalPets}</span>
                <span className="text-text-secondary text-sm">페트</span>
              </div>
            </div>
            <Badge variant="outline" className="gap-1.5 iphone16:hidden">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              특정 캐릭터만 탑승 가능
            </Badge>
          </div>
        </Card>

        <div className="space-y-6 iphone16:space-y-4">
          {filteredEntries.map(([character, pets]) => (
            <Card
              key={character}
              className="p-6 iphone16:p-4"
            >
              <div className="flex items-center justify-between mb-4 iphone16:mb-3">
                <button
                  className="flex items-center gap-2 group"
                  onClick={() => handleCharacterClick(character)}
                >
                  <h2 className="text-xl font-bold text-text-primary iphone16:text-lg
                               group-hover:text-accent transition-colors duration-200">
                    {character}
                  </h2>
                  <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
                </button>
                <Badge variant="secondary" className="bg-accent/10 text-accent">
                  {pets.length}개
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 iphone16:gap-3">
                {pets.map((pet, index) => {
                  const petImage = findPetImage(pet, character);
                  const isSpecial = pet.startsWith('⭐️');
                  return (
                    <Card
                      key={`${character}-${pet}-${index}`}
                      variant="glass"
                      className={cn(
                        "p-4 iphone16:p-3 cursor-pointer transition-all duration-300",
                        "hover:border-accent/50 hover:shadow-card hover:-translate-y-0.5",
                        isSpecial && "border-yellow-500/30 bg-yellow-500/5"
                      )}
                      onClick={() => handlePetClick(pet, character)}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-3 iphone16:mb-2 relative">
                          {isSpecial && (
                            <div className="absolute -top-1 -right-1 z-10">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            </div>
                          )}
                          {petImage ? (
                            <img
                              src={petImage}
                              alt={pet}
                              className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 iphone16:w-20 iphone16:h-20 object-contain rounded-lg"
                              loading="lazy"
                              onError={e => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36 iphone16:w-20 iphone16:h-20
                                          bg-bg-tertiary rounded-lg flex items-center justify-center">
                              <PawPrint className="w-8 h-8 text-text-muted" />
                            </div>
                          )}
                        </div>
                        <span className="text-text-primary text-sm font-medium iphone16:text-xs break-words line-clamp-2">
                          {isSpecial ? pet.replace('⭐️', '') : pet}
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 페트 상세 모달 */}
      <PetDetailModal
        isOpen={isPetModalOpen}
        onClose={handlePetModalClose}
        pet={selectedPet}
        ridingImageUrl={selectedPetRidingImage}
      />

      {/* 캐릭터 상세 모달 */}
      <CharacterDetailModal
        isOpen={isCharacterModalOpen}
        onClose={handleCharacterModalClose}
        character={selectedCharacterData}
      />

      {/* 디자인 Alert */}
      {showAlert && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-2 duration-300">
          <Card
            variant="glass"
            className="flex items-center gap-3 px-4 py-3 bg-red-500/90 border-red-400/50 shadow-lg"
          >
            <AlertCircle className="w-5 h-5 text-white flex-shrink-0" />
            <span className="font-medium text-white">{alertMessage}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAlertClose}
              className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </Card>
        </div>
      )}
    </>
  );
};

export default BoardingPage;
