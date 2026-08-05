"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ParentProfileForm from "@/components/profile/ParentProfileForm";

export default function ProfilePage() {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLoggingOut(true);

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Parent Profile
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          View and update your parent&apos;s information.
        </p>
      </div>

      <ParentProfileForm />

      <div className="mt-8 border-t pt-6">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </AppLayout>
  );
}
