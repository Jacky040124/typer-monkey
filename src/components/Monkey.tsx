import React from 'react';

interface MonkeyProps {
  isTyping: boolean;
  typingSpeed: number; // milliseconds between keystrokes
  onKeystroke: (char: string) => void;
}

export default function Monkey({ isTyping, typingSpeed, onKeystroke }: MonkeyProps) {
  React.useEffect(() => {
    if (!isTyping) return;

    const interval = setInterval(() => {
      const char = generateRandomChar();
      onKeystroke(char);
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [isTyping, typingSpeed, onKeystroke]);

  return null; // This component doesn't render anything, it's handled by the parent
}

/**
 * Generates a random character for the monkey to type
 */
export function generateRandomChar(): string {
  // Only generate English letters (a-z)
  return String.fromCharCode(97 + Math.floor(Math.random() * 26));
}
