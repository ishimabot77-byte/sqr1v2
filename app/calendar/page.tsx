"use client";

import { useEffect } from "react";
import Link from "next/link";
import Calendar from "@/components/Calendar";
import { resetMobileViewportZoom } from "@/lib/mobileUtils";

export default function CalendarPage() {
  // Reset viewport zoom on page mount (clears any zoom from previous page)
  useEffect(() => {
    resetMobileViewportZoom();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">SQR1</h1>
              <p className="text-neutral-500 mt-1">Your notes, organized.</p>
            </div>

            {/* Nav Tabs */}
            <nav className="flex gap-2">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-md text-sm bg-neutral-900 text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                Projects
              </Link>
              <Link
                href="/calendar"
                className="px-3 py-1.5 rounded-md text-sm bg-neutral-800 text-neutral-100"
              >
                Calendar
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content - Global Calendar */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Calendar />
      </main>
    </div>
  );
}





