export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Tab {
  id: string;
  title: string;
  content: string;
  mode: "note" | "checklist";
  checklist?: ChecklistItem[];
}

export interface Project {
  id: string;
  title: string;
  tabs: Tab[];
}

// Allowed event colors
export type EventColor = 
  | "#ef4444" // Red
  | "#3b82f6" // Blue
  | "#22c55e" // Green
  | "#eab308" // Yellow
  | "#ec4899" // Pink
  | "#a855f7" // Purple
  | "#f97316" // Orange
  | "#171717" // Black
  | "#fafafa"; // White

// Calendar Event type
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string, e.g. "2025-12-04"
  projectId?: string; // optional; if set, event belongs to a specific project
  color?: EventColor; // optional; color label for the event
}

export const MAX_PROJECTS = 3;
export const MAX_TABS = 7;
export const MAX_CONTENT_LENGTH = 1000;
export const MAX_EVENTS_PER_MONTH = 9;
export const STORAGE_KEY = "sqr1-projects";
export const EVENTS_STORAGE_KEY = "sqr1-events";
