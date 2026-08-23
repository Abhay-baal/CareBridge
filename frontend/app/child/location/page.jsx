"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { getParentLocation } from "@/services/childService";

const LiveMap = dynamic(
  () => import("@/components/location/LiveMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 items-center justify-center rounded-2xl bg-slate-100">
        <p className="text-sm text-gray-500">
          Loading map...
        </p>
      </div>
    ),
  }
);

const STALE_AFTER_MS = 2 * 60 * 1000;

export default function ChildLocationPage() {
  return null;

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  const loadLocation = useCallback(
    async (manual = false) => {
      try {
        if (manual) {
          setRefreshing(true);
        }

        const response = await getParentLocation();

        setLocation(response.data);
        setError("");
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.message ||
            "Failed to load parent location"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadLocation();

    const interval = setInterval(() => {
      loadLocation();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadLocation]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const updatedAt = location?.updatedAt
    ? new Date(location.updatedAt)
    : null;

  const ageMs = updatedAt
    ? now - updatedAt.getTime()
    : null;

  const isSharing = location?.isSharing === true;

  const hasCoordinates =
    typeof location?.latitude === "number" &&
    typeof location?.longitude === "number";

  const isStale =
    isSharing &&
    ageMs !== null &&
    ageMs > STALE_AFTER_MS;

  const accuracy =
    typeof location?.accuracy === "number"
      ? Math.round(location.accuracy)
      : null;

  const accuracyLabel =
    accuracy === null
      ? "Accuracy unavailable"
      : accuracy <= 20
        ? `Excellent • ±${accuracy}m`
        : accuracy <= 50
          ? `Good • ±${accuracy}m`
          : accuracy <= 100
            ? `Approximate • ±${accuracy}m`
            : `Low accuracy • ±${accuracy}m`;

  let status;

  if (!isSharing) {
    status = {
      title: "Location sharing stopped",
      description:
        "Your parent is not currently sharing their location.",
      className:
        "border-gray-200 bg-gray-50 text-gray-700",
      icon: "○",
    };
  } else if (isStale) {
    status = {
      title: "Location may be outdated",
      description:
        "The parent is sharing, but no recent GPS update has been received.",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
      icon: "!",
    };
  } else {
    status = {
      title: "Parent location is live",
      description:
        "Showing the latest location received from your parent.",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: "●",
    };
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <p className="text-sm font-semibold text-blue-600">
            CareBridge
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Parent Location
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            See your parent's current shared location.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-blue-100" />

            <p className="mt-4 font-medium text-gray-800">
              Loading parent location...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 overflow-hidden rounded-3xl bg-white shadow-sm">
              <LiveMap
                latitude={location?.latitude}
                longitude={location?.longitude}
                accuracy={location?.accuracy}
                parentName={
                  location?.parentName || "Parent"
                }
              />
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div
                className={`flex items-start gap-3 rounded-2xl border p-4 ${status.className}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white font-bold shadow-sm">
                  {status.icon}
                </div>

                <div>
                  <p className="font-semibold">
                    {status.title}
                  </p>

                  <p className="mt-1 text-sm opacity-80">
                    {status.description}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Parent
                  </p>

                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {location?.parentName || "Parent"}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl">
                  📍
                </div>
              </div>

              {hasCoordinates && (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-gray-500">
                      GPS accuracy
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {accuracyLabel}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs text-gray-500">
                      Last updated
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {updatedAt
                        ? updatedAt.toLocaleTimeString()
                        : "Unavailable"}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-2xl bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-blue-900">
                    Live connection
                  </p>

                  <span
                    className={`text-xs font-semibold ${
                      !isSharing
                        ? "text-gray-500"
                        : isStale
                          ? "text-amber-600"
                          : "text-emerald-600"
                    }`}
                  >
                    {!isSharing
                      ? "Not sharing"
                      : isStale
                        ? "Waiting for update"
                        : "Connected"}
                  </span>
                </div>

                <p className="mt-1 text-xs leading-5 text-blue-700">
                  This page checks for your parent's
                  latest location every 5 seconds.
                </p>
              </div>

              <button
                onClick={() => loadLocation(true)}
                disabled={refreshing}
                className="mt-5 w-full rounded-2xl border border-gray-200 bg-white px-5 py-3 font-semibold text-gray-700 disabled:opacity-50"
              >
                {refreshing
                  ? "Refreshing..."
                  : "Refresh Location"}
              </button>

              {location?.phone && (
                <a
                  href={`tel:${location.phone}`}
                  className="mt-3 block w-full rounded-2xl bg-blue-600 px-5 py-3 text-center font-semibold text-white"
                >
                  Call Parent
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
