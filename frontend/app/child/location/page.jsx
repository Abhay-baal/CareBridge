"use client";

import { useEffect, useState } from "react";
import { getParentLocation } from "@/services/childService";

export default function ChildLocationPage() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const response = await getParentLocation();

        setLocation(response.data);
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message ||
            "Failed to load parent location"
        );
      } finally {
        setLoading(false);
      }
    };

    loadLocation();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md">
          <p className="text-sm text-gray-500">
            Loading location...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="font-medium text-red-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold text-gray-900">
          Parent Location
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Current parent location.
        </p>

        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-500">
              Parent
            </p>

            <p className="mt-2 font-medium text-gray-900">
              {location?.parentName || "N/A"}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-500">
              Current Address
            </p>

            <p className="mt-2 font-medium text-gray-900">
              {location?.address || "N/A"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">
                Latitude
              </p>

              <p className="mt-2 font-medium text-gray-900">
                {location?.latitude ?? "N/A"}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">
                Longitude
              </p>

              <p className="mt-2 font-medium text-gray-900">
                {location?.longitude ?? "N/A"}
              </p>
            </div>
          </div>

          <a
            href={`tel:${location?.phone || ""}`}
            className="block rounded-2xl bg-blue-600 p-4 text-center font-medium text-white"
          >
            Call Parent
          </a>
        </div>
      </div>
    </main>
  );
}
