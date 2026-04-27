import { useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';

/**
 * Custom hook to trigger confetti animations
 * Provides various confetti effects for celebrating events
 */
export const useConfetti = () => {
  const confettiRef = useRef(null);

  /**
   * Trigger a celebration confetti animation
   * Perfect for successful minting events
   */
  const triggerCelebration = useCallback(async () => {
    // Ensure confetti is available in the window object
    const confettiFunction = window.confetti || confetti;

    // Duration and timing
    const duration = 3000; // 3 seconds total
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        confettiFunction({
          // Burst of confetti from the center
          particleCount: Math.floor(50 * (1 - progress * 0.5)),
          spread: 90,
          angle: 90,
          startVelocity: 30 + progress * 20,
          ticks: 60,
          origin: {
            x: 0.5,
            y: 0.5,
          },
          zIndex: 9999,
        });

        requestAnimationFrame(animate);
      }
    };

    animate();
    confettiRef.current = Date.now();
  }, []);

  /**
   * Trigger a winner-style confetti animation (slower, elegant)
   */
  const triggerWinner = useCallback(async () => {
    const confettiFunction = window.confetti || confetti;

    // Fire confetti burst
    confettiFunction({
      particleCount: 100,
      spread: 70,
      angle: 60,
      startVelocity: 45,
      ticks: 300,
      origin: {
        x: 0.5,
        y: 0.3,
      },
      zIndex: 9999,
    });

    // Follow-up bursts for extra impact
    setTimeout(() => {
      confettiFunction({
        particleCount: 60,
        spread: 100,
        angle: 120,
        startVelocity: 35,
        ticks: 300,
        origin: {
          x: 0.5,
          y: 0.3,
        },
        zIndex: 9999,
      });
    }, 250);

    confettiRef.current = Date.now();
  }, []);

  /**
   * Trigger confetti from sides (dramatic effect)
   */
  const triggerSideBurst = useCallback(async () => {
    const confettiFunction = window.confetti || confetti;

    // Left side burst
    confettiFunction({
      particleCount: 80,
      angle: 60,
      spread: 60,
      startVelocity: 40,
      ticks: 300,
      origin: { x: 0, y: 0.5 },
      zIndex: 9999,
    });

    // Right side burst
    confettiFunction({
      particleCount: 80,
      angle: 120,
      spread: 60,
      startVelocity: 40,
      ticks: 300,
      origin: { x: 1, y: 0.5 },
      zIndex: 9999,
    });

    confettiRef.current = Date.now();
  }, []);

  /**
   * Custom confetti trigger with full control
   */
  const triggerCustom = useCallback((options = {}) => {
    const confettiFunction = window.confetti || confetti;

    const defaultOptions = {
      particleCount: 100,
      spread: 70,
      angle: 90,
      startVelocity: 35,
      ticks: 300,
      origin: { x: 0.5, y: 0.5 },
      zIndex: 9999,
    };

    confettiFunction({
      ...defaultOptions,
      ...options,
    });

    confettiRef.current = Date.now();
  }, []);

  /**
   * Clear/reset confetti state (if needed)
   */
  const reset = useCallback(() => {
    confettiRef.current = null;
  }, []);

  return {
    triggerCelebration,
    triggerWinner,
    triggerSideBurst,
    triggerCustom,
    reset,
  };
};

export default useConfetti;
