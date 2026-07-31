"use client";

import { useEffect, useState } from "react";
import { getChildDashboard } from "@/services/childService";

export default function ParentDetailsPage() {
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadParent = async () => {
      try {
        const response = await getChildDashboard();
        setParent(response.data?.parent);
      } catch (error) {
        console.error(error);
        setError(
          error.response?.data?.message ||
            "Failed to load parent details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadParent();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 pb-24">
        <div className="mx-auto max-w-md">
          <p className="text-sm text-gray-500">
            Loading parent details...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 pb-24">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="font-medium text-red-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  const user = parent?.user;

  const calculateAge = (dob) => {
    if (!dob) return "N/A";

    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();

    if (
      month < 0 ||
      (month === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="mx-auto max-w-md">
        <h1 className="mb-5 text-2xl font-bold text-gray-900">
          Parent Details
        </h1>

        <div className="space-y-3">
          {[
            ["Name", user?.fullName],
            ["Age", calculateAge(parent?.dateOfBirth)],
            ["Blood Group", parent?.bloodGroup],
            [
              "Date of Birth",
              parent?.dateOfBirth
                ? new Date(parent.dateOfBirth).toLocaleDateString()
                : null,
            ],
            ["Phone", user?.phone],
            ["Email", user?.email],
            ["Address", parent?.address],
            ["Emergency Contact", parent?.emergencyContact],
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
      </div>
    </main>
  );
}
