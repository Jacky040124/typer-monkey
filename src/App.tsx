import { useState, useCallback, useRef, useEffect } from 'react';
import Monkey from '@/components/typing/Monkey';
import Collection from '@/components/typing/Collection';
import Auth from '@/components/auth/Auth';
import AvatarButton from '@/components/profile/AvatarButton';
import { useAuth } from '@/contexts/AuthContext';
import { isValidWord } from '@/utils/wordDetector';
import './App.css';

function App() {
  const { user, loading } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const [typingStream, setTypingStream] = useState('');
  const [collection, setCollection] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPageFlipping, setIsPageFlipping] = useState(false);  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [isTimerStarting, setIsTimerStarting] = useState(false);
  
  // Preset durations in seconds
  const PRESET_DURATIONS = [
    { label: '15 mins', seconds: 15 * 60 },
    { label: '30 mins', seconds: 30 * 60 },
    { label: '1 hour', seconds: 60 * 60 },
    { label: '1.5 hours', seconds: 90 * 60 },
    { label: '2 hours', seconds: 120 * 60 },
  ];
  const [leadingWord, setLeadingWord] = useState<string | null>(null);
  const [highlightedRanges, setHighlightedRanges] = useState<Array<{ start: number; end: number }>>([]);
  const collectionSetRef = useRef<Set<string>>(new Set());
  const typingTextRef = useRef<HTMLDivElement>(null);
  const collectionButtonRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressCompletedRef = useRef(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [longPressProgress, setLongPressProgress] = useState(0);
  const longPressStartTimeRef = useRef<number | null>(null);
  const longPressProgressIntervalRef = useRef<number | null>(null);
  const [starCount, setStarCount] = useState<number | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Typing speed - milliseconds between keystrokes (higher = slower)
  const TYPING_SPEED_MS = 150;

  // Paper settings - adjust to fit container
  // With 2rem padding on each side (64px total) and max-width 1200px, 
  // available width is ~1136px. At 1.4em per block (~22.4px), max ~50 chars
  const charsPerLine = 48;
  const linesPerPage = 25;
  const charsPerPage = charsPerLine * linesPerPage;

  // Calculate current page based on typing stream
  const calculatedPage = Math.floor(typingStream.length / charsPerPage);
  
  // Trigger page flip animation when page changes
  useEffect(() => {
    if (calculatedPage !== currentPage && typingStream.length > 0) {
      setIsPageFlipping(true);
      setTimeout(() => {
        setCurrentPage(calculatedPage);
        setIsPageFlipping(false);
      }, 300);
    } else if (calculatedPage === currentPage) {
      setCurrentPage(calculatedPage);
    }
  }, [calculatedPage, currentPage, typingStream.length]);

  const pageStart = currentPage * charsPerPage;
  const pageContent = typingStream.slice(pageStart, pageStart + charsPerPage);
  
  // Split into characters for rendering
  const characters = pageContent.split('');
  
  // Fill remaining slots on current page
  const remainingSlots = charsPerPage - characters.length;
  const displayChars = [...characters, ...Array(remainingSlots).fill('')];
  
  // Split into lines
  const lines: string[][] = [];
  for (let i = 0; i < displayChars.length; i += charsPerLine) {
    lines.push(displayChars.slice(i, i + charsPerLine));
  }

  const handleKeystroke = useCallback((char: string) => {
    let newWord: string | null = null;
    let wordStartIndex = 0;
    let wordEndIndex = 0;
    
    setTypingStream((prev) => {
      const newStream = prev + char.toLowerCase();
      const currentLength = newStream.length;
      
      // Since we're only typing letters now, check for valid words ending at current position
      // Check all possible word endings from the end of the stream (longest first, up to 15 chars)
      const maxWordLength = 15;
      const streamEnd = newStream.slice(-maxWordLength);
      
      // Check for valid words ending at the current position
      for (let length = Math.min(streamEnd.length, maxWordLength); length >= 1; length--) {
        const candidateWord = streamEnd.slice(-length);
        if (isValidWord(candidateWord) && !collectionSetRef.current.has(candidateWord)) {
          collectionSetRef.current.add(candidateWord);
          newWord = candidateWord;
          wordStartIndex = currentLength - length;
          wordEndIndex = currentLength;
          break; // Found a word, stop checking shorter ones
        }
      }
      
      return newStream;
    });
    
    // Update collection state outside of setTypingStream callback
    if (newWord !== null) {
      const word: string = newWord; // Type guard for TypeScript
      const updatedCollection: string[] = Array.from(collectionSetRef.current);
      setCollection(updatedCollection);
      
      // Add highlighted range for the detected word
      setHighlightedRanges((prev) => [...prev, { start: wordStartIndex, end: wordEndIndex }]);
      
      // Update leading word (longest word)
      // If a new word equals the length of the existing longest word, replace it with the new one
      // Find the maximum length in the collection
      const maxLength = updatedCollection.length > 0 
        ? Math.max(...updatedCollection.map((w: string) => w.length))
        : 0;
      
      if (word.length === maxLength) {
        // New word equals the longest length, replace with new one
        setLeadingWord(word);
      } else {
        // Find the longest word (or keep current if new word is shorter)
        const longestWord = updatedCollection.reduce((longest: string | null, w: string) => 
          w.length > (longest?.length || 0) ? w : longest, 
          updatedCollection[0] || null
        );
        setLeadingWord(longestWord);
      }
    }
  }, []);


  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    // Trigger animation
    setIsTimerStarting(true);
    
    // Start timer after animation completes
    setTimeout(() => {
      setIsTimerStarting(false);
      // If we have a target time set, use countdown mode
      if (targetTime !== null && targetTime > 0) {
        setIsTyping(true);
        startTimeRef.current = Date.now();
        timerIntervalRef.current = setInterval(() => {
          if (startTimeRef.current) {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const remaining = Math.max(0, targetTime - elapsed);
            setElapsedTime(remaining);
            
            // Stop typing when countdown reaches 0
            if (remaining === 0) {
              handleStop();
            }
          }
        }, 100);
      } else {
        // Original count-up mode
        setIsTyping(true);
        startTimeRef.current = Date.now() - elapsedTime * 1000;
        timerIntervalRef.current = setInterval(() => {
          if (startTimeRef.current) {
            setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
          }
        }, 100);
      }
    }, 600); // Match animation duration
  };

  const handleStop = () => {
    setIsTyping(false);
    setIsTimerStarting(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const handleReset = () => {
    setIsTyping(false);
    setIsTimerStarting(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    // Reset to selected target time if one was set, otherwise 0
    setElapsedTime(targetTime !== null ? targetTime : 0);
    setTypingStream('');
    setCollection([]);
    setLeadingWord(null);
    setHighlightedRanges([]);
    collectionSetRef.current.clear();
    setCurrentPage(0);
    startTimeRef.current = null;
  };

  const handleButtonPressStart = () => {
    longPressCompletedRef.current = false;
    if (isTyping) {
      // Reset progress
      setLongPressProgress(0);
      longPressStartTimeRef.current = Date.now();
      
      // Start progress animation
      longPressProgressIntervalRef.current = window.setInterval(() => {
        if (longPressStartTimeRef.current) {
          const elapsed = Date.now() - longPressStartTimeRef.current;
          const progress = Math.min(100, (elapsed / 1500) * 100);
          setLongPressProgress(progress);
        }
      }, 16); // ~60fps
      
      // Start long press timer for stop button
      longPressTimerRef.current = window.setTimeout(() => {
        setIsLongPressing(true);
        longPressCompletedRef.current = true;
        setLongPressProgress(100);
        handleReset();
        // Delay resetting the visual state slightly
        setTimeout(() => {
          setIsLongPressing(false);
          setLongPressProgress(0);
        }, 100);
      }, 1500);
    }
  };

  const handleButtonPressEnd = () => {
    const wasLongPress = longPressCompletedRef.current;
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Clear progress interval
    if (longPressProgressIntervalRef.current) {
      clearInterval(longPressProgressIntervalRef.current);
      longPressProgressIntervalRef.current = null;
    }
    
    // Only trigger normal click if long press wasn't completed
    if (!wasLongPress && !isLongPressing) {
      // Normal click
      if (isTyping) {
        handleStop();
      } else {
        handleStart();
      }
    }
    
    // Reset states
    setIsLongPressing(false);
    setLongPressProgress(0);
    longPressStartTimeRef.current = null;
    longPressCompletedRef.current = false;
  };

  const handleButtonPressCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Clear progress interval
    if (longPressProgressIntervalRef.current) {
      clearInterval(longPressProgressIntervalRef.current);
      longPressProgressIntervalRef.current = null;
    }
    
    setIsLongPressing(false);
    setLongPressProgress(0);
    longPressStartTimeRef.current = null;
    longPressCompletedRef.current = false;
  };

  // Handle preset duration selection
  const handleDurationSelect = (seconds: number) => {
    if (!isTyping) {
      setTargetTime(seconds);
      setElapsedTime(seconds);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (longPressProgressIntervalRef.current) {
        clearInterval(longPressProgressIntervalRef.current);
      }
    };
  }, []);

  // Fetch GitHub star count
  useEffect(() => {
    const fetchStarCount = async () => {
      try {
        const response = await fetch('https://api.github.com/repos/Jacky040124/typer-monkey');
        if (response.ok) {
          const data = await response.json();
          setStarCount(data.stargazers_count);
        }
      } catch (error) {
        // Silently fail - star count is optional
        console.error('Failed to fetch star count:', error);
      }
    };
    fetchStarCount();
  }, []);

  // Format star count (e.g., 1234 -> "1.2k", 567 -> "567")
  const formatStarCount = (count: number): string => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return count.toString();
  };


  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="app">
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      </div>
    );
  }

  // Show auth UI if not logged in
  if (!user) {
    return <Auth />;
  }

  return (
    <div className="app">
      <div className="header-controls">
        <a
          href="https://github.com/Jacky040124/typer-monkey"
          target="_blank"
          rel="noopener noreferrer"
          className="github-star-button"
          aria-label="Star typer-monkey on GitHub"
        >
          <svg className="github-logo" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span className="github-text">GitHub</span>
          {starCount !== null && (
            <span className="star-count-badge">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"></path>
              </svg>
              {formatStarCount(starCount)}
            </span>
          )}
        </a>
        <AvatarButton onModalOpenChange={setIsProfileModalOpen} />
      </div>
      <header className="header">
        <h1>Typer Monkey</h1>
        <p className="subtitle">Watch the monkey type and collect English words</p>
      </header>

      <div className="controls">
        <div className="controls-row">
          {leadingWord && (
            <div className="leading-word-display">
              <span className="leading-word-text">{leadingWord}</span>
            </div>
          )}
          <div className={`timer-display ${isTimerStarting ? 'timer-starting' : ''}`}>
            {formatTime(elapsedTime)}
          </div>
          <button 
            onMouseDown={handleButtonPressStart}
            onMouseUp={handleButtonPressEnd}
            onMouseLeave={handleButtonPressCancel}
            onTouchStart={handleButtonPressStart}
            onTouchEnd={handleButtonPressEnd}
            onTouchCancel={handleButtonPressCancel}
            className={`control-btn ${isTyping ? 'stop-btn' : 'start-btn'} ${isLongPressing ? 'long-pressing' : ''}`}
          >
            <span className="button-content">
              {isLongPressing ? 'Resetting...' : isTyping ? 'Stop' : (
                // Show "Resume" only if timer was started before and there's progress
                // For countdown: elapsedTime < targetTime means we've started counting down
                // For count-up: elapsedTime > 0 means we've started counting up
                startTimeRef.current !== null && (
                  (targetTime !== null && elapsedTime < targetTime) || 
                  (targetTime === null && elapsedTime > 0)
                )
                  ? 'Resume' 
                  : 'Start'
              )}
            </span>
            {isTyping && longPressProgress > 0 && (
              <div className="long-press-progress-bar" style={{ width: `${longPressProgress}%` }} />
            )}
          </button>
        </div>
        {!isTyping && !isTimerStarting && (
          <div className="duration-presets">
            {PRESET_DURATIONS.map((preset) => (
              <button
                key={preset.seconds}
                onClick={() => handleDurationSelect(preset.seconds)}
                className={`duration-preset-btn ${targetTime === preset.seconds ? 'active' : ''}`}
                disabled={isTyping}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <Monkey 
        isTyping={isTyping} 
        typingSpeed={TYPING_SPEED_MS} 
        onKeystroke={handleKeystroke} 
      />

      <div className="content">
        <div className="paper-container">
          <div className={`paper ${isPageFlipping ? 'flipping' : ''}`} ref={typingTextRef}>
            {lines.map((line, lineIndex) => (
              <div key={lineIndex} className="paper-line">
                {line.map((char, charIndex) => {
                  const globalIndex = pageStart + lineIndex * charsPerLine + charIndex;
                  const isActive = globalIndex === typingStream.length && isTyping;
                  const isHighlighted = highlightedRanges.some(range => 
                    globalIndex >= range.start && globalIndex < range.end
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

      {!isProfileModalOpen && <Collection words={collection} ref={collectionButtonRef} />}
    </div>
  );
}

export default App;