import { useState, useEffect, useRef } from 'react';

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  console.log('[MusicPlayer] Component rendered, isPlaying:', isPlaying);

  // Handle audio loading and errors
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlay = () => {
      console.log('[MusicPlayer] Audio can play - file loaded successfully');
      setAudioError(null);
    };

    const handleError = () => {
      const error = audio.error;
      let errorMsg = 'Unknown error';
      
      if (error) {
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMsg = 'Audio loading aborted';
            break;
          case error.MEDIA_ERR_NETWORK:
            errorMsg = 'Network error loading audio';
            break;
          case error.MEDIA_ERR_DECODE:
            errorMsg = 'Audio decode error';
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = 'Audio format not supported or file not found';
            break;
        }
      }
      
      console.error('[MusicPlayer] Audio error:', errorMsg, error);
      setAudioError(errorMsg);
    };

    const handleLoadStart = () => {
      console.log('[MusicPlayer] Audio load started');
    };

    const handleLoadedData = () => {
      console.log('[MusicPlayer] Audio data loaded');
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);

    // Try to load the audio
    audio.load();

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    console.log('[MusicPlayer] useEffect triggered, isPlaying:', isPlaying, 'audio:', audio);
    if (audio) {
      if (isPlaying) {
        console.log('[MusicPlayer] Attempting to play audio');
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Audio play failed (likely autoplay policy):", error);
          });
        }
      } else {
        console.log('[MusicPlayer] Pausing audio and resetting');
        audio.pause();
        audio.currentTime = 0; // Reset to beginning when stopped
      }
    }
  }, [isPlaying]);

  // Try to play on first interaction if autoplay was blocked
  useEffect(() => {
    const handleInteraction = () => {
      if (isPlaying && audioRef.current?.paused) {
        audioRef.current.play().catch(e => console.log("Autoplay retry failed", e));
      }
    };
    
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [isPlaying]);

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('[MusicPlayer] Button clicked!', {
      isPlaying,
      event: e,
      target: e.target,
      currentTarget: e.currentTarget,
      buttonText: isPlaying ? 'Stop' : 'Play'
    });
    e.preventDefault();
    e.stopPropagation();
    console.log('[MusicPlayer] Setting isPlaying to:', !isPlaying);
    setIsPlaying(!isPlaying);
  };

  const handleMouseDown = () => {
    console.log('[MusicPlayer] Button mousedown event');
  };

  const handleMouseUp = () => {
    console.log('[MusicPlayer] Button mouseup event');
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: '12px',
        left: '12px',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px 16px',
        borderRadius: '8px',
        color: '#1a1a1a',
        backdropFilter: 'blur(8px)',
        border: '1px solid #e0e0e0',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        transition: 'all 0.2s ease',
        pointerEvents: 'auto' // Enable pointer events since parent has pointer-events: none
      }}
      onClick={(e) => {
        console.log('[MusicPlayer] Container clicked', e.target);
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: isPlaying ? '#4caf50' : '#e0e0e0',
          boxShadow: isPlaying ? '0 0 8px #4caf50' : 'none',
          transition: 'all 0.3s ease'
        }} />
        <span style={{ fontWeight: 500, fontSize: '13px' }}>
          {isPlaying ? 'Playing' : 'Paused'}
        </span>
      </div>
      
      <audio
        ref={audioRef}
        src="/background_music.mp3"
        loop
        preload="auto"
      />
      {audioError && (
        <span style={{ color: '#d32f2f', fontSize: '12px', marginLeft: '8px' }}>
          Error: {audioError}
        </span>
      )}
      
      <div style={{ width: '1px', height: '16px', background: '#e0e0e0' }} />

      <button
        onClick={handleButtonClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{
            background: 'transparent',
            border: 'none',
            color: '#1a1a1a',
            cursor: 'pointer',
            fontSize: '13px',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 10001
        }}
        onMouseEnter={(e) => {
          console.log('[MusicPlayer] Button hover enter');
          e.currentTarget.style.background = '#f5f5f5';
        }}
        onMouseLeave={(e) => {
          console.log('[MusicPlayer] Button hover leave');
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {isPlaying ? 'Stop' : 'Play'}
      </button>
    </div>
  );
}
