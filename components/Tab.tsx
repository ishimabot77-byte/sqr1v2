"use client";

import { useState, useRef, useEffect } from "react";
import { resetMobileZoom } from "@/lib/mobileUtils";

interface TabProps {
  id: string;
  title: string;
  isActive: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onRename: (newTitle: string) => void;
  onDelete: () => void;
}

export default function Tab({
  title,
  isActive,
  canDelete,
  onSelect,
  onRename,
  onDelete,
}: TabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(title);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim()) {
      onRename(editValue.trim());
    } else {
      setEditValue(title);
    }
    // Reset mobile zoom after editing
    resetMobileZoom();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setEditValue(title);
      setIsEditing(false);
      // Reset mobile zoom on cancel
      resetMobileZoom();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      className={`
        group relative flex items-center gap-2 px-4 py-2.5
        border-r border-neutral-700 cursor-pointer
        transition-all duration-200 min-w-[120px] max-w-[180px]
        ${
          isActive
            ? "bg-neutral-900 text-white"
            : "bg-neutral-800 text-neutral-400 hover:bg-neutral-750 hover:text-neutral-200"
        }
      `}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none outline-none text-sm w-full text-white"
          maxLength={30}
        />
      ) : (
        <span className="text-sm truncate flex-1">{title}</span>
      )}

      {canDelete && !isEditing && (
        <button
          onClick={handleDeleteClick}
          className={`
            w-5 h-5 flex items-center justify-center rounded
            text-neutral-500 hover:text-white hover:bg-neutral-600
            transition-all opacity-0 group-hover:opacity-100
            ${isActive ? "opacity-100" : ""}
          `}
          aria-label="Close tab"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M1 1L9 9M9 1L1 9" />
          </svg>
        </button>
      )}

      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
      )}
    </div>
  );
}




