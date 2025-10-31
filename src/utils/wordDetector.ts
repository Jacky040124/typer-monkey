import words from '../assets/words.json';

// Create a Set for O(1) lookup
const wordSet = new Set(words.map((word: string) => word.toLowerCase()));

/**
 * Detects valid English words from the end of a typing stream
 * Uses a sliding window approach to check trailing sequences
 */
export function detectWords(text: string): string[] {
  const detectedWords: string[] = [];
  
  // Split by word boundaries (spaces, punctuation)
  const words = text.split(/\s+/);
  
  // Check each word in the stream
  for (const word of words) {
    // Remove punctuation and convert to lowercase
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    
    // Check if it's a valid word and not empty
    if (cleanWord.length > 0 && wordSet.has(cleanWord)) {
      detectedWords.push(cleanWord);
    }
  }
  
  return detectedWords;
}

/**
 * Gets the last word from a typing stream (for real-time detection)
 */
export function getLastWord(text: string): string | null {
  // Get the last sequence of characters before a space or punctuation
  const match = text.match(/([a-zA-Z]+)\s*$/);
  if (match) {
    return match[1].toLowerCase();
  }
  return null;
}

/**
 * Checks if a word is valid English
 */
export function isValidWord(word: string): boolean {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  return cleanWord.length > 0 && wordSet.has(cleanWord);
}
