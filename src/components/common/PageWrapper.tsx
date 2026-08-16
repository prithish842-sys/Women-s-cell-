import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

// 1. Page Fade and Slide Entrance
export const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const shouldReduceMotion = useReducedMotion();

  const variants = {
    initial: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 12,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.21, 1.02, 0.43, 1.01],
      },
    },
    exit: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : -12,
      transition: {
        duration: 0.3,
      },
    },
  } as const;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

// 2. Statistics Count-up Component
interface AnimatedCounterProps {
  value: number;
  duration?: number; // duration in ms
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
}) => {
  const [count, setCount] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setCount(value);
      return;
    }

    let start = 0;
    const end = value;
    if (end === 0) {
      setCount(0);
      return;
    }

    const totalSteps = 40; // update 40 times
    const stepTime = Math.max(duration / totalSteps, 16); // minimum 16ms for 60fps feel
    const increment = end / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, duration, shouldReduceMotion]);

  return (
    <span className="font-serif">
      {prefix}
      {count}
      {suffix}
    </span>
  );
};

// 3. Section Reveal on Scroll
interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({ children, delay = 0 }) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.21, 1.02, 0.43, 1.01],
      }}
    >
      {children}
    </motion.div>
  );
};

// 4. Skeleton Loader for beautiful states
export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-amethyst/20 p-6 space-y-4 animate-pulse shadow-[0_10px_30px_rgba(90,24,56,0.08)]">
      <div className="w-12 h-12 bg-thistle/70 rounded-xl"></div>
      <div className="h-4 bg-thistle/70 rounded w-1/3"></div>
      <div className="h-6 bg-thistle/70 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-thistle/70 rounded w-full"></div>
        <div className="h-3 bg-thistle/70 rounded w-5/6"></div>
      </div>
      <div className="h-4 bg-thistle/70 rounded w-1/4 pt-2"></div>
    </div>
  );
};

// 5. Button micro-interaction wrapper
interface InteractiveButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export const InteractiveButton: React.FC<InteractiveButtonProps> = ({
  children,
  className = '',
  onClick,
  type = 'button',
  disabled = false,
}) => {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.015, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.985, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </motion.button>
  );
};
