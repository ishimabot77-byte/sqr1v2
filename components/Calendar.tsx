"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import SwipeRevealRow from "@/components/SwipeRevealRow";
import {
  getEventsForMonth,
  createEvent,
  updateEvent,
  deleteEvent,
  canCreateEvent,
  countEventsInMonth,
  getProjects,
} from "@/lib/localStorage";
import { 
  CalendarEvent, 
  Project, 
  MAX_EVENTS_PER_MONTH, 
  EventColor, 
  EVENT_COLOR_OPTIONS 
} from "@/lib/types";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDateString(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // New event form state
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventProjectId, setNewEventProjectId] = useState<string>("");
  const [newEventColor, setNewEventColor] = useState<EventColor | "">("");
  const newEventTitleRef = useRef<HTMLInputElement>(null);

  // Edit event state
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editProjectId, setEditProjectId] = useState<string>("");
  const [editColor, setEditColor] = useState<EventColor | "">("");

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Swipe management state for event rows
  const [eventCloseAllSignal, setEventCloseAllSignal] = useState(0);
  const [openEventRowId, setOpenEventRowId] = useState<string | null>(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const yearMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  // Close all swipe rows when tapping outside
  const handleEventsContainerClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-event-row]') === null) {
      if (openEventRowId) {
        setEventCloseAllSignal((s) => s + 1);
        setOpenEventRowId(null);
      }
    }
  };

  // Handler for when a row requests to close others
  const handleEventRequestCloseOthers = (id: string) => {
    if (openEventRowId !== id) {
      setEventCloseAllSignal((s) => s + 1);
      setOpenEventRowId(id);
    }
  };

  // Load all events for the month (global calendar - no project filtering)
  const refreshEvents = useCallback(() => {
    const monthEvents = getEventsForMonth(yearMonth);
    setEvents(monthEvents);
  }, [yearMonth]);

  useEffect(() => {
    refreshEvents();
    setProjects(getProjects());
  }, [refreshEvents]);

  // Get the first day of the month (0 = Sunday)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Get the number of days in the month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Get today's date string
  const today = new Date();
  const todayString = formatDateString(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDate(null);
  };

  // Count events for a specific day
  const getEventCountForDay = (day: number): number => {
    const dateStr = formatDateString(currentYear, currentMonth, day);
    return events.filter((e) => e.date === dateStr).length;
  };

  // Get events for selected date
  const selectedDateEvents = selectedDate
    ? events.filter((e) => e.date === selectedDate)
    : [];

  // Check if can create event for selected date
  const canCreateForSelectedDate = selectedDate
    ? canCreateEvent(selectedDate)
    : false;

  // Get count for the selected month (across all projects for limit display)
  const totalEventsInMonth = countEventsInMonth(yearMonth);

  // Handle create event
  const handleCreateEvent = () => {
    if (!selectedDate || !newEventTitle.trim()) return;

    const result = createEvent(
      newEventTitle.trim(),
      selectedDate,
      newEventDescription.trim() || undefined,
      newEventProjectId || undefined,
      newEventColor || undefined
    );

    if (result) {
      setNewEventTitle("");
      setNewEventDescription("");
      setNewEventProjectId("");
      setNewEventColor("");
      setIsAddingEvent(false);
      refreshEvents();
    }
  };

  // Handle cancel new event
  const handleCancelNewEvent = () => {
    setNewEventTitle("");
    setNewEventDescription("");
    setNewEventProjectId("");
    setNewEventColor("");
    setIsAddingEvent(false);
  };

  // Handle start adding event
  const handleStartAddEvent = () => {
    setIsAddingEvent(true);
    // Autofocus title input after state update
    setTimeout(() => {
      newEventTitleRef.current?.focus();
    }, 0);
  };

  // Handle start editing
  const handleStartEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditDescription(event.description || "");
    setEditDate(event.date);
    setEditProjectId(event.projectId || "");
    setEditColor(event.color || "");
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingEvent(null);
    setEditTitle("");
    setEditDescription("");
    setEditDate("");
    setEditProjectId("");
    setEditColor("");
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (!editingEvent || !editTitle.trim() || !editDate) return;

    updateEvent(editingEvent.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      date: editDate,
      projectId: editProjectId || undefined,
      color: editColor || undefined,
    });

    handleCancelEdit();
    refreshEvents();
  };

  // Handle delete event with confirmation
  const handleDeleteEvent = (eventId: string) => {
    setDeleteConfirmId(eventId);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteEvent(deleteConfirmId);
      setDeleteConfirmId(null);
      if (editingEvent?.id === deleteConfirmId) {
        handleCancelEdit();
      }
      refreshEvents();
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  // Get project name by id
  const getProjectName = (pId: string): string => {
    const project = projects.find((p) => p.id === pId);
    return project?.title || "Unknown Project";
  };

  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
          aria-label="Previous month"
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
        
        <h3 className="text-lg font-medium text-neutral-100">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h3>
        
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
          aria-label="Next month"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 12L10 8L6 4" />
          </svg>
        </button>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 border-b border-neutral-800">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-neutral-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return (
              <div
                key={`empty-${index}`}
                className="h-12 border-r border-b border-neutral-800 last:border-r-0"
              />
            );
          }

          const dateStr = formatDateString(currentYear, currentMonth, day);
          const isToday = dateStr === todayString;
          const isSelected = dateStr === selectedDate;
          const eventCount = getEventCountForDay(day);

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(dateStr)}
              className={`
                h-12 flex flex-col items-center justify-center
                border-r border-b border-neutral-800 last:border-r-0
                transition-all relative
                ${isSelected
                  ? "bg-neutral-700"
                  : isToday
                  ? "bg-neutral-800"
                  : "hover:bg-neutral-800/50"
                }
              `}
            >
              <span
                className={`
                  text-sm
                  ${isToday ? "text-white font-semibold" : "text-neutral-300"}
                `}
              >
                {day}
              </span>
              {eventCount > 0 && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Month Event Count */}
      <div className="px-4 py-2 border-t border-neutral-800 text-xs text-neutral-500">
        {totalEventsInMonth}/{MAX_EVENTS_PER_MONTH} events this month
      </div>

      {/* Selected Day Panel */}
      {selectedDate && (
        <div className="border-t border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-neutral-100">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h4>
            <button
              onClick={() => setSelectedDate(null)}
              className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M1 1L13 13M1 13L13 1" />
              </svg>
            </button>
          </div>

          {/* Events List */}
          {selectedDateEvents.length > 0 && (
            <div className="space-y-2 mb-4" onClick={handleEventsContainerClick}>
              {selectedDateEvents.map((event) => (
                <SwipeRevealRow
                  key={event.id}
                  id={event.id}
                  onDelete={() => {
                    deleteEvent(event.id);
                    if (editingEvent?.id === event.id) {
                      handleCancelEdit();
                    }
                    refreshEvents();
                  }}
                  closeAllSignal={eventCloseAllSignal}
                  onRequestCloseOthers={handleEventRequestCloseOthers}
                  confirmTitle="Delete event?"
                  confirmBody="This calendar event will be removed."
                >
                  <div
                    data-event-row
                    className="flex items-start gap-3 p-3 bg-neutral-800 rounded-lg"
                  >
                    {/* Color indicator */}
                    {event.color && (
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          event.color === "#fafafa" || event.color === "#171717" 
                            ? "border border-neutral-500" 
                            : ""
                        }`}
                        style={{ backgroundColor: event.color }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-100 truncate">
                        {event.title}
                      </p>
                      {event.description && (
                        <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      {event.projectId && (
                        <p className="text-xs text-blue-400 mt-1">
                          {getProjectName(event.projectId)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {/* Edit button */}
                      <button
                        onClick={() => handleStartEdit(event)}
                        className="p-1.5 rounded text-neutral-500 hover:text-white hover:bg-neutral-700 transition-all"
                        aria-label="Edit event"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M11.333 2A1.886 1.886 0 0 1 14 4.667L5.333 13.333H2v-3.333L10.667 2h.666z" />
                        </svg>
                      </button>
                      {/* Desktop Delete button (hover only) */}
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-1.5 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-700 transition-all hidden md:block"
                        aria-label="Delete event"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path d="M2 4H14M5.333 4V2.667C5.333 2.298 5.632 2 6 2H10C10.368 2 10.667 2.298 10.667 2.667V4M12.667 4V13.333C12.667 13.702 12.368 14 12 14H4C3.632 14 3.333 13.702 3.333 13.333V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </SwipeRevealRow>
              ))}
            </div>
          )}

          {/* Delete Confirmation Dialog (for desktop hover delete button) */}
          {deleteConfirmId && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-lg">
              <p className="text-sm text-red-200 mb-3">Delete this event?</p>
              <div className="flex gap-2">
                <button
                  onClick={confirmDelete}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={cancelDelete}
                  className="px-3 py-1.5 bg-neutral-700 text-neutral-300 text-sm rounded-lg hover:bg-neutral-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Edit Event Modal */}
          {editingEvent && (
            <div className="mb-4 p-4 bg-neutral-800 border border-neutral-600 rounded-lg">
              <div className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">
                Edit Event
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && editTitle.trim() && editDate) {
                      e.preventDefault();
                      (e.target as HTMLInputElement).blur();
                      handleSaveEdit();
                    }
                  }}
                  placeholder="Event title..."
                  className="
                    w-full px-3 py-2 bg-neutral-700 border border-neutral-600
                    rounded-lg text-sm text-white placeholder:text-neutral-500
                    focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500/50
                    transition-colors
                  "
                  maxLength={100}
                />

                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description (optional)..."
                  rows={2}
                  className="
                    w-full px-3 py-2 bg-neutral-700 border border-neutral-600
                    rounded-lg text-sm text-white placeholder:text-neutral-500
                    focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500/50
                    transition-colors resize-none
                  "
                  maxLength={500}
                />

                {/* Date picker */}
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="
                    w-full px-3 py-2 bg-neutral-700 border border-neutral-600
                    rounded-lg text-sm text-white
                    focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500/50
                    transition-colors
                  "
                />

                {/* Project selector */}
                <select
                  value={editProjectId}
                  onChange={(e) => setEditProjectId(e.target.value)}
                  className="
                    w-full px-3 py-2 bg-neutral-700 border border-neutral-600
                    rounded-lg text-sm text-white
                    focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500/50
                    transition-colors
                  "
                >
                  <option value="">No project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>

                {/* Color picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Color:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setEditColor("")}
                      className={`
                        w-5 h-5 rounded-full border-2 transition-all
                        ${editColor === "" 
                          ? "border-white ring-2 ring-white/30" 
                          : "border-neutral-600 hover:border-neutral-400"
                        }
                        bg-neutral-700
                      `}
                      title="No color"
                    />
                    {EVENT_COLOR_OPTIONS.map((color) => {
                      const isSelected = editColor === color.value;
                      const needsBorder = color.value === "#171717" || color.value === "#fafafa";
                      return (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setEditColor(color.value)}
                          className={`
                            w-5 h-5 rounded-full border transition-all
                            ${isSelected 
                              ? "ring-2 ring-white/50 scale-110" 
                              : "hover:scale-110"
                            }
                            ${needsBorder 
                              ? "border-neutral-500" 
                              : "border-transparent"
                            }
                          `}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editTitle.trim() || !editDate}
                    className="
                      flex-1 px-4 py-2 bg-white text-black rounded-lg
                      text-sm font-medium
                      hover:bg-neutral-200 transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="
                      px-4 py-2 bg-neutral-700 text-neutral-300 rounded-lg
                      text-sm font-medium
                      hover:bg-neutral-600 transition-colors
                    "
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Event Section */}
          {!isAddingEvent ? (
            /* Show "+ New event" button when form is hidden */
            <button
              onClick={handleStartAddEvent}
              disabled={!canCreateForSelectedDate}
              className={`
                w-full px-4 py-2.5 rounded-lg text-sm font-medium
                flex items-center justify-center gap-2 transition-colors
                ${canCreateForSelectedDate
                  ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                  : "bg-neutral-800/50 text-neutral-500 cursor-not-allowed"
                }
              `}
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
              {canCreateForSelectedDate ? "New event" : `Limit reached (${MAX_EVENTS_PER_MONTH}/month)`}
            </button>
          ) : (
            /* Show form when adding event */
            <div 
              className="space-y-3"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleCancelNewEvent();
                }
              }}
            >
              <div className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
                New Event
              </div>

              <input
                ref={newEventTitleRef}
                type="text"
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Event title..."
                className="
                  w-full px-3 py-2 bg-neutral-800 border border-neutral-700
                  rounded-lg text-sm text-white placeholder:text-neutral-500
                  focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500/50
                  transition-colors
                "
                maxLength={100}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && newEventTitle.trim()) {
                    e.preventDefault();
                    (e.target as HTMLInputElement).blur();
                    handleCreateEvent();
                  }
                }}
              />

              <textarea
                value={newEventDescription}
                onChange={(e) => setNewEventDescription(e.target.value)}
                placeholder="Description (optional)..."
                rows={2}
                className="
                  w-full px-3 py-2 bg-neutral-800 border border-neutral-700
                  rounded-lg text-sm text-white placeholder:text-neutral-500
                  focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500/50
                  transition-colors resize-none
                "
                maxLength={500}
              />

              {/* Project selector */}
              <select
                value={newEventProjectId}
                onChange={(e) => setNewEventProjectId(e.target.value)}
                className="
                  w-full px-3 py-2 bg-neutral-800 border border-neutral-700
                  rounded-lg text-sm text-white
                  focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500/50
                  transition-colors
                "
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>

              {/* Color picker */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">Color:</span>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setNewEventColor("")}
                    className={`
                      w-5 h-5 rounded-full border-2 transition-all
                      ${newEventColor === "" 
                        ? "border-white ring-2 ring-white/30" 
                        : "border-neutral-600 hover:border-neutral-400"
                      }
                      bg-neutral-700
                    `}
                    title="No color"
                  />
                  {EVENT_COLOR_OPTIONS.map((color) => {
                    const isSelected = newEventColor === color.value;
                    const needsBorder = color.value === "#171717" || color.value === "#fafafa";
                    return (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewEventColor(color.value)}
                        className={`
                          w-5 h-5 rounded-full border transition-all
                          ${isSelected 
                            ? "ring-2 ring-white/50 scale-110" 
                            : "hover:scale-110"
                          }
                          ${needsBorder 
                            ? "border-neutral-500" 
                            : "border-transparent"
                          }
                        `}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreateEvent}
                  disabled={!newEventTitle.trim()}
                  className="
                    flex-1 px-4 py-2 bg-white text-black rounded-lg
                    text-sm font-medium
                    hover:bg-neutral-200 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  Save Event
                </button>
                <button
                  onClick={handleCancelNewEvent}
                  className="
                    px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg
                    text-sm font-medium
                    hover:bg-neutral-700 transition-colors
                  "
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}





