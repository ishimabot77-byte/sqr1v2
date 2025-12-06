"use client";

import { Tab as TabType } from "@/lib/types";
import Tab from "./Tab";

interface TabBarProps {
  tabs: TabType[];
  activeTabId: string;
  canAddTab: boolean;
  onSelectTab: (tabId: string) => void;
  onRenameTab: (tabId: string, newTitle: string) => void;
  onDeleteTab: (tabId: string) => void;
  onAddTab: () => void;
}

export default function TabBar({
  tabs,
  activeTabId,
  canAddTab,
  onSelectTab,
  onRenameTab,
  onDeleteTab,
  onAddTab,
}: TabBarProps) {
  return (
    <div className="flex items-end bg-neutral-800 border-b border-neutral-700">
      <div className="flex items-end overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            title={tab.title}
            isActive={tab.id === activeTabId}
            canDelete={tabs.length > 1}
            onSelect={() => onSelectTab(tab.id)}
            onRename={(newTitle) => onRenameTab(tab.id, newTitle)}
            onDelete={() => onDeleteTab(tab.id)}
          />
        ))}
      </div>

      {canAddTab && (
        <button
          onClick={onAddTab}
          className="
            flex items-center justify-center w-9 h-9 m-1
            text-neutral-400 hover:text-white hover:bg-neutral-700
            rounded transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500
          "
          aria-label="Add new tab"
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
        </button>
      )}

      {!canAddTab && (
        <div className="px-3 py-2 text-xs text-neutral-500 italic">
          Max 7 tabs
        </div>
      )}
    </div>
  );
}




