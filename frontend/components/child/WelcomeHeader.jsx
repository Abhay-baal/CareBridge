"use client";

import Link from "next/link";

export default function WelcomeHeader({
  parentName = "Parent",
  showFamilyShortcut = false,
}) {
  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-gray-500">Child Dashboard</p>

        {showFamilyShortcut && (
          <Link
            href="/family"
            aria-label="Open Family"
            className="group motion-press -mt-1 flex shrink-0 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm hover:border-gray-300 hover:shadow-md"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-lg transition group-hover:bg-gray-900 group-hover:text-white">
              🏡
            </span>

            <span className="text-xs font-black text-gray-900">
              Family
            </span>
          </Link>
        )}
      </div>

      <h1 className="text-2xl font-bold text-gray-900">
        Hello 👋
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Here’s an overview of {parentName}&apos;s health.
      </p>
    </div>
  );
}
