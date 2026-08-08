/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

import { getCaregivers } from "@/services/caregiverService";
import CaregiverCard from "@/components/caregivers/CaregiverCard";
import CaregiverEmptyState from "@/components/caregivers/CaregiverEmptyState";
import LoadingState from "@/components/ui/LoadingState";

export default function CaregiversPage() {
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCaregivers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getCaregivers();

      setCaregivers(response.data || []);
    } catch (err) {
      console.error("Caregiver marketplace error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load caregivers right now."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaregivers();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 pb-28 pt-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <div className="h-7 w-48 animate-pulse rounded-lg bg-gray-200" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded bg-gray-200" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-64 animate-pulse rounded-2xl bg-gray-200"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 pb-28 pt-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-red-100 bg-white p-6 text-center">
            <div className="text-3xl">⚠️</div>

            <h1 className="mt-3 text-lg font-semibold text-gray-900">
              Unable to load caregivers
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {error}
            </p>

            <button
              type="button"
              onClick={loadCaregivers}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-28 pt-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-600">
            CareBridge
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Find a Caregiver
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Find trusted care providers who are currently available.
          </p>
        </div>

        {caregivers.length === 0 ? (
          <CaregiverEmptyState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {caregivers.map((caregiver) => (
              <CaregiverCard
                key={caregiver._id}
                caregiver={caregiver}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
