"use client";

import { useState, useEffect, useRef, ReactNode } from "react";

interface SwipeRevealRowProps {
  id: string;
  children: ReactNode;
  onDelete: () => void;
  closeAllSignal: number;
  onRequestCloseOthers: (id: string) => void;
  confirmTitle: string;
  confirmBody: string;
  /** Whether swipe gestures are enabled (default: true). Set to false on desktop. */
  enabled?: boolean;
  /** Callback to expose the openConfirm function to parent for desktop delete button */
  onConfirmRef?: (openConfirm: () => void) => void;
}

const SWIPE_THRESHOLD = 15; // Minimum px to start recognizing as swipe
const SNAP_THRESHOLD = 48; // If dragged more than this, snap open
const MAX_TRANSLATE = 96; // Maximum reveal distance

export default function SwipeRevealRow({
  id,
  children,
  onDelete,
  closeAllSignal,
  onRequestCloseOthers,
  confirmTitle,
  confirmBody,
  enabled = true,
  onConfirmRef,
}: SwipeRevealRowProps) {
  const [translateX, setTranslateX] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const isSwipeGesture = useRef<boolean | null>(null); // null = undetermined, true = horizontal swipe, false = vertical scroll
  const rowRef = useRef<HTMLDivElement>(null);

  // Expose openConfirm function to parent
  const openConfirm = () => setShowConfirm(true);
  
  useEffect(() => {
    if (onConfirmRef) {
      onConfirmRef(openConfirm);
    }
  }, [onConfirmRef]);

  // Close when closeAllSignal changes
  useEffect(() => {
    setTranslateX(0);
    setShowConfirm(false);
  }, [closeAllSignal]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Skip if swipe is disabled
    if (!enabled) return;
    
    // Only handle primary button (left click / single touch)
    if (e.button !== 0) return;
    
    startX.current = e.clientX;
    startY.current = e.clientY;
    currentX.current = translateX;
    isSwipeGesture.current = null;
    setIsDragging(true);
    
    // Capture pointer for tracking outside element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!enabled || !isDragging) return;

    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;

    // Determine gesture type if not yet determined
    if (isSwipeGesture.current === null) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      // Need to move at least threshold to determine direction
      if (absX > SWIPE_THRESHOLD || absY > SWIPE_THRESHOLD) {
        isSwipeGesture.current = absX > absY;
        
        // If it's a horizontal swipe, notify parent to close others
        if (isSwipeGesture.current) {
          onRequestCloseOthers(id);
        }
      }
    }

    // Only process horizontal swipes
    if (isSwipeGesture.current === true) {
      e.preventDefault();
      
      let newTranslate = currentX.current + deltaX;
      
      // Clamp between -MAX_TRANSLATE and +MAX_TRANSLATE
      newTranslate = Math.max(-MAX_TRANSLATE, Math.min(MAX_TRANSLATE, newTranslate));
      
      setTranslateX(newTranslate);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // Only snap if it was determined to be a horizontal swipe
    if (isSwipeGesture.current === true) {
      // Determine final position based on how far it was dragged
      if (Math.abs(translateX) > SNAP_THRESHOLD) {
        // Snap open to the direction of drag
        setTranslateX(translateX > 0 ? MAX_TRANSLATE : -MAX_TRANSLATE);
      } else {
        // Snap closed
        setTranslateX(0);
      }
    }
    
    isSwipeGesture.current = null;
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    setIsDragging(false);
    isSwipeGesture.current = null;
    // Snap back on cancel
    setTranslateX(translateX > SNAP_THRESHOLD ? MAX_TRANSLATE : translateX < -SNAP_THRESHOLD ? -MAX_TRANSLATE : 0);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowConfirm(false);
    setTranslateX(0);
    onDelete();
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
  };

  // Handle Escape key to close confirm modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showConfirm) {
        setShowConfirm(false);
      }
    };

    if (showConfirm) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [showConfirm]);

  const isOpen = Math.abs(translateX) > SNAP_THRESHOLD;

  return (
    <>
      <div
        ref={rowRef}
        className="relative overflow-hidden rounded-lg"
        style={{ touchAction: isDragging && isSwipeGesture.current === true ? "none" : "pan-y" }}
      >
        {/* Background layer - Delete buttons on both sides */}
        <div className="absolute inset-0 flex">
          {/* Left side delete (revealed when swiping right) */}
          <div className="w-24 h-full flex items-center justify-center bg-red-600">
            <button
              onClick={handleDeleteClick}
              className="flex flex-col items-center gap-1 text-white"
              aria-label="Delete"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 4H14M5.333 4V2.667C5.333 2.298 5.632 2 6 2H10C10.368 2 10.667 2.298 10.667 2.667V4M12.667 4V13.333C12.667 13.702 12.368 14 12 14H4C3.632 14 3.333 13.702 3.333 13.333V4" />
              </svg>
              <span className="text-xs font-medium">Delete</span>
            </button>
          </div>
          
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* Right side delete (revealed when swiping left) */}
          <div className="w-24 h-full flex items-center justify-center bg-red-600">
            <button
              onClick={handleDeleteClick}
              className="flex flex-col items-center gap-1 text-white"
              aria-label="Delete"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M2 4H14M5.333 4V2.667C5.333 2.298 5.632 2 6 2H10C10.368 2 10.667 2.298 10.667 2.667V4M12.667 4V13.333C12.667 13.702 12.368 14 12 14H4C3.632 14 3.333 13.702 3.333 13.333V4" />
              </svg>
              <span className="text-xs font-medium">Delete</span>
            </button>
          </div>
        </div>

        {/* Foreground layer - slides to reveal background */}
        <div
          className="relative bg-neutral-900"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          {children}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={handleCancelDelete}
        >
          <div 
            className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-2">{confirmTitle}</h3>
            <p className="text-sm text-neutral-400 mb-6">{confirmBody}</p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2.5 bg-neutral-800 text-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
