"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MAX_CONTENT_LENGTH, ChecklistItem } from "@/lib/types";
import { generateId } from "@/lib/localStorage";

// Free tier limit for checklist items per tab
const MAX_FREE_CHECKLIST_ITEMS = 5;

interface EditorProps {
  content: string;
  mode: "note" | "checklist";
  checklist: ChecklistItem[];
  onChange: (content: string) => void;
  onModeChange: (mode: "note" | "checklist") => void;
  onChecklistChange: (checklist: ChecklistItem[]) => void;
}

export default function Editor({
  content,
  mode,
  checklist,
  onChange,
  onModeChange,
  onChecklistChange,
}: EditorProps) {
  const router = useRouter();
  const [localContent, setLocalContent] = useState(content);
  const [localChecklist, setLocalChecklist] = useState<ChecklistItem[]>(checklist);
  const [isSaving, setIsSaving] = useState(false);
  const isUserTyping = useRef(false);
  const isChecklistChanged = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const newItemRef = useRef<HTMLInputElement>(null);

  // Check if checklist has reached the free limit
  const isAtChecklistLimit = localChecklist.length >= MAX_FREE_CHECKLIST_ITEMS;

  // Auto-resize textarea to fit content
  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  // Sync with prop changes (when switching tabs)
  useEffect(() => {
    isUserTyping.current = false;
    setLocalContent(content);
  }, [content]);

  // Sync checklist with prop changes
  useEffect(() => {
    isChecklistChanged.current = false;
    setLocalChecklist(checklist);
  }, [checklist]);

  // Auto-resize when content changes
  useEffect(() => {
    autoResize();
  }, [localContent, autoResize]);

  // Debounced save for note content - triggers 800ms after user stops typing
  useEffect(() => {
    if (mode !== "note") return;
    
    // Skip if this was a prop sync, not user input
    if (!isUserTyping.current) {
      return;
    }

    // If content matches prop, no save needed
    if (localContent === content) {
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    const timeout = setTimeout(() => {
      onChange(localContent);
      setIsSaving(false);
    }, 800);

    // Cleanup: clear timeout if user types again before 800ms
    return () => clearTimeout(timeout);
  }, [localContent, content, onChange, mode]);

  // Debounced save for checklist - triggers 800ms after user stops editing
  useEffect(() => {
    if (mode !== "checklist") return;
    
    // Skip if this was a prop sync, not user input
    if (!isChecklistChanged.current) {
      return;
    }

    // If checklist matches prop, no save needed
    if (JSON.stringify(localChecklist) === JSON.stringify(checklist)) {
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    const timeout = setTimeout(() => {
      onChecklistChange(localChecklist);
      setIsSaving(false);
    }, 800);

    return () => clearTimeout(timeout);
  }, [localChecklist, checklist, onChecklistChange, mode]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Enforce character limit
    if (value.length <= MAX_CONTENT_LENGTH) {
      isUserTyping.current = true;
      setLocalContent(value);
    }
  };

  // Smart list behavior for note editor
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Only handle Enter without Shift
    if (e.key !== "Enter" || e.shiftKey) {
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;

    // Find the current line boundaries
    const beforeCursor = value.substring(0, selectionStart);
    const afterCursor = value.substring(selectionEnd);

    // Find the start of the current line (after the last newline before cursor)
    const lineStart = beforeCursor.lastIndexOf("\n") + 1;
    // Find the end of the current line (before the first newline after cursor, or end of text)
    const lineEndRelative = afterCursor.indexOf("\n");
    const lineEnd = lineEndRelative === -1 ? value.length : selectionEnd + lineEndRelative;

    const currentLine = value.substring(lineStart, lineEnd);

    // Check for dash bullet: /^\s*-\s/
    const dashMatch = currentLine.match(/^(\s*-\s)/);
    // Check for numbered bullet: /^\s*(\d+)\.\s/
    const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s/);

    if (dashMatch) {
      const bulletPrefix = dashMatch[1]; // e.g., "  - "
      const textAfterBullet = currentLine.substring(bulletPrefix.length);

      if (textAfterBullet.trim() === "") {
        // Empty bullet line - remove the bullet marker, leave empty line
        e.preventDefault();

        // Replace the current line content (bullet prefix) with empty string
        const newValue = value.substring(0, lineStart) + value.substring(lineEnd);

        isUserTyping.current = true;
        setLocalContent(newValue);

        // Set cursor position at the line start (which is now empty)
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = lineStart;
            textareaRef.current.selectionEnd = lineStart;
          }
        }, 0);
      } else {
        // Has content after bullet - insert new bullet line
        e.preventDefault();

        const newLine = "\n" + bulletPrefix;
        const newValue = value.substring(0, selectionEnd) + newLine + value.substring(selectionEnd);

        // Only apply if within character limit
        if (newValue.length <= MAX_CONTENT_LENGTH) {
          isUserTyping.current = true;
          setLocalContent(newValue);

          // Set cursor position after the new bullet
          setTimeout(() => {
            if (textareaRef.current) {
              const newCursorPos = selectionEnd + newLine.length;
              textareaRef.current.selectionStart = newCursorPos;
              textareaRef.current.selectionEnd = newCursorPos;
            }
          }, 0);
        }
      }
    } else if (numberedMatch) {
      const indent = numberedMatch[1]; // leading spaces
      const currentNumber = parseInt(numberedMatch[2], 10);
      const fullPrefix = numberedMatch[0]; // e.g., "  1. "
      const textAfterBullet = currentLine.substring(fullPrefix.length);

      if (textAfterBullet.trim() === "") {
        // Empty numbered line - remove the bullet marker, leave empty line
        e.preventDefault();

        // Replace the current line content (bullet prefix) with empty string
        const newValue = value.substring(0, lineStart) + value.substring(lineEnd);

        isUserTyping.current = true;
        setLocalContent(newValue);

        // Set cursor position at the line start (which is now empty)
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = lineStart;
            textareaRef.current.selectionEnd = lineStart;
          }
        }, 0);
      } else {
        // Has content after bullet - insert new numbered line with incremented number
        e.preventDefault();

        const nextNumber = currentNumber + 1;
        const newLine = "\n" + indent + nextNumber + ". ";
        const newValue = value.substring(0, selectionEnd) + newLine + value.substring(selectionEnd);

        // Only apply if within character limit
        if (newValue.length <= MAX_CONTENT_LENGTH) {
          isUserTyping.current = true;
          setLocalContent(newValue);

          // Set cursor position after the new bullet
          setTimeout(() => {
            if (textareaRef.current) {
              const newCursorPos = selectionEnd + newLine.length;
              textareaRef.current.selectionStart = newCursorPos;
              textareaRef.current.selectionEnd = newCursorPos;
            }
          }, 0);
        }
      }
    }
    // For non-list lines, let Enter behave normally (don't prevent default)
  };

  // Checklist handlers
  const handleAddItem = () => {
    // Don't add if at the free limit
    if (isAtChecklistLimit) return;

    isChecklistChanged.current = true;
    const newItem: ChecklistItem = {
      id: generateId(),
      text: "",
      done: false,
    };
    setLocalChecklist((prev) => [...prev, newItem]);
    
    // Focus the new item after render
    setTimeout(() => {
      newItemRef.current?.focus();
    }, 50);
  };

  const handleToggleItem = (itemId: string) => {
    isChecklistChanged.current = true;
    setLocalChecklist((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      )
    );
  };

  const handleUpdateItemText = (itemId: string, text: string) => {
    isChecklistChanged.current = true;
    setLocalChecklist((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, text } : item
      )
    );
  };

  const handleDeleteItem = (itemId: string) => {
    isChecklistChanged.current = true;
    setLocalChecklist((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, itemId: string, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Only add if not at limit
      if (!isAtChecklistLimit) {
        handleAddItem();
      }
    } else if (e.key === "Backspace" && localChecklist[index].text === "") {
      e.preventDefault();
      handleDeleteItem(itemId);
      // Focus previous item if exists
      if (index > 0) {
        const prevInput = document.querySelector(`[data-item-index="${index - 1}"]`) as HTMLInputElement;
        prevInput?.focus();
      }
    }
  };

  const charCount = localContent.length;
  const charPercentage = (charCount / MAX_CONTENT_LENGTH) * 100;
  const isNearLimit = charPercentage >= 80;
  const isAtLimit = charCount >= MAX_CONTENT_LENGTH;

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-neutral-800">
        <div className="flex bg-neutral-800 rounded-lg p-0.5">
          <button
            onClick={() => onModeChange("note")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              mode === "note"
                ? "bg-neutral-700 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Note
          </button>
          <button
            onClick={() => onModeChange("checklist")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
              mode === "checklist"
                ? "bg-neutral-700 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Checklist
          </button>
        </div>
      </div>

      {/* Note Mode */}
      {mode === "note" && (
        <>
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="min-h-[60vh]">
              <textarea
                ref={textareaRef}
                value={localContent}
                onChange={handleContentChange}
                onKeyDown={handleTextareaKeyDown}
                placeholder="Start writing..."
                className="
                  w-full min-h-[60vh] resize-none bg-transparent
                  text-white text-lg leading-relaxed
                  placeholder:text-neutral-600
                  outline-none focus:outline-none focus:ring-0
                  font-light tracking-wide
                "
                spellCheck={false}
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800">
            <div className="flex items-center gap-3">
              {isSaving ? (
                <span className="text-xs text-neutral-500 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  Saving...
                </span>
              ) : (
                <span className="text-xs text-neutral-500 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Saved
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-24 h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isAtLimit
                      ? "bg-red-500"
                      : isNearLimit
                      ? "bg-amber-500"
                      : "bg-neutral-600"
                  }`}
                  style={{ width: `${Math.min(charPercentage, 100)}%` }}
                />
              </div>
              <span
                className={`text-xs font-mono ${
                  isAtLimit
                    ? "text-red-400"
                    : isNearLimit
                    ? "text-amber-400"
                    : "text-neutral-500"
                }`}
              >
                {charCount}/{MAX_CONTENT_LENGTH}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Checklist Mode */}
      {mode === "checklist" && (
        <>
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
              {localChecklist.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-neutral-500 mb-4">No items yet</p>
                  <button
                    onClick={handleAddItem}
                    className="px-4 py-2 border border-white text-white hover:bg-white hover:text-black rounded-lg transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
                  >
                    Add your first item
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {localChecklist.map((item, index) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 py-2.5 px-3 bg-neutral-800/50 rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleItem(item.id)}
                        className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-800 ${
                          item.done
                            ? "bg-white border-white"
                            : "border-neutral-500 hover:border-neutral-400"
                        }`}
                      >
                        {item.done && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="black"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2 6L5 9L10 3" />
                          </svg>
                        )}
                      </button>

                      {/* Text Input */}
                      <input
                        ref={index === localChecklist.length - 1 ? newItemRef : null}
                        data-item-index={index}
                        type="text"
                        value={item.text}
                        onChange={(e) => handleUpdateItemText(item.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, item.id, index)}
                        placeholder="Enter item..."
                        className={`flex-1 bg-transparent text-white outline-none placeholder:text-neutral-600 focus:outline-none ${
                          item.done ? "line-through text-neutral-400" : ""
                        }`}
                      />

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Delete item"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M3 3L11 11M11 3L3 11" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Item Button */}
              {localChecklist.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={handleAddItem}
                    disabled={isAtChecklistLimit}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm w-full ${
                      isAtChecklistLimit
                        ? "text-neutral-600 cursor-not-allowed"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M7 1V13M1 7H13" />
                    </svg>
                    Add item
                  </button>

                  {/* Free Limit Message */}
                  {isAtChecklistLimit && (
                    <div className="mt-4 p-4 bg-neutral-800/70 border border-neutral-600 rounded-lg">
                      <p className="text-neutral-300 text-sm mb-3">
                        You&#39;ve reached the free limit: {MAX_FREE_CHECKLIST_ITEMS} checklist items per tab. 
                        Upgrade to create unlimited items.
                      </p>
                      <button
                        onClick={() => router.push("/pricing")}
                        className="px-4 py-2 border border-white text-white hover:bg-white hover:text-black font-medium rounded-lg transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-800"
                      >
                        Upgrade
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status Bar for Checklist */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-800">
            <div className="flex items-center gap-3">
              {isSaving ? (
                <span className="text-xs text-neutral-500 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  Saving...
                </span>
              ) : (
                <span className="text-xs text-neutral-500 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Saved
                </span>
              )}
            </div>

            <div className="text-xs text-neutral-500">
              {localChecklist.filter((item) => item.done).length}/{localChecklist.length} completed
            </div>
          </div>
        </>
      )}
    </div>
  );
}
