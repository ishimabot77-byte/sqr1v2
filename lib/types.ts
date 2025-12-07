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

// Calendar Event type
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string, e.g. "2025-12-04"
  projectId?: string; // optional; if set, event belongs to a specific project
}

export const MAX_PROJECTS = 3;
export const MAX_TABS = 7;
export const MAX_CONTENT_LENGTH = 1000;
export const MAX_EVENTS_PER_MONTH = 9;
export const STORAGE_KEY = "sqr1-projects";
export const EVENTS_STORAGE_KEY = "sqr1-events";
