/**
 * Mobile utility functions for handling iOS/Android viewport quirks
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

/**
 * Performs the scroll nudge trick to reset viewport zoom.
 * Called internally - use resetMobileViewportZoom() instead.
 */
function performScrollNudge(): void {
  const y = window.scrollY;
  const x = window.scrollX;
  
  // Scroll by 1px then back - this tricks the browser into resetting zoom
  window.scrollTo(x, y + 1);
  window.scrollTo(x, y);
}

/**
 * Resets mobile browser viewport zoom that occurs when focusing on input fields.
 * 
 * On iOS Safari/Chrome and Android Chrome, when an input field is focused,
 * the browser may zoom in. This function forces the zoom to reset back to
 * normal scale using a scroll trick.
 * 
 * Call this on:
 * - Input blur (keyboard Done/checkmark)
 * - Form submit (Save/Cancel/Enter)
 * - Navigation (back arrow, route changes)
 * - Page mount (to clear any zoom from previous page)
 * 
 * Only runs on touch devices; no-op on desktop.
 */
export function resetMobileViewportZoom(): void {
  // Only run on touch devices
  if (!isTouchDevice()) return;
  
  // Blur any active input/textarea/contenteditable element
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    const tagName = activeElement.tagName.toLowerCase();
    const isEditable = activeElement.isContentEditable;
    
    if (tagName === 'input' || tagName === 'textarea' || isEditable) {
      activeElement.blur();
    }
  }
  
  // Use requestAnimationFrame to ensure we're after DOM updates
  requestAnimationFrame(() => {
    performScrollNudge();
    
    // iOS sometimes needs a second nudge after a short delay
    setTimeout(() => {
      performScrollNudge();
    }, 50);
  });
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use resetMobileViewportZoom() instead
 */
export const resetMobileZoom = resetMobileViewportZoom;
