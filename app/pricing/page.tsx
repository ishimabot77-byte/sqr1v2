"use client";

import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-amber-500/10 rounded-2xl">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-semibold text-white mb-3">
          SQR1 Pricing
        </h1>
        <p className="text-amber-400 text-lg font-medium mb-6">
          Coming Soon
        </p>

        {/* Description */}
        <p className="text-neutral-400 leading-relaxed mb-8">
          You&#39;ve found the upgrade page. Paid plans with unlimited checklist items
          and more are coming soon.
        </p>

        {/* Features Preview */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-8 text-left">
          <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-wider mb-4">
            Pro Features
          </h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-neutral-400">
              <span className="w-5 h-5 bg-amber-500/20 rounded flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <path d="M2 6L5 9L10 3" />
                </svg>
              </span>
              Unlimited checklist items
            </li>
            <li className="flex items-center gap-3 text-neutral-400">
              <span className="w-5 h-5 bg-amber-500/20 rounded flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <path d="M2 6L5 9L10 3" />
                </svg>
              </span>
              Unlimited projects
            </li>
            <li className="flex items-center gap-3 text-neutral-400">
              <span className="w-5 h-5 bg-amber-500/20 rounded flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <path d="M2 6L5 9L10 3" />
                </svg>
              </span>
              Cloud sync & backup
            </li>
            <li className="flex items-center gap-3 text-neutral-400">
              <span className="w-5 h-5 bg-amber-500/20 rounded flex items-center justify-center flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#f59e0b" strokeWidth="2">
                  <path d="M2 6L5 9L10 3" />
                </svg>
              </span>
              Priority support
            </li>
          </ul>
        </div>

        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M10 12L6 8L10 4" />
          </svg>
          Back to projects
        </Link>
      </div>
    </div>
  );
}


