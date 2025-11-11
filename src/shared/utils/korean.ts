/**
 * Korean consonant extraction utilities for search functionality
 */

// Korean consonants mapping (초성)
const KOREAN_CONSONANTS = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
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
      if (code >= 0xac00 && code <= 0xd7a3) {
        // Calculate initial consonant index
        const consonantIndex = Math.floor((code - 0xac00) / 588);
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
}
