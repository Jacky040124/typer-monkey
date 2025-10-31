import { useState, useCallback, useRef, useEffect } from 'react';
import Monkey from './components/Monkey';
import Collection from './components/Collection';
import { isValidWord } from './utils/wordDetector';
import './App.css';

function App() {
  const [isTyping, setIsTyping] = useState(false);
  const [typingStream, setTypingStream] = useState('');
  const [collection, setCollection] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isPageFlipping, setIsPageFlipping] = useState(false);  
  const [elapsedTime, setElapsedTime] = useState(0);
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [timerInput, setTimerInput] = useState('');
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [isTimerStarting, setIsTimerStarting] = useState(false);
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
    if (newWord) {
      const updatedCollection = Array.from(collectionSetRef.current);
      setCollection(updatedCollection);
      
      // Add highlighted range for the detected word
      setHighlightedRanges((prev) => [...prev, { start: wordStartIndex, end: wordEndIndex }]);
      
      // Update leading word (longest word)
      const longestWord = updatedCollection.reduce((longest, word) => 
        word.length > (longest?.length || 0) ? word : longest, 
        updatedCollection[0] || null
      );
      setLeadingWord(longestWord);
    }
  }, []);

  // Parse MM:SS format to seconds
  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
  };

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

  // Sync timerInput with elapsedTime when not editing
  useEffect(() => {
    if (!isEditingTimer && !isTyping) {
      setTimerInput(formatTime(elapsedTime));
    }
  }, [elapsedTime, isEditingTimer, isTyping]);

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

  // Handle timer input change
  const handleTimerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
    
    // Limit to 4 digits (MMSS)
    if (value.length > 4) {
      value = value.substring(0, 4);
    }
    
    // Auto-format with colon
    if (value.length === 0) {
      setTimerInput('');
    } else if (value.length <= 2) {
      // Just seconds, format as 00:SS
      setTimerInput('00:' + value.padStart(2, '0'));
    } else {
      // Minutes and seconds, format as MM:SS
      const mins = value.substring(0, value.length - 2);
      const secs = value.substring(value.length - 2);
      setTimerInput(mins.padStart(2, '0') + ':' + secs);
    }
  };

  // Handle timer input blur - save the target time
  const handleTimerInputBlur = () => {
    setIsEditingTimer(false);
    // Ensure proper format
    const formatted = timerInput.match(/^\d{2}:\d{2}$/) ? timerInput : '00:00';
    const parsed = parseTime(formatted);
    if (parsed > 0) {
      setTargetTime(parsed);
      setElapsedTime(parsed);
      setTimerInput(formatted);
    } else {
      setTargetTime(null);
      setElapsedTime(0);
      setTimerInput('00:00');
    }
  };

  // Handle timer input focus
  const handleTimerInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsEditingTimer(true);
    // Select all text for easy replacement
    e.target.select();
  };

  // Handle Enter key in timer input
  const handleTimerInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Typer Monkey</h1>
        <p className="subtitle">Watch the monkey type and collect English words</p>
      </header>

      <div className="controls">
        {leadingWord && (
          <div className="leading-word-display">
            <span className="leading-word-text">{leadingWord}</span>
          </div>
        )}
        <div className={`timer-display ${isTimerStarting ? 'timer-starting' : ''}`}>
          {!isTyping && !isTimerStarting ? (
            <input
              type="text"
              value={timerInput}
              onChange={handleTimerInputChange}
              onFocus={handleTimerInputFocus}
              onBlur={handleTimerInputBlur}
              onKeyDown={handleTimerInputKeyDown}
              className="timer-input"
              placeholder="00:00"
              maxLength={5}
            />
          ) : (
            formatTime(elapsedTime)
          )}
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
            {isLongPressing ? 'Resetting...' : isTyping ? 'Stop' : (elapsedTime > 0 ? 'Resume' : 'Start')}
          </span>
          {isTyping && longPressProgress > 0 && (
            <div className="long-press-progress-bar" style={{ width: `${longPressProgress}%` }} />
          )}
        </button>
      </div>

      <Monkey 
        isTyping={isTyping} 
        typingSpeed={100} 
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

      <Collection words={collection} ref={collectionButtonRef} />
    </div>
  );
}

export default App;