import { useState, useEffect } from 'react';
import { formatStarCount } from '@/utils/numberFormatter';

interface GitHubStarButtonProps {
  repoUrl: string;
  repoName: string;
}

export default function GitHubStarButton({ repoUrl, repoName }: GitHubStarButtonProps) {
  const [starCount, setStarCount] = useState<number | null>(null);

  // Fetch GitHub star count
  useEffect(() => {
    const fetchStarCount = async () => {
      try {
        // Extract owner/repo from URL (e.g., "https://github.com/Jacky040124/typer-monkey" -> "Jacky040124/typer-monkey")
        const match = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
        if (!match) return;

        const repoPath = match[1];
        const response = await fetch(`https://api.github.com/repos/${repoPath}`);
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
  }, [repoUrl]);

  return (
    <a
      href={repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="github-star-button"
      aria-label={`Star ${repoName} on GitHub`}
    >
      <svg className="github-logo" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
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
  );
}

