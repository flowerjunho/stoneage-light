/**
 * 즐겨찾기 관리 유틸리티 함수
 */

const FAVORITES_KEY = 'stoneage-pet-favorites';

// 이벤트 리스너들을 저장할 배열
const favoriteChangeListeners: (() => void)[] = [];

// 즐겨찾기 변경 이벤트 발생
function notifyFavoriteChange() {
  favoriteChangeListeners.forEach(listener => listener());
}

// 즐겨찾기 변경 이벤트 리스너 추가
export function addFavoriteChangeListener(listener: () => void) {
  favoriteChangeListeners.push(listener);
  
  // cleanup 함수 반환
  return () => {
    const index = favoriteChangeListeners.indexOf(listener);
    if (index > -1) {
      favoriteChangeListeners.splice(index, 1);
    }
  };
}

export interface FavoritePet {
  name: string;
  attack: number;
  defense: number;
  // 펫을 고유하게 식별하기 위한 키들
}

/**
 * 펫의 고유 ID 생성 (name + attack + defense로 구성)
 */
export function getPetId(pet: { name: string; attack: number; defense: number }): string {
  return `${pet.name}-${pet.attack}-${pet.defense}`;
}

/**
 * 로컬스토리지에서 즐겨찾기 목록 가져오기
 */
export function getFavorites(): string[] {
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Failed to load favorites:', error);
    return [];
  }
}

/**
 * 즐겨찾기에 펫 추가
 */
export function addToFavorites(pet: { name: string; attack: number; defense: number }): void {
  try {
    const favorites = getFavorites();
    const petId = getPetId(pet);
    
    if (!favorites.includes(petId)) {
      favorites.push(petId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      notifyFavoriteChange();
    }
  } catch (error) {
    console.error('Failed to add to favorites:', error);
  }
}

/**
 * 즐겨찾기에서 펫 제거
 */
export function removeFromFavorites(pet: { name: string; attack: number; defense: number }): void {
  try {
    const favorites = getFavorites();
    const petId = getPetId(pet);
    const updatedFavorites = favorites.filter(id => id !== petId);
    
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    notifyFavoriteChange();
  } catch (error) {
    console.error('Failed to remove from favorites:', error);
  }
}

/**
 * 펫이 즐겨찾기에 있는지 확인
 */
export function isFavorite(pet: { name: string; attack: number; defense: number }): boolean {
  try {
    const favorites = getFavorites();
    const petId = getPetId(pet);
    return favorites.includes(petId);
  } catch (error) {
    console.error('Failed to check favorite status:', error);
    return false;
  }
}

/**
 * 즐겨찾기 전체 삭제
 */
export function clearAllFavorites(): void {
  try {
    localStorage.removeItem(FAVORITES_KEY);
    notifyFavoriteChange();
  } catch (error) {
    console.error('Failed to clear favorites:', error);
  }
}

/**
 * 즐겨찾기 토글 (추가/제거)
 */
export function toggleFavorite(pet: { name: string; attack: number; defense: number }): boolean {
  const wasFavorite = isFavorite(pet);
  
  if (wasFavorite) {
    removeFromFavorites(pet);
  } else {
    addToFavorites(pet);
  }
  
  return !wasFavorite; // 새로운 상태 반환
}