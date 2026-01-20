/**
 * Mobile utility functions for touch device detection
 */

/**
 * Detects if the current device is a touch/mobile device.
 * Uses pointer capability detection, not screen width.
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  
  const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const hasTouchPoints = navigator.maxTouchPoints > 0;
  
  return hasCoarsePointer || hasTouchPoints;
}
