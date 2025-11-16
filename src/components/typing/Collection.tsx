import { useState, forwardRef } from 'react';
import type { CollectionProps } from '@/models/typing';

// CONST 
const RARITY_THRESHOLDS = {
  legendary: 8,
  rare: 6,
  uncommon: 4,
  common: 0,
};


const Collection = forwardRef<HTMLDivElement, CollectionProps>(({ words }, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Sort by rarity (length descending, then alphabetically)
  const sortedWords = [...words].sort((a, b) => {
    if (b.length !== a.length) {
      return b.length - a.length; // Longer words first
    }
    return a.localeCompare(b); // Alphabetically for same length
  });

  // Categorize words by rarity based on length
  const getRarityClass = (word: string) => {
    return Object.entries(RARITY_THRESHOLDS).find(([_, threshold]) => word.length >= threshold)?.[0] || 'common';
  };

  const getRarityLabel = (word: string) => {
    return Object.entries(RARITY_THRESHOLDS).find(([_, threshold]) => word.length >= threshold)?.[0] || 'common';
  };

  return (
    <div 
      ref={ref}
      className={`collection-hover ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="collection-trigger">
        Collection
      </div>
      {isHovered && (
        <div className="collection-panel">
          <h3>Collection</h3>
          <div className="collection-list">
            {sortedWords.length === 0 ? (
              <p className="empty-message">No words collected yet</p>
            ) : (
              <ul>
                {sortedWords.map((word, index) => (
                  <li key={`${word}-${index}`} className={`word-item ${getRarityClass(word)}`}>
                    <span className="rarity-badge">{getRarityLabel(word)}</span>
                    <span className="word-text">{word}</span>
                    <span className="word-length">{word.length}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

Collection.displayName = 'Collection';

export default Collection;
