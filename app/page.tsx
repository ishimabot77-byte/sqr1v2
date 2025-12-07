"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getProjects,
  createProject,
  deleteProject,
  canCreateProject,
} from "@/lib/localStorage";
import { Project, MAX_PROJECTS } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setProjects(getProjects());
    setIsLoaded(true);
  }, []);

  const handleCreateProject = () => {
    if (!newProjectTitle.trim()) return;

    const project = createProject(newProjectTitle.trim());
    if (project) {
      setProjects(getProjects());
      setNewProjectTitle("");
      setIsCreating(false);
      router.push(`/project/${project.id}`);
    }
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject(id);
      setProjects(getProjects());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateProject();
    } else if (e.key === "Escape") {
      setIsCreating(false);
      setNewProjectTitle("");
    }
  };

  const canCreate = canCreateProject();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-neutral-100 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">SQR1</h1>
              <p className="text-neutral-500 mt-1">Every project starts here.</p>
            </div>

            {/* Nav Tabs */}
            <nav className="flex gap-2">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-md text-sm bg-neutral-800 text-neutral-100"
              >
                Projects
              </Link>
              <Link
                href="/calendar"
                className="px-3 py-1.5 rounded-md text-sm bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Calendar
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Create Project Section */}
        <div className="mb-8">
          {isCreating ? (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Project name..."
                className="
                  flex-1 px-4 py-3 bg-neutral-900 border border-neutral-700
                  rounded-lg text-white placeholder:text-neutral-600
                  focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500/50 transition-colors
                "
                autoFocus
                maxLength={50}
              />
              <button
                onClick={handleCreateProject}
                className="
                  px-5 py-3 border border-white text-white rounded-lg
                  font-medium hover:bg-white hover:text-black transition-colors
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black
                "
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewProjectTitle("");
                }}
                className="
                  px-5 py-3 bg-neutral-800 text-white rounded-lg
                  font-medium hover:bg-neutral-700 transition-colors
                "
              >
                Cancel
              </button>
            </div>
          ) : canCreate ? (
            <button
              onClick={() => setIsCreating(true)}
              className="
                flex items-center gap-3 px-5 py-3.5
                bg-neutral-900 border border-neutral-800 rounded-lg
                text-neutral-300 hover:text-white hover:border-neutral-700
                transition-all w-full justify-center
              "
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8 1V15M1 8H15" />
              </svg>
              <span>New Project</span>
            </button>
          ) : (
            <div className="text-center py-6 bg-neutral-900 border border-neutral-800 rounded-lg">
              <p className="text-neutral-400 mb-2">
                You&#39;ve reached the free project limit ({MAX_PROJECTS} projects)
              </p>
              <button className="text-white hover:text-gray-300 font-medium transition-colors">
                Upgrade for unlimited projects →
              </button>
            </div>
          )}
        </div>

        {/* Projects List */}
        <div className="space-y-3">
          {projects.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-900 flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-neutral-600"
                >
                  <path d="M19 11H5M19 11C20.1046 11 21 11.8954 21 13V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V13C3 11.8954 3.89543 11 5 11M19 11V9C19 7.89543 18.1046 7 17 7M5 11V9C5 7.89543 5.89543 7 7 7M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7M7 7H17" />
                </svg>
              </div>
              <p className="text-neutral-500">No projects yet</p>
              <p className="text-neutral-600 text-sm mt-1">
                Create your first project to get started
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/project/${project.id}`)}
                className="
                  group flex items-center justify-between
                  px-5 py-4 bg-neutral-900 border border-neutral-800
                  rounded-lg cursor-pointer
                  hover:border-neutral-700 hover:bg-neutral-850
                  transition-all
                "
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                    <span className="text-lg font-medium text-neutral-400">
                      {project.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{project.title}</h3>
                    <p className="text-sm text-neutral-500">
                      {project.tabs.length} tab{project.tabs.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    className="
                      p-2 rounded-lg text-neutral-600
                      hover:text-red-400 hover:bg-neutral-800
                      opacity-0 group-hover:opacity-100
                      transition-all
                    "
                    aria-label="Delete project"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M2 4H14M5.333 4V2.667C5.333 2.298 5.632 2 6 2H10C10.368 2 10.667 2.298 10.667 2.667V4M12.667 4V13.333C12.667 13.702 12.368 14 12 14H4C3.632 14 3.333 13.702 3.333 13.333V4" />
                    </svg>
                  </button>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-neutral-600 group-hover:text-neutral-400 transition-colors"
                  >
                    <path d="M6 12L10 8L6 4" />
                  </svg>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-neutral-900">
          <p className="text-center text-neutral-600 text-sm">
            SQR1 · {projects.length}/{MAX_PROJECTS} projects
          </p>
        </footer>
      </main>
    </div>
  );
}




