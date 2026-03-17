import React, { useState, useEffect, RefObject } from 'react';

interface ScrollProgressBarProps {
  targetRef: RefObject<HTMLElement | null>;
  active?: boolean;
  onComplete?: () => void;
  isInitiallyCompleted?: boolean;
  showPercentageOnly?: boolean;
}

const ScrollProgressBar: React.FC<ScrollProgressBarProps> = ({
  targetRef,
  active = true,
  onComplete,
  isInitiallyCompleted = false,
  showPercentageOnly = false
}) => {
  const [progress, setProgress] = useState(isInitiallyCompleted ? 100 : 0);
  const [hasTriggeredComplete, setHasTriggeredComplete] = useState(false);

  useEffect(() => {
    if (isInitiallyCompleted) {
      setProgress(100);
    }
  }, [isInitiallyCompleted]);

  useEffect(() => {
    if (!active) return;

    const handleScroll = () => {
      const element = targetRef.current;
      if (element) {
        // If already completed, we just stay at 100
        if (isInitiallyCompleted) {
          setProgress(100);
          return;
        }

        const { scrollTop, scrollHeight, clientHeight } = element;
        const totalHeight = scrollHeight - clientHeight;

        if (totalHeight > 0) {
          const calculatedProgress = Math.min(100, Math.max(0, (scrollTop / totalHeight) * 100));
          setProgress(prev => Math.max(prev, calculatedProgress)); // Only increase progress

          if (calculatedProgress >= 99 && !hasTriggeredComplete && !isInitiallyCompleted) {
            setHasTriggeredComplete(true);
            onComplete?.();
          }
        } else if (scrollHeight > 0 && !isInitiallyCompleted) {
          // Content fits on screen
          setProgress(100);
          if (!hasTriggeredComplete) {
            setHasTriggeredComplete(true);
            onComplete?.();
          }
        }
      }
    };

    // Retry mechanism to attach listener
    let interval: any;
    const attachListener = () => {
      const element = targetRef.current;
      if (element) {
        element.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        clearInterval(interval);

        const resizeObserver = new ResizeObserver(handleScroll);
        resizeObserver.observe(element);
        return () => {
          element.removeEventListener('scroll', handleScroll);
          resizeObserver.disconnect();
        };
      }
    };

    const cleanup = attachListener();
    if (!cleanup) {
      interval = setInterval(attachListener, 100);
    }

    return () => {
      if (cleanup) cleanup();
      if (interval) clearInterval(interval);
    };
  }, [targetRef, active, isInitiallyCompleted, onComplete, hasTriggeredComplete]);

  if (!active) return null;

  const isFull = progress >= 99.9 || isInitiallyCompleted;

  return (
    <div className="fixed top-0 left-0 w-full h-1.5 z-[9999] bg-white/10 pointer-events-none">
      <div
        className={`h-full transition-all duration-150 ease-out relative ${isFull ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-brand-500 shadow-[0_0_12px_rgba(72,80,229,0.8)]'}`}
        style={{ width: `${progress}%` }}
      >
        <div className={`absolute right-0 top-0 h-full w-8 blur-md animate-pulse ${isFull ? 'bg-white/60' : 'bg-white/40'}`} />
      </div>

      <div
        className={`absolute top-4 right-8 backdrop-blur-xl text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] shadow-2xl border transition-all duration-500 flex items-center gap-2
          ${(isFull && !showPercentageOnly)
            ? 'bg-emerald-600/90 border-emerald-400/30 ring-4 ring-emerald-500/20'
            : 'bg-slate-900/90 border-white/20'}`}
        style={{
          opacity: progress > 0.5 ? 1 : 0,
          transform: `translateY(${progress > 0.5 ? 0 : -10}px)`
        }}
      >
        {(isFull && !showPercentageOnly) ? (
          <>
            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-white text-emerald-600 animate-in zoom-in duration-500">
              <span className="material-symbols-outlined text-[12px] font-black">check</span>
            </div>
            <span className="animate-in fade-in slide-in-from-right-2 duration-700">UNIT COMPLETED</span>
          </>
        ) : (
          <>
            <span className="text-brand-400">READING</span>
            <span className="w-px h-3 bg-white/20" />
            <span className="min-w-[40px] text-right">{Math.round(progress)}%</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ScrollProgressBar;
