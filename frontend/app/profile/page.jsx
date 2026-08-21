"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import AppLayout from "@/components/layout/AppLayout";
import ParentProfileForm from "@/components/profile/ParentProfileForm";
import { getConnectionCode } from "@/services/parentService";

export default function ProfilePage() {
  const [loggingOut, setLoggingOut] = useState(false);

  const [connectionCode, setConnectionCode] = useState("");
  const [connectionCodeLoading, setConnectionCodeLoading] =
    useState(true);

  useEffect(() => {
    const loadConnectionCode = async () => {
      try {
        setConnectionCodeLoading(true);

        const response = await getConnectionCode();

        setConnectionCode(
          response.data?.connectionCode || ""
        );
      } catch (error) {
        console.error(
          "Failed to load connection code:",
          error
        );

        toast.error(
          error.response?.data?.message ||
            "Unable to load connection code."
        );
      } finally {
        setConnectionCodeLoading(false);
      }
    };

    loadConnectionCode();
  }, []);

  const copyConnectionCode = async () => {
    if (!connectionCode) return;

    try {
      await navigator.clipboard.writeText(connectionCode);

      toast.success("Connection code copied!");
    } catch (error) {
      console.error(
        "Failed to copy connection code:",
        error
      );

      toast.error("Unable to copy connection code.");
    }
  };

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

      <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
            🔗
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-gray-900">
              Connect Your Child
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Give this connection code to your child
              when they create their CareBridge account.
            </p>

            {connectionCodeLoading ? (
              <div className="mt-4 h-12 animate-pulse rounded-xl bg-white" />
            ) : connectionCode ? (
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-blue-100 bg-white px-4 py-3">
                  <p className="text-xs font-medium text-gray-500">
                    Your Connection Code
                  </p>

                  <p className="mt-1 font-mono text-lg font-bold tracking-wider text-blue-700">
                    {connectionCode}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={copyConnectionCode}
                  className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-[0.98]"
                >
                  Copy
                </button>
              </div>
            ) : (
              <p className="mt-3 text-sm text-red-500">
                Unable to load your connection code.
              </p>
            )}
          </div>
        </div>
      </section>

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
