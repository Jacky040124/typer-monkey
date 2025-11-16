import { formatTime } from '@/utils/timeFormatter';
import { PRESET_DURATIONS } from '@/constants/typing';

export interface TypingControlsProps {
  leadingWord: string | null;
  elapsedTime: number;
  isTimerStarting: boolean;
  isTyping: boolean;
  isLongPressing: boolean;
  longPressProgress: number;
  targetTime: number | null;
  startTimeRef: React.MutableRefObject<number | null>;
  onButtonPressStart: () => void;
  onButtonPressEnd: () => void;
  onButtonPressCancel: () => void;
  onDurationSelect: (seconds: number) => void;
}

export default function TypingControls({
  leadingWord,
  elapsedTime,
  isTimerStarting,
  isTyping,
  isLongPressing,
  longPressProgress,
  targetTime,
  startTimeRef,
  onButtonPressStart,
  onButtonPressEnd,
  onButtonPressCancel,
  onDurationSelect,
}: TypingControlsProps) {
  const getButtonText = () => {
    if (isLongPressing) {
      return 'Resetting...';
    }
    if (isTyping) {
      return 'Stop';
    }
    // Show "Resume" only if timer was started before and there's progress
    // For countdown: elapsedTime < targetTime means we've started counting down
    // For count-up: elapsedTime > 0 means we've started counting up
    if (
      startTimeRef.current !== null &&
      ((targetTime !== null && elapsedTime < targetTime) || (targetTime === null && elapsedTime > 0))
    ) {
      return 'Resume';
    }
    return 'Start';
  };

  return (
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
          onMouseDown={onButtonPressStart}
          onMouseUp={onButtonPressEnd}
          onMouseLeave={onButtonPressCancel}
          onTouchStart={onButtonPressStart}
          onTouchEnd={onButtonPressEnd}
          onTouchCancel={onButtonPressCancel}
          className={`control-btn ${isTyping ? 'stop-btn' : 'start-btn'} ${isLongPressing ? 'long-pressing' : ''}`}
        >
          <span className="button-content">{getButtonText()}</span>
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
              onClick={() => onDurationSelect(preset.seconds)}
              className={`duration-preset-btn ${targetTime === preset.seconds ? 'active' : ''}`}
              disabled={isTyping}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

