export interface Pet {
  // 기본 정보
  id: string;
  name: string;
  source: string;
  imageLink: string;
  grade: string;
  rideable: string; // "탑승가능" | "탑승불가"
  totalGrowth: string;

  // 속성 스탯
  elementStats: {
    water: number;
    fire: number;
    wind: number;
    earth: number;
  };

  // 기본 스탯 (초기치)
  baseStats: {
    attack: number;
    defense: number;
    agility: number;
    vitality: number;
  };

  // 성장률
  growthStats: {
    attack: number;
    defense: number;
    agility: number;
    vitality: number;
  };
}

// 이전 Pet 인터페이스와 호환성을 위한 변환된 타입
export interface PetLegacy {
  // 기본 정보
  name: string;
  attack: number;
  defense: number;
  agility: number;
  vitality: number;

  // 성장률
  attackGrowth: number;
  defenseGrowth: number;
  agilityGrowth: number;
  vitalityGrowth: number;
  totalGrowth: number;

  // 속성
  earth: number;
  water: number;
  fire: number;
  wind: number;

  // 기타 정보
  rideable: boolean;
  grade: string;
  source: string;

  // 계산된 값들
  attackPlusDefense: number;
  attackPlusAgility: number;
  vitalityQuarterPlusDefense: number;
  growthCombatPower: number;
}
