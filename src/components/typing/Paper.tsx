import { forwardRef } from 'react';
import type { HighlightedRange } from '@/models/typing';

export interface PaperProps {
  lines: string[][];
  pageStart: number;
  charsPerLine: number;
  typingStreamLength: number;
  isTyping: boolean;
  isPageFlipping: boolean;
  highlightedRanges: HighlightedRange[];
}

const Paper = forwardRef<HTMLDivElement, PaperProps>(
  ({ lines, pageStart, charsPerLine, typingStreamLength, isTyping, isPageFlipping, highlightedRanges }, ref) => {
    return (
      <div className="content">
        <div className="paper-container">
          <div className={`paper ${isPageFlipping ? 'flipping' : ''}`} ref={ref}>
            {lines.map((line, lineIndex) => (
              <div key={lineIndex} className="paper-line">
                {line.map((char, charIndex) => {
                  const globalIndex = pageStart + lineIndex * charsPerLine + charIndex;
                  const isActive = globalIndex === typingStreamLength && isTyping;
                  const isHighlighted = highlightedRanges.some(
                    (range) => globalIndex >= range.start && globalIndex < range.end
                  );
                  return (
                    <span
                      key={charIndex}
                      className={`paper-block ${isActive ? 'active' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                    >
                      {char || '\u00A0'}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

Paper.displayName = 'Paper';

export default Paper;

