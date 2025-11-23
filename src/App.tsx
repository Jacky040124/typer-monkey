import { useEffect, useState } from "react";
import GitHubStarButton from "@profile/GitHubStarButton";
import MusicPlayer from "@/components/MusicPlayer";
import "./App.css";

function App() {
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    if (window.threeApp) {
      setDevMode(window.threeApp.getDevMode());
    }
  }, []);

  const handleToggleDevMode = () => {
    if (window.threeApp) {
      const newState = window.threeApp.toggleDevMode();
      setDevMode(newState);
    }
  };

  return (
    <div className="minimal-overlay">
      {!devMode && <MusicPlayer />}
      <div className="header-controls">
        <GitHubStarButton repoUrl="https://github.com/Jacky040124/typer-monkey" repoName="typer-monkey" />
        <button
          onClick={handleToggleDevMode}
          className="dev-mode-button"
          style={{
            padding: '0.5rem 0.875rem',
            fontSize: '0.875rem',
            backgroundColor: devMode ? '#4caf50' : '#fff',
            color: devMode ? '#fff' : '#1a1a1a',
            border: `1px solid ${devMode ? '#4caf50' : '#e0e0e0'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            fontFamily: 'inherit',
            height: '40px',
            lineHeight: '1',
          }}
          onMouseEnter={(e) => {
            if (!devMode) {
              e.currentTarget.style.background = '#f5f5f5';
              e.currentTarget.style.borderColor = '#d0d0d0';
            }
          }}
          onMouseLeave={(e) => {
            if (!devMode) {
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.borderColor = '#e0e0e0';
            }
          }}
        >
          {devMode ? 'Dev Mode ON' : 'Dev Mode'}
        </button>
      </div>
    </div>
  );
}

export default App;
