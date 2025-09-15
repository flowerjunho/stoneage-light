export interface Pet {
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
