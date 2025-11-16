/**
 * Formats time in seconds as MM:SS
 * @param seconds - Time in seconds
 * @returns Formatted time string (e.g., "05:30" for 330 seconds)
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

