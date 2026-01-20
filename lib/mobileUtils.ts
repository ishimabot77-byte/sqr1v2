/**
 * Mobile utility functions for handling iOS/Android quirks
 */

/**
 * Detects if the current device is a touch/mobile device
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  
  const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const hasTouchPoints = navigator.maxTouchPoints > 0;
  
  return hasCoarsePointer || hasTouchPoints;
}

/**
 * Resets mobile browser zoom that occurs when focusing on input fields.
 * 
 * On iOS Safari/Chrome and Android Chrome, when an input field is focused,
 * the browser may zoom in. This function forces the zoom to reset back to
 * normal scale by using a scroll trick.
 * 
 * Call this on:
 * - Input blur
 * - Form submit (Save/Cancel/Enter)
 * - Modal close
 * 
 * Only runs on touch devices; no-op on desktop.
 */
export function resetMobileZoom(): void {
  // Only run on touch devices
  if (!isTouchDevice()) return;
  
  // Blur any active element first
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  
  // Use requestAnimationFrame to ensure we're after any focus changes
  requestAnimationFrame(() => {
    // Store current scroll position
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    
    // Scroll by 1px to trigger zoom reset, then immediately restore
    // This tricks iOS/Android into recalculating the viewport zoom
    window.scrollTo(scrollX, scrollY + 1);
    
    // Restore original position after a tiny delay
    setTimeout(() => {
      window.scrollTo(scrollX, scrollY);
    }, 10);
  });
}
