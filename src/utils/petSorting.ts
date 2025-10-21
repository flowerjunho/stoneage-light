import type { Pet } from '../types';
import type { SortOption } from '../components/SortDropdown';

/**
 * 펫 ID에서 숫자를 추출하여 비교
 * ID가 최신일수록 큰 숫자로 가정
 */
const getIdNumber = (pet: Pet): number => {
  // id가 숫자로만 이루어진 경우
  const numericId = parseInt(pet.id, 10);
  if (!isNaN(numericId)) {
    return numericId;
  }

  // id가 문자열인 경우 첫 번째 숫자 추출
  const match = pet.id.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

/**
 * 펫 배열을 정렬하는 함수
 * @param pets 정렬할 펫 배열
 * @param sortOption 정렬 옵션
 * @returns 정렬된 펫 배열 (원본 배열 유지)
 */
export const sortPets = (pets: Pet[], sortOption: SortOption): Pet[] => {
  // 원본 배열을 변경하지 않기 위해 복사
  const sortedPets = [...pets];

  if (sortOption === 'default') {
    return sortedPets;
  }

  sortedPets.sort((a, b) => {
    let valueA: number;
    let valueB: number;

    // 정렬 기준에 따라 값 추출
    switch (sortOption) {
      // 초기치
      case 'attack-asc':
      case 'attack-desc':
        valueA = a.baseStats.attack;
        valueB = b.baseStats.attack;
        break;
      case 'defense-asc':
      case 'defense-desc':
        valueA = a.baseStats.defense;
        valueB = b.baseStats.defense;
        break;
      case 'agility-asc':
      case 'agility-desc':
        valueA = a.baseStats.agility;
        valueB = b.baseStats.agility;
        break;
      case 'vitality-asc':
      case 'vitality-desc':
        valueA = a.baseStats.vitality;
        valueB = b.baseStats.vitality;
        break;

      // 성장률
      case 'attackGrowth-asc':
      case 'attackGrowth-desc':
        valueA = a.growthStats.attack;
        valueB = b.growthStats.attack;
        break;
      case 'defenseGrowth-asc':
      case 'defenseGrowth-desc':
        valueA = a.growthStats.defense;
        valueB = b.growthStats.defense;
        break;
      case 'agilityGrowth-asc':
      case 'agilityGrowth-desc':
        valueA = a.growthStats.agility;
        valueB = b.growthStats.agility;
        break;
      case 'vitalityGrowth-asc':
      case 'vitalityGrowth-desc':
        valueA = a.growthStats.vitality;
        valueB = b.growthStats.vitality;
        break;
      case 'totalGrowth-asc':
      case 'totalGrowth-desc':
        valueA = parseFloat(a.totalGrowth);
        valueB = parseFloat(b.totalGrowth);
        break;

      default:
        return 0;
    }

    // 1차 정렬: 선택한 기준으로 정렬
    const isAscending = sortOption.endsWith('-asc');
    let comparison = isAscending ? valueA - valueB : valueB - valueA;

    // 2차 정렬: 값이 같으면 ID가 최신인 것(큰 숫자)을 우선
    if (comparison === 0) {
      const idA = getIdNumber(a);
      const idB = getIdNumber(b);
      comparison = idB - idA; // 최신 ID가 앞으로 (내림차순)
    }

    return comparison;
  });

  return sortedPets;
};
