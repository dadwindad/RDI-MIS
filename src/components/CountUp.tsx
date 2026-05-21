import React, { useEffect, useState } from 'react';

interface CountUpProps {
  /**
   * The final value to count up to.
   */
  end: number;
  /**
   * Duration of the animation in milliseconds.
   * Default: 1000 (1 second)
   */
  duration?: number;
  /**
   * Optional formatter function to transform the displayed value,
   * e.g. for currency or byte formatting.
   */
  formatter?: (value: number) => string;
}

/**
 * Simple count‑up animation component.
 * It interpolates from 0 to the target `end` value over the given `duration`.
 * The component updates at ~60fps using requestAnimationFrame for smoothness.
 */
const CountUp: React.FC<CountUpProps> = ({ end, duration = 1000, formatter }) => {
  const [display, setDisplay] = useState<number>(0);

  useEffect(() => {
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = timestamp - start;
      const progressRatio = Math.min(progress / duration, 1);
      const current = Math.floor(progressRatio * end);
      setDisplay(current);
      if (progress < duration) {
        requestAnimationFrame(step);
      } else {
        setDisplay(end); // ensure final value
      }
    };
    requestAnimationFrame(step);
  }, [end, duration]);

  return <>{formatter ? formatter(display) : display.toLocaleString()}</>;
};

export default CountUp;
