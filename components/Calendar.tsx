"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getEvents,
  getEventsForMonth,
  getEventsForDate,
  createEvent,
  deleteEvent,
  canCreateEvent,
  getYearMonth,
  countEventsInMonth,
  getProjects,
} from "@/lib/localStorage";
import { CalendarEvent, Project, MAX_EVENTS_PER_MONTH } from "@/lib/types";

interface CalendarProps {
  projectId?: string; // If provided, shows only events for this project
}

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

export default function Calendar({ projectId }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Event form state
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [newEventProjectId, setNewEventProjectId] = useState<string>("");

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const yearMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  // Load events and projects
  const refreshEvents = useCallback(() => {
    const monthEvents = getEventsForMonth(yearMonth, projectId);
    setEvents(monthEvents);
  }, [yearMonth, projectId]);

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

    const eventProjectId = projectId || (newEventProjectId || undefined);
    const result = createEvent(
      newEventTitle.trim(),
      selectedDate,
      newEventDescription.trim() || undefined,
      eventProjectId
    );

    if (result) {
      setNewEventTitle("");
      setNewEventDescription("");
      setNewEventProjectId("");
      refreshEvents();
    }
  };

  // Handle delete event
  const handleDeleteEvent = (eventId: string) => {
    deleteEvent(eventId);
    refreshEvents();
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
            <div className="space-y-2 mb-4">
              {selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between p-3 bg-neutral-800 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-100 truncate">
                      {event.title}
                    </p>
                    {event.description && (
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    {event.projectId && !projectId && (
                      <p className="text-xs text-blue-400 mt-1">
                        {getProjectName(event.projectId)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="p-1.5 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-700 transition-all ml-2 flex-shrink-0"
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
              ))}
            </div>
          )}

          {/* Create Event Form */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
              New Event
            </div>

            {!canCreateForSelectedDate ? (
              <div className="p-3 bg-neutral-800 border border-neutral-700 rounded-lg">
                <p className="text-sm text-amber-400">
                  You&apos;ve reached the free limit of {MAX_EVENTS_PER_MONTH} events for this month.
                </p>
                <button className="text-white text-sm hover:text-gray-300 font-medium mt-2 transition-colors">
                  Upgrade to add more →
                </button>
              </div>
            ) : (
              <>
                <input
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

                {/* Project selector - only show in global calendar */}
                {!projectId && (
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
                )}

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
                    onClick={() => {
                      setNewEventTitle("");
                      setNewEventDescription("");
                      setNewEventProjectId("");
                      setSelectedDate(null);
                    }}
                    className="
                      px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg
                      text-sm font-medium
                      hover:bg-neutral-700 transition-colors
                    "
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


