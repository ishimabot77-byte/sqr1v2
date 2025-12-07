"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getProject,
  updateProject,
  updateTab,
  addTab,
  deleteTab,
  canAddTab,
} from "@/lib/localStorage";
import { Project, Tab as TabType, ChecklistItem, MAX_TABS } from "@/lib/types";
import TabBar from "@/components/TabBar";
import Editor from "@/components/Editor";
import Calendar from "@/components/Calendar";

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  // Load project
  useEffect(() => {
    const loadedProject = getProject(projectId);
    if (loadedProject) {
      setProject(loadedProject);
      setActiveTabId(loadedProject.tabs[0]?.id || "");
      setTitleValue(loadedProject.title);
    }
    setIsLoaded(true);
  }, [projectId]);

  // Get active tab
  const activeTab = project?.tabs.find((t) => t.id === activeTabId);

  // Handle tab selection
  const handleSelectTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  // Handle tab rename
  const handleRenameTab = useCallback(
    (tabId: string, newTitle: string) => {
      if (!project) return;
      updateTab(projectId, tabId, { title: newTitle });
      setProject(getProject(projectId));
    },
    [project, projectId]
  );

  // Handle tab delete
  const handleDeleteTab = useCallback(
    (tabId: string) => {
      if (!project || project.tabs.length <= 1) return;

      // If deleting active tab, switch to another
      if (tabId === activeTabId) {
        const currentIndex = project.tabs.findIndex((t) => t.id === tabId);
        const newIndex = currentIndex === 0 ? 1 : currentIndex - 1;
        setActiveTabId(project.tabs[newIndex].id);
      }

      deleteTab(projectId, tabId);
      setProject(getProject(projectId));
    },
    [project, projectId, activeTabId]
  );

  // Handle add tab
  const handleAddTab = useCallback(() => {
    if (!project) return;

    const newTab = addTab(projectId);
    if (newTab) {
      setProject(getProject(projectId));
      setActiveTabId(newTab.id);
    }
  }, [project, projectId]);

  // Handle content change
  const handleContentChange = useCallback(
    (content: string) => {
      if (!project || !activeTabId) return;
      updateTab(projectId, activeTabId, { content });
      
      // Update local state without refetching
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tabs: prev.tabs.map((t) =>
            t.id === activeTabId ? { ...t, content } : t
          ),
        };
      });
    },
    [project, projectId, activeTabId]
  );

  // Handle mode change
  const handleModeChange = useCallback(
    (mode: "note" | "checklist") => {
      if (!project || !activeTabId) return;
      
      // Initialize checklist if switching to checklist mode and it's undefined
      const activeTab = project.tabs.find((t) => t.id === activeTabId);
      const updates: Partial<Pick<TabType, "mode" | "checklist">> = { mode };
      
      if (mode === "checklist" && (!activeTab?.checklist || activeTab.checklist.length === 0)) {
        updates.checklist = [];
      }
      
      updateTab(projectId, activeTabId, updates);
      
      // Update local state without refetching
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tabs: prev.tabs.map((t) =>
            t.id === activeTabId ? { ...t, ...updates } : t
          ),
        };
      });
    },
    [project, projectId, activeTabId]
  );

  // Handle checklist change
  const handleChecklistChange = useCallback(
    (checklist: ChecklistItem[]) => {
      if (!project || !activeTabId) return;
      updateTab(projectId, activeTabId, { checklist });
      
      // Update local state without refetching
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tabs: prev.tabs.map((t) =>
            t.id === activeTabId ? { ...t, checklist } : t
          ),
        };
      });
    },
    [project, projectId, activeTabId]
  );

  // Handle project title change
  const handleTitleSubmit = () => {
    if (!project || !titleValue.trim()) {
      setTitleValue(project?.title || "");
      setIsEditingTitle(false);
      return;
    }

    const updatedProject = { ...project, title: titleValue.trim() };
    updateProject(updatedProject);
    setProject(updatedProject);
    setIsEditingTitle(false);
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="w-6 h-6 border-2 border-neutral-100 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Project not found
  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-100">
        <h1 className="text-2xl font-semibold mb-4">Project not found</h1>
        <button
          onClick={() => router.push("/")}
          className="px-5 py-2.5 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
        >
          Go back home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-3 border-b border-neutral-800 bg-neutral-950">
        <button
          onClick={() => router.push("/")}
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
          aria-label="Back to projects"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10 12L6 8L10 4" />
          </svg>
        </button>

        {isEditingTitle ? (
          <input
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleSubmit();
              if (e.key === "Escape") {
                setTitleValue(project.title);
                setIsEditingTitle(false);
              }
            }}
            className="bg-neutral-800 px-3 py-1.5 rounded text-lg font-medium outline-none border border-neutral-600"
            autoFocus
            maxLength={50}
          />
        ) : (
          <h1
            onClick={() => setIsEditingTitle(true)}
            className="text-lg font-medium cursor-pointer hover:text-neutral-300 transition-colors"
          >
            {project.title}
          </h1>
        )}

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
              transition-all
              ${showCalendar 
                ? "bg-neutral-700 text-white" 
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }
            `}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Calendar
          </button>
          <span className="text-xs text-neutral-500">
            {project.tabs.length}/{MAX_TABS} tabs
          </span>
        </div>
      </header>

      {/* Tab Bar */}
      <TabBar
        tabs={project.tabs}
        activeTabId={activeTabId}
        canAddTab={canAddTab(projectId)}
        onSelectTab={handleSelectTab}
        onRenameTab={handleRenameTab}
        onDeleteTab={handleDeleteTab}
        onAddTab={handleAddTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Editor */}
        <div className={`flex-1 overflow-hidden ${showCalendar ? "border-r border-neutral-800" : ""}`}>
          {activeTab ? (
            <Editor
              key={activeTabId}
              content={activeTab.content}
              mode={activeTab.mode}
              checklist={activeTab.checklist || []}
              onChange={handleContentChange}
              onModeChange={handleModeChange}
              onChecklistChange={handleChecklistChange}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-500">
              No tab selected
            </div>
          )}
        </div>

        {/* Project Calendar Panel */}
        {showCalendar && (
          <div className="w-80 lg:w-96 overflow-y-auto bg-neutral-950 p-4">
            <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-3">
              Project Calendar
            </h3>
            <Calendar projectId={projectId} />
          </div>
        )}
      </div>
    </div>
  );
}
