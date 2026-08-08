"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ChildProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Unable to load child profile:", error);
    }
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-28 pt-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-600">
            CareBridge
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            My Profile
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            View your CareBridge account information.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
              {user?.fullName?.charAt(0)?.toUpperCase() || "C"}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {user?.fullName || "Child"}
              </h2>

              <p className="text-sm text-gray-500">
                Child Account
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Full Name
              </p>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {user?.fullName || "Not available"}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Email
              </p>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {user?.email || "Not available"}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Role
              </p>

              <p className="mt-1 text-sm font-medium capitalize text-gray-900">
                {user?.role || "child"}
              </p>
            </div>
          </div>

          <Link
            href="/child/dashboard"
            className="mt-6 block w-full rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
