"use client";

import { useEffect, useState } from "react";

export default function ParentDetailsPage() {
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadParent() {
      try {
        // Existing Parent Profile API will be connected later.
        setParent(null);
      } catch (error) {
        console.error("Failed to load parent:", error);
      } finally {
        setLoading(false);
      }
    }

    loadParent();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md">
          <p className="text-sm text-gray-500">Loading parent details...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md">
        <h1 className="mb-5 text-2xl font-bold text-gray-900">
          Parent Details
        </h1>

        {!parent ? (
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Parent details will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              ["Name", parent.fullName],
              ["Age", parent.age],
              ["Blood Group", parent.bloodGroup],
              ["Date of Birth", parent.dateOfBirth],
              ["Phone", parent.phone],
              ["Address", parent.address],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl bg-white p-4 shadow-sm"
              >
                <p className="text-xs text-gray-500">{label}</p>
                <p className="mt-1 font-medium text-gray-900">
                  {value || "N/A"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
