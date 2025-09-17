// 한글 초성 분리 및 검색 유틸리티

// 한글 초성 배열
const CONSONANTS = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

/**
 * 한글 문자에서 초성을 추출하는 함수
 * @param char 한글 문자
 * @returns 초성 문자 또는 원본 문자
 */
function getConsonant(char: string): string {
  const code = char.charCodeAt(0);
  
  // 한글 완성형 문자인지 확인 (가-힣)
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const consonantIndex = Math.floor((code - 0xAC00) / 588);
    return CONSONANTS[consonantIndex];
  }
  
  // 초성 자음인지 확인
  if (CONSONANTS.includes(char)) {
    return char;
  }
  
  // 한글이 아닌 경우 원본 문자 반환
  return char;
}

/**
 * 문자열에서 초성만 추출하는 함수
 * @param text 원본 텍스트
 * @returns 초성으로 변환된 텍스트
 */
export function extractConsonants(text: string): string {
  return text
    .replace(/\s+/g, '') // 띄어쓰기 제거
    .split('')
    .map(getConsonant)
    .join('');
}

/**
 * 초성 검색 함수
 * @param searchTerm 검색어 (초성 또는 일반 텍스트)
 * @param targetText 검색 대상 텍스트
 * @returns 매치 여부
 */
export function matchesConsonantSearch(searchTerm: string, targetText: string): boolean {
  if (!searchTerm || !targetText) return false;
  
  const cleanSearchTerm = searchTerm.toLowerCase().replace(/\s+/g, '');
  const cleanTargetText = targetText.toLowerCase().replace(/\s+/g, '');
  
  // 일반 텍스트 검색 (우선순위)
  if (cleanTargetText.includes(cleanSearchTerm)) {
    return true;
  }
  
  // 초성 검색
  const searchConsonants = extractConsonants(searchTerm);
  const targetConsonants = extractConsonants(targetText);
  
  return targetConsonants.includes(searchConsonants);
}

/**
 * 여러 필드에서 초성 검색하는 함수
 * @param searchTerm 검색어
 * @param fields 검색할 필드들
 * @returns 매치 여부
 */
export function searchMultipleFields(searchTerm: string, fields: (string | undefined)[]): boolean {
  return fields.some(field => 
    field && matchesConsonantSearch(searchTerm, field)
  );
}