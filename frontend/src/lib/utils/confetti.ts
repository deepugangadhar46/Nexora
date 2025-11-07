import confetti from 'canvas-confetti';

/**
 * Trigger confetti animation
 */
export const triggerConfetti = (options?: {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
}) => {
  const defaults = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  };

  confetti({
    ...defaults,
    ...options
  });
};

/**
 * Trigger celebration confetti (multiple bursts)
 */
export const triggerCelebration = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);
};

/**
 * Trigger success confetti (single burst from bottom)
 */
export const triggerSuccessConfetti = () => {
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.8 },
    colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0']
  });
};

/**
 * Trigger MVP generation confetti (code-themed colors)
 */
export const triggerMVPConfetti = () => {
  const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#3b82f6'];
  
  confetti({
    particleCount: 200,
    spread: 120,
    origin: { y: 0.6 },
    colors,
    shapes: ['circle', 'square'],
    scalar: 1.2
  });

  // Second burst
  setTimeout(() => {
    confetti({
      particleCount: 100,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors
    });
    confetti({
      particleCount: 100,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors
    });
  }, 200);
};
