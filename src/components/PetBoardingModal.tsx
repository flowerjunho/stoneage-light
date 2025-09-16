import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Pet } from '../types';

interface BoardingData {
  [character: string]: string[];
}

interface PetBoardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet | null;
}

const PetBoardingModal: React.FC<PetBoardingModalProps> = ({ isOpen, onClose, pet }) => {
  const navigate = useNavigate();
  const [boardingData, setBoardingData] = useState<BoardingData>({});
  const [isLoading, setIsLoading] = useState(true);

  // 데이터 로딩
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const boardingModule = await import('../data/boarding.json');
          setBoardingData(boardingModule.default);
        } catch (error) {
          console.error('Failed to load data:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadData();
    }
  }, [isOpen]);


  // 선택된 펫을 포함한 캐릭터들 찾기
  const charactersWithPet = useMemo(() => {
    if (!pet || !boardingData) return [];

    const petNameToSearch = pet.name;
    const result: string[] = [];

    Object.entries(boardingData).forEach(([character, pets]) => {
      const hasMatchingPet = pets.some(petName => {
        const cleanBoardingName = petName.replace('⭐️', '').trim();
        const cleanPetDataName = petNameToSearch
          .replace(/\s+/g, '')
          .replace(/\(환\)/g, '');
        const cleanBoardingNameForCompare = cleanBoardingName
          .replace(/\s+/g, '')
          .replace(/\(환\)/g, '');
        
        return cleanPetDataName === cleanBoardingNameForCompare;
      });

      if (hasMatchingPet) {
        result.push(character);
      }
    });

    return result;
  }, [pet, boardingData]);

  // 캐릭터 클릭 핸들러
  const handleCharacterClick = (character: string) => {
    // 모달 닫기
    onClose();
    
    // 스크롤을 맨 위로 즉시 이동하고 페이지 이동
    window.scrollTo({ top: 0 });
    navigate(`/boarding?character=${encodeURIComponent(character)}`);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-bg-primary rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">
            {pet?.name} 탑승 가능 캐릭터
          </h2>
          <button
            onClick={onClose}
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
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-100px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-text-secondary">로딩 중...</div>
            </div>
          ) : charactersWithPet.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-text-muted mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="text-text-primary text-lg font-semibold mb-2">
                {pet?.rideable === "탑승불가" 
                  ? `${pet?.name}은(는) 탑승이 불가능합니다.`
                  : "해당 페트를 탑승할 수 있는 캐릭터가 없습니다."
                }
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {charactersWithPet.map((character) => (
                <div
                  key={character}
                  onClick={() => handleCharacterClick(character)}
                  className="bg-bg-secondary rounded-lg p-4 text-center hover:bg-bg-tertiary transition-colors duration-200 cursor-pointer transform hover:scale-105 active:scale-95"
                >
                  <h3 className="text-lg font-semibold text-text-primary">
                    {character}
                  </h3>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetBoardingModal;