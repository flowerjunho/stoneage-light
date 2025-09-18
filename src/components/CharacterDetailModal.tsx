import React, { useEffect } from 'react';

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

interface CharacterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character | null;
}

const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({ isOpen, onClose, character }) => {
  // 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !character) return null;

  const handleDimClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };


  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleDimClick}
    >
      <div 
        className="bg-bg-primary rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-border-primary shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <h2 className="text-xl font-bold text-text-primary">{character.name}</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors p-1 hover:bg-bg-secondary rounded-lg"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* 설명 */}
          <div className="mb-8">
            <p className="text-text-primary leading-relaxed text-base">
              {character.description}
            </p>
          </div>

          {/* 캐릭터 색상 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-text-primary mb-4">캐릭터 색상</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {character.colors.map((colorUrl, index) => (
                <div key={index} className="flex flex-col items-center">
                  <img
                    src={colorUrl}
                    alt={`${character.name} 색상 ${index + 1}`}
                    className="w-28 h-28 object-contain rounded bg-bg-tertiary p-3 border border-border-primary hover:border-accent/50 transition-colors"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 공격 액션 */}
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">공격 액션</h3>
            
            {/* 첫 번째 이미지들 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
              {character.weapons.map((weapon, index) => (
                <div key={`first-${index}`} className="flex flex-col items-center">
                  <img
                    src={Array.isArray(weapon.image) ? weapon.image[0] : weapon.image}
                    alt={weapon.type}
                    className="w-24 h-24 object-contain rounded bg-bg-tertiary p-3 border border-border-primary hover:border-accent/50 transition-colors"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="text-sm text-text-secondary mt-2">{weapon.type}</span>
                </div>
              ))}
            </div>

            {/* 두 번째 이미지들 (배열인 경우만) */}
            {character.weapons.some(weapon => Array.isArray(weapon.image) && weapon.image.length > 1) && (
              <>
                <h4 className="text-md font-medium text-text-primary mb-4">추가 액션</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {character.weapons.map((weapon, index) => 
                    Array.isArray(weapon.image) && weapon.image.length > 1 ? (
                      <div key={`second-${index}`} className="flex flex-col items-center">
                        <img
                          src={weapon.image[1]}
                          alt={`${weapon.type} 추가`}
                          className="w-24 h-24 object-contain rounded bg-bg-tertiary p-3 border border-border-primary hover:border-accent/50 transition-colors"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <span className="text-sm text-text-secondary mt-2">{weapon.type}</span>
                      </div>
                    ) : (
                      <div key={`second-empty-${index}`} className="invisible"></div>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterDetailModal;