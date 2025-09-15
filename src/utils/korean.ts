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
      
      // Return original character if not Korean syllable
      return char;
    })
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
  const normalizedSearch = searchTerm.toLowerCase();
  
  // Regular text search (exact substring match)
  if (normalizedText.includes(normalizedSearch)) {
    return true;
  }
  
  // Check if search term is consonants only
  if (!isOnlyConsonants(normalizedSearch)) {
    return false; // If not consonants only, don't do consonant matching
  }
  
  // Consonant search - extract consonants from text and check for exact match or prefix match
  const textConsonants = extractInitialConsonants(text);
  const cleanSearchTerm = normalizedSearch.replace(/\s/g, ''); // Remove spaces from search
  
  // Exact match
  if (textConsonants === cleanSearchTerm) {
    return true;
  }
  
  // Prefix match - search term should be at the beginning
  if (textConsonants.startsWith(cleanSearchTerm)) {
    return true;
  }
  
  return false;
}