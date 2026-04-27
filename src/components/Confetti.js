import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import './Confetti.css';

/**
 * Confetti Component
 * Renders and manages a confetti animation effect
 * 
 * Usage:
 * <Confetti active={isSuccessful} type="celebration" />
 */
const Confetti = ({ 
  active = false, 
  type = 'celebration',
  duration = 3000,
  onComplete = () => {}
}) => {
  useEffect(() => {
    if (!active) return;

    const startTime = Date.now();
    let animationFrameId;

    const triggerConfetti = () => {
      switch (type) {
        case 'winner':
          // Initial burst
          confetti({
            particleCount: 100,
            spread: 70,
            angle: 60,
            startVelocity: 45,
            ticks: 300,
            origin: { x: 0.5, y: 0.3 },
            zIndex: 9999,
          });

          // Follow-up burst
          setTimeout(() => {
            confetti({
              particleCount: 60,
              spread: 100,
              angle: 120,
              startVelocity: 35,
              ticks: 300,
              origin: { x: 0.5, y: 0.3 },
              zIndex: 9999,
            });
          }, 250);
          break;

        case 'sideburst':
          // Left burst
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 60,
            startVelocity: 40,
            ticks: 300,
            origin: { x: 0, y: 0.5 },
            zIndex: 9999,
          });

          // Right burst
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 60,
            startVelocity: 40,
            ticks: 300,
            origin: { x: 1, y: 0.5 },
            zIndex: 9999,
          });
          break;

        case 'celebration':
        default:
          // Continuous burst effect
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            if (progress < 1) {
              confetti({
                particleCount: Math.floor(50 * (1 - progress * 0.5)),
                spread: 90,
                angle: 90,
                startVelocity: 30 + progress * 20,
                ticks: 60,
                origin: { x: 0.5, y: 0.5 },
                zIndex: 9999,
              });

              animationFrameId = requestAnimationFrame(animate);
            } else {
              onComplete();
            }
          };
          animate();
          break;
      }
    };

    triggerConfetti();

    // Set a timeout to complete the animation
    const timeoutId = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [active, type, duration, onComplete]);

  return (
    <div className="confetti-container">
      {/* Confetti canvas is added by canvas-confetti library */}
    </div>
  );
};

export default Confetti;
