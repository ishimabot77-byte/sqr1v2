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
 * Detects if the device is iOS/iPadOS running WebKit (Safari or Chrome on iOS).
 * iPhone Chrome uses WebKit under the hood, not Blink.
 */
export function isWebKitIOS(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad on iOS 13+
  const isWebKit = /AppleWebKit/.test(ua) && !/Chrome/.test(ua) || 
    (/CriOS/.test(ua)); // CriOS = Chrome on iOS (still WebKit)
  
  return isIOS;
}

/**
 * Default viewport content for restoration
 */
const DEFAULT_VIEWPORT = "width=device-width, initial-scale=1";

/**
 * Resets mobile browser viewport zoom using viewport meta tag manipulation.
 * 
 * On iOS Safari/Chrome and Android Chrome, when an input field is focused,
 * the browser may zoom in. This function forces the zoom to reset back to
 * normal scale by temporarily setting maximum-scale=1 on the viewport meta tag.
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
  
  // Store scroll position
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;
  
  // Blur any active input/textarea/contenteditable element
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    const tagName = activeElement.tagName.toLowerCase();
    const isEditable = activeElement.isContentEditable;
    
    if (tagName === 'input' || tagName === 'textarea' || isEditable) {
      activeElement.blur();
    }
  }
  
  // Find viewport meta tag
  let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
  
  // If no viewport meta exists, create one
  if (!viewportMeta) {
    viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content = DEFAULT_VIEWPORT;
    document.head.appendChild(viewportMeta);
  }
  
  // Store original content for restoration
  const originalContent = viewportMeta.content || DEFAULT_VIEWPORT;
  
  // Force zoom reset by setting maximum-scale=1 temporarily
  // This tells the browser to snap back to 1x zoom
  viewportMeta.content = "width=device-width, initial-scale=1, maximum-scale=1";
  
  // Restore original viewport settings after browser has processed the reset
  requestAnimationFrame(() => {
    setTimeout(() => {
      if (viewportMeta) {
        // Restore original viewport (allows user zoom again)
        viewportMeta.content = originalContent;
      }
      
      // Restore scroll position
      window.scrollTo(scrollX, scrollY);
    }, 50);
  });
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use resetMobileViewportZoom() instead
 */
export const resetMobileZoom = resetMobileViewportZoom;
