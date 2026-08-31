/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

import WelcomeHeader from "@/components/child/WelcomeHeader";
import LoadingState from "@/components/ui/LoadingState";
import FamilyCommunication from "@/components/dashboard/FamilyCommunication";

import { getChildDashboard } from "@/services/childService";

export default function ChildDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setError("");
      setLoading(true);

      const response = await getChildDashboard();

      setData(response.data);
    } catch (err) {
      console.error("Child dashboard error:", err);

      if (
        err.response?.data?.message
          ?.toLowerCase()
          .includes("no active parent")
      ) {
        setData({
          parent: null,
          carePlans: [],
          appointments: [],
        });
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load child dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-md p-4">
        <LoadingState message="Loading child dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md p-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h1 className="font-semibold text-red-600">
            Unable to load dashboard
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {error}
          </p>

          <button
            onClick={loadDashboard}
            className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const parent = data?.parent;

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <WelcomeHeader
        parentName={parent?.user?.fullName}
        showFamilyShortcut
      />

      <FamilyCommunication />

    </div>
  );
}
