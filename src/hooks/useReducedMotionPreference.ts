import { useReducedMotion } from 'motion/react';

export function useReducedMotionPreference() {
  return Boolean(useReducedMotion());
}
