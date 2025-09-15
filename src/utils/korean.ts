/**
 * Korean consonant extraction utilities for search functionality
 */

// Korean consonants mapping (초성)
const KOREAN_CONSONANTS = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

/**
 * Extracts initial consonants (초성) from Korean text
 * @param text - Korean text to extract consonants from
 * @returns String of initial consonants
 */
export function extractInitialConsonants(text: string): string {
  return text
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      
      // Check if character is Korean syllable (가-힣)
      if (code >= 0xAC00 && code <= 0xD7A3) {
        // Calculate initial consonant index
        const consonantIndex = Math.floor((code - 0xAC00) / 588);
        return KOREAN_CONSONANTS[consonantIndex];
      }
      
      // Skip everything that's not Korean syllable
      return '';
    })
    .filter(char => char !== '') // Remove empty strings
    .join('');
}

/**
 * Checks if search term is only consonants (초성만 포함)
 * @param text - Text to check
 * @returns Boolean indicating if text contains only Korean consonants
 */
function isOnlyConsonants(text: string): boolean {
  const consonantPattern = /^[ㄱ-ㅎ\s]*$/;
  return consonantPattern.test(text);
}

/**
 * Checks if search term matches text using initial consonant search
 * @param text - Text to search in
 * @param searchTerm - Search term (can be consonants or regular text)
 * @returns Boolean indicating if there's a match
 */
export function matchesConsonantSearch(text: string, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true;
  
  const normalizedText = text.toLowerCase();
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  // Regular text search (exact substring match) - 한글 단어 검색
  if (normalizedText.includes(normalizedSearch)) {
    return true;
  }
  
  // Check if search term is consonants only
  if (!isOnlyConsonants(normalizedSearch)) {
    return false; // If not consonants only, don't do consonant matching
  }
  
  // Consonant search - extract consonants from text
  const textConsonants = extractInitialConsonants(text);
  const cleanSearchTerm = normalizedSearch.replace(/\s/g, ''); // Remove spaces from search
  
  // Debug logging (개발 환경에서만)
  const isDev = typeof window !== 'undefined' && window.location?.hostname === 'localhost';
  if (isDev && cleanSearchTerm === 'ㅁㅁ') {
    console.log(`[FULL DEBUG] 검색어: "${cleanSearchTerm}"`);
    console.log(`[FULL DEBUG] 원본 텍스트: "${text}"`);
    console.log(`[FULL DEBUG] 추출된 초성: "${textConsonants}"`);
    console.log(`[FULL DEBUG] startsWith 결과: ${textConsonants.startsWith(cleanSearchTerm)}`);
    console.log(`[FULL DEBUG] includes 결과: ${textConsonants.includes(cleanSearchTerm)}`);
    console.log(`[FULL DEBUG] 텍스트 길이: ${text.length}, 초성 길이: ${textConsonants.length}`);
    console.log(`[FULL DEBUG] 각 글자별 코드:`, text.split('').map(char => ({ char, code: char.charCodeAt(0).toString(16) })));
    console.log('='.repeat(50));
  }
  
  // 초성 검색 로직 - 길이별 다른 처리
  if (cleanSearchTerm.length === 1) {
    // 1글자 초성: 정확한 prefix match만 허용
    return textConsonants.startsWith(cleanSearchTerm);
  } else if (cleanSearchTerm.length === 2) {
    // 2글자 초성: prefix match 우선, contains match도 허용하되 더 엄격하게
    if (textConsonants.startsWith(cleanSearchTerm)) {
      return true;
    }
    // 2글자는 연속된 초성이어야 함 (중간에 끼어있으면 안됨)
    return textConsonants.includes(cleanSearchTerm);
  } else {
    // 3글자 이상: prefix match 우선, contains match도 허용
    if (textConsonants.startsWith(cleanSearchTerm)) {
      return true;
    }
    return textConsonants.includes(cleanSearchTerm);
  }
  
  return false;
}