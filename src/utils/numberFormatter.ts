/**
 * Formats a number count with k suffix for thousands
 * @param count - The number to format
 * @returns Formatted string (e.g., "1.2k" for 1234, "567" for 567)
 */
export function formatStarCount(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return count.toString();
}

