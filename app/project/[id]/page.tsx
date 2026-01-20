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
import { isTouchDevice } from "@/lib/mobileUtils";
import TabBar from "@/components/TabBar";
import Editor from "@/components/Editor";

export default function ProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  
  // Touch device detection for mobile-specific behavior
  const [isTouch, setIsTouch] = useState(false);

  // Load project and detect touch capability
  useEffect(() => {
    const loadedProject = getProject(projectId);
    if (loadedProject) {
      setProject(loadedProject);
      setActiveTabId(loadedProject.tabs[0]?.id || "");
      setTitleValue(loadedProject.title);
    }
    setIsLoaded(true);
    
    // Detect touch capability
    setIsTouch(isTouchDevice());
  }, [projectId]);

  // Lock body scroll to prevent any scroll jumping - the layout handles scrolling internally
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

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
    <div className="h-dvh flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* Header - flex-shrink-0 ensures it doesn't collapse */}
      <header className="flex-shrink-0 flex items-center gap-4 px-4 py-3 border-b border-neutral-800 bg-neutral-950">
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
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
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
            className="text-lg font-medium cursor-pointer hover:text-neutral-300 transition-colors truncate"
          >
            {project.title}
          </h1>
        )}

        <div className="ml-auto flex-shrink-0">
          <span className="text-xs text-neutral-500">
            {project.tabs.length}/{MAX_TABS} tabs
          </span>
        </div>
      </header>

      {/* Tab Bar - flex-shrink-0 ensures it doesn't collapse */}
      <div className="flex-shrink-0">
        <TabBar
          tabs={project.tabs}
          activeTabId={activeTabId}
          canAddTab={canAddTab(projectId)}
          onSelectTab={handleSelectTab}
          onRenameTab={handleRenameTab}
          onDeleteTab={handleDeleteTab}
          onAddTab={handleAddTab}
        />
      </div>

      {/* Editor - flex-1 fills remaining space, overflow-hidden contains it */}
      <div className="flex-1 overflow-hidden">
        {activeTab ? (
          <Editor
            key={activeTabId}
            content={activeTab.content}
            mode={activeTab.mode}
            checklist={activeTab.checklist || []}
            onChange={handleContentChange}
            onModeChange={handleModeChange}
            onChecklistChange={handleChecklistChange}
            isTouch={isTouch}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-500">
            No tab selected
          </div>
        )}
      </div>
    </div>
  );
}
