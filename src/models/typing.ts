export interface MonkeyProps {
  isTyping: boolean;
  typingSpeed: number; // milliseconds between keystrokes
  onKeystroke: (char: string) => void;
}

export interface CollectionProps {
  words: string[];
}

export interface HighlightedRange {
  start: number;
  end: number;
}

