/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { getCaregiverById } from "@/services/caregiverService";

export default function CaregiverProfilePage() {
  const params = useParams();

  const [caregiver, setCaregiver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCaregiver = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getCaregiverById(params.id);

      setCaregiver(response.data);
    } catch (err) {
      console.error("Caregiver profile error:", err);

      if (err.response?.status === 404) {
        setError("Caregiver not found.");
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to load caregiver profile."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      loadCaregiver();
    }
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 pb-28 pt-6">
        <div className="mx-auto max-w-2xl">
          <div className="animate-pulse rounded-2xl bg-white p-6 shadow-sm">
            <div className="h-8 w-48 rounded bg-gray-200" />
            <div className="mt-3 h-4 w-32 rounded bg-gray-200" />
            <div className="mt-8 h-4 w-full rounded bg-gray-200" />
            <div className="mt-2 h-4 w-5/6 rounded bg-gray-200" />
            <div className="mt-8 h-12 w-full rounded-xl bg-gray-200" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !caregiver) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 pb-28 pt-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <div className="text-4xl">🔍</div>

            <h1 className="mt-4 text-xl font-semibold text-gray-900">
              {error || "Caregiver not found"}
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              This caregiver may no longer be available.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={loadCaregiver}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white"
              >
                Try Again
              </button>

              <Link
                href="/child/caregivers"
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700"
              >
                Back to Caregivers
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const isAvailable = caregiver.availability === true;

  return (
    <main className="min-h-screen bg-gray-50 px-4 pb-28 pt-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/child/caregivers"
          className="text-sm font-medium text-blue-600"
        >
          ← Back to Caregivers
        </Link>

        <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {caregiver.name}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                {caregiver.experience || 0} years of experience
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                isAvailable
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>

          <section className="mt-8">
            <h2 className="text-base font-semibold text-gray-900">
              About
            </h2>

            <p className="mt-2 text-sm leading-7 text-gray-600">
              {caregiver.bio || "No bio has been provided yet."}
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-base font-semibold text-gray-900">
              Services
            </h2>

            {caregiver.services?.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {caregiver.services.map((service) => (
                  <span
                    key={service}
                    className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700"
                  >
                    {service}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                No services listed.
              </p>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-base font-semibold text-gray-900">
              Availability
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              {isAvailable
                ? "This caregiver is currently accepting care requests."
                : "This caregiver is currently unavailable for new requests."}
            </p>
          </section>

          <button
            type="button"
            disabled={!isAvailable}
            className={`mt-8 w-full rounded-xl px-5 py-3.5 text-sm font-semibold text-white ${
              isAvailable
                ? "bg-blue-600 hover:bg-blue-700"
                : "cursor-not-allowed bg-gray-300"
            }`}
          >
            {isAvailable ? "Request Care" : "Currently Unavailable"}
          </button>
        </div>
      </div>
    </main>
  );
}
