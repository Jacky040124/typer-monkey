import { useState, useEffect, useMemo } from 'react';

// Page layout constants
const CHARS_PER_LINE = 48;
const LINES_PER_PAGE = 25;
const CHARS_PER_PAGE = CHARS_PER_LINE * LINES_PER_PAGE;

export function usePageCalculation(typingStream: string) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPageFlipping, setIsPageFlipping] = useState(false);

  // Calculate current page based on typing stream
  const calculatedPage = Math.floor(typingStream.length / CHARS_PER_PAGE);

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

  // Derive page content and layout
  const { pageStart, lines } = useMemo(() => {
    const pageStart = currentPage * CHARS_PER_PAGE;
    const pageContent = typingStream.slice(pageStart, pageStart + CHARS_PER_PAGE);

    // Split into characters for rendering
    const characters = pageContent.split('');

    // Fill remaining slots on current page
    const remainingSlots = CHARS_PER_PAGE - characters.length;
    const displayChars = [...characters, ...Array(remainingSlots).fill('')];

    // Split into lines
    const lines: string[][] = [];
    for (let i = 0; i < displayChars.length; i += CHARS_PER_LINE) {
      lines.push(displayChars.slice(i, i + CHARS_PER_LINE));
    }

    return { pageStart, lines };
  }, [currentPage, typingStream]);

  // Reset function for when the typing stream is cleared
  const resetPage = () => {
    setCurrentPage(0);
  };

  return {
    lines,
    currentPage,
    pageStart,
    isPageFlipping,
    resetPage,
    CHARS_PER_LINE,
  };
}

