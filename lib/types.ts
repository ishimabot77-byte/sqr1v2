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

export const MAX_PROJECTS = 3;
export const MAX_TABS = 7;
export const MAX_CONTENT_LENGTH = 1000;
export const STORAGE_KEY = "sqr1-projects";
