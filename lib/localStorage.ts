import { 
  Project, 
  Tab, 
  ChecklistItem, 
  CalendarEvent,
  STORAGE_KEY, 
  EVENTS_STORAGE_KEY,
  MAX_PROJECTS, 
  MAX_TABS,
  MAX_EVENTS_PER_MONTH 
} from "./types";

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// Migrate old tabs that don't have mode/checklist fields
function migrateTab(tab: Partial<Tab> & { id: string; title: string; content: string }): Tab {
  return {
    id: tab.id,
    title: tab.title,
    content: tab.content,
    mode: tab.mode || "note",
    checklist: tab.checklist || [],
  };
}

// Get all projects from localStorage
export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const projects: Project[] = JSON.parse(data);
    
    // Migrate tabs in each project
    return projects.map((project) => ({
      ...project,
      tabs: project.tabs.map(migrateTab),
    }));
  } catch {
    return [];
  }
}

// Save all projects to localStorage
export function saveProjects(projects: Project[]): void {
  if (typeof window === "undefined") return;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// Get a single project by ID
export function getProject(id: string): Project | null {
  const projects = getProjects();
  return projects.find((p) => p.id === id) || null;
}

// Create a new project
export function createProject(title: string): Project | null {
  const projects = getProjects();
  
  if (projects.length >= MAX_PROJECTS) {
    return null;
  }
  
  const newProject: Project = {
    id: generateId(),
    title,
    tabs: [
      {
        id: generateId(),
        title: "Untitled",
        content: "",
        mode: "note",
        checklist: [],
      },
    ],
  };
  
  projects.push(newProject);
  saveProjects(projects);
  
  return newProject;
}

// Update a project
export function updateProject(updatedProject: Project): void {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === updatedProject.id);
  
  if (index !== -1) {
    projects[index] = updatedProject;
    saveProjects(projects);
  }
}

// Delete a project
export function deleteProject(id: string): void {
  const projects = getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  saveProjects(filtered);
}

// Add a tab to a project
export function addTab(projectId: string): Tab | null {
  const project = getProject(projectId);
  
  if (!project || project.tabs.length >= MAX_TABS) {
    return null;
  }
  
  const newTab: Tab = {
    id: generateId(),
    title: "Untitled",
    content: "",
    mode: "note",
    checklist: [],
  };
  
  project.tabs.push(newTab);
  updateProject(project);
  
  return newTab;
}

// Update a tab in a project
export function updateTab(
  projectId: string,
  tabId: string,
  updates: Partial<Pick<Tab, "title" | "content" | "mode" | "checklist">>
): void {
  const project = getProject(projectId);
  
  if (!project) return;
  
  const tabIndex = project.tabs.findIndex((t) => t.id === tabId);
  
  if (tabIndex !== -1) {
    project.tabs[tabIndex] = { ...project.tabs[tabIndex], ...updates };
    updateProject(project);
  }
}

// Delete a tab from a project
export function deleteTab(projectId: string, tabId: string): void {
  const project = getProject(projectId);
  
  if (!project) return;
  
  // Don't delete if it's the last tab
  if (project.tabs.length <= 1) return;
  
  project.tabs = project.tabs.filter((t) => t.id !== tabId);
  updateProject(project);
}

// Check if we can create more projects
export function canCreateProject(): boolean {
  return getProjects().length < MAX_PROJECTS;
}

// Check if we can add more tabs to a project
export function canAddTab(projectId: string): boolean {
  const project = getProject(projectId);
  return project ? project.tabs.length < MAX_TABS : false;
}

// ==========================================
// Calendar Events
// ==========================================

// Get all events from localStorage
export function getEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return [];
  
  try {
    const data = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!data) return [];
    
    return JSON.parse(data) as CalendarEvent[];
  } catch {
    return [];
  }
}

// Save all events to localStorage
export function saveEvents(events: CalendarEvent[]): void {
  if (typeof window === "undefined") return;
  
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
}

// Get the year-month string from a date string (e.g., "2025-12-04" -> "2025-12")
export function getYearMonth(dateString: string): string {
  return dateString.substring(0, 7);
}

// Count events for a specific year-month
export function countEventsInMonth(yearMonth: string): number {
  const events = getEvents();
  return events.filter((e) => getYearMonth(e.date) === yearMonth).length;
}

// Check if we can create an event for a specific date
export function canCreateEvent(date: string): boolean {
  const yearMonth = getYearMonth(date);
  return countEventsInMonth(yearMonth) < MAX_EVENTS_PER_MONTH;
}

// Create a new event
export function createEvent(
  title: string,
  date: string,
  description?: string,
  projectId?: string,
  color?: string
): CalendarEvent | null {
  if (!canCreateEvent(date)) {
    return null;
  }
  
  const events = getEvents();
  
  const newEvent: CalendarEvent = {
    id: generateId(),
    title,
    date,
    description,
    projectId,
    color,
  };
  
  events.push(newEvent);
  saveEvents(events);
  
  return newEvent;
}

// Update an existing event
export function updateEvent(
  id: string,
  updates: Partial<Omit<CalendarEvent, "id">>
): CalendarEvent | null {
  const events = getEvents();
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return null;
  
  const updatedEvent = { ...events[index], ...updates };
  events[index] = updatedEvent;
  saveEvents(events);
  return updatedEvent;
}

// Delete an event
export function deleteEvent(id: string): void {
  const events = getEvents();
  const filtered = events.filter((e) => e.id !== id);
  saveEvents(filtered);
}

// Get events for a specific date
export function getEventsForDate(date: string, projectId?: string): CalendarEvent[] {
  const events = getEvents();
  return events.filter((e) => {
    const dateMatch = e.date === date;
    if (projectId !== undefined) {
      return dateMatch && e.projectId === projectId;
    }
    return dateMatch;
  });
}

// Get events for a specific month (for calendar display)
export function getEventsForMonth(yearMonth: string, projectId?: string): CalendarEvent[] {
  const events = getEvents();
  return events.filter((e) => {
    const monthMatch = getYearMonth(e.date) === yearMonth;
    if (projectId !== undefined) {
      return monthMatch && e.projectId === projectId;
    }
    return monthMatch;
  });
}
