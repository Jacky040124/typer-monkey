import { useState, forwardRef } from 'react';

interface CollectionProps {
  words: string[];
}

const Collection = forwardRef<HTMLDivElement, CollectionProps>(({ words }, ref) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Sort by rarity (length descending, then alphabetically)
  // Longer words are rarer and more valuable
  const sortedWords = [...words].sort((a, b) => {
    if (b.length !== a.length) {
      return b.length - a.length; // Longer words first
    }
    return a.localeCompare(b); // Alphabetically for same length
  });

  // Categorize words by rarity based on length
  const getRarityClass = (word: string) => {
    if (word.length >= 8) return 'legendary';
    if (word.length >= 6) return 'rare';
    if (word.length >= 4) return 'uncommon';
    return 'common';
  };

  const getRarityLabel = (word: string) => {
    if (word.length >= 8) return '✦';
    if (word.length >= 6) return '◆';
    if (word.length >= 4) return '▲';
    return '•';
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
