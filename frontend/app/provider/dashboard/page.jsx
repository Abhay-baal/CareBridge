"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getProviderBookings,
  updateBookingStatus,
  getProviderProfile,
  updateProviderAvailability,
} from "@/services/providerBookingService";

const STATUS_CLASSES = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  accepted: "border-green-200 bg-green-50 text-green-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  cancelled: "border-gray-200 bg-gray-100 text-gray-600",
  completed: "border-blue-200 bg-blue-50 text-blue-700",
};

const STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
  completed: "Completed",
};

export default function ProviderDashboardPage() {
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [bookingResponse, profileResponse] = await Promise.all([
        getProviderBookings(),
        getProviderProfile(),
      ]);

      setBookings(
        Array.isArray(bookingResponse?.data)
          ? bookingResponse.data
          : []
      );

      setProfile(profileResponse?.data || null);
    } catch (err) {
      console.error("Provider dashboard error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load provider dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const changeStatus = async (bookingId, status) => {
    if (updating) return;

    if (
      status === "rejected" &&
      !window.confirm("Reject this care request?")
    ) {
      return;
    }

    try {
      setUpdating(bookingId);
      setError("");

      const response = await updateBookingStatus(
        bookingId,
        status
      );

      const updatedBooking = response?.data;

      setBookings((current) =>
        current.map((booking) =>
          booking._id === bookingId
            ? updatedBooking || { ...booking, status }
            : booking
        )
      );
    } catch (err) {
      console.error("Booking status error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to update booking."
      );
    } finally {
      setUpdating("");
    }
  };

  const toggleAvailability = async () => {
    if (!profile || availabilityLoading) return;

    try {
      setAvailabilityLoading(true);
      setError("");

      const nextAvailability = !profile.availability;

      const response = await updateProviderAvailability(
        nextAvailability
      );

      setProfile((current) => ({
        ...current,
        availability:
          response?.data?.availability ?? nextAvailability,
      }));
    } catch (err) {
      console.error("Availability error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to update availability."
      );
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const pending = bookings.filter(
    (booking) => booking.status === "pending"
  ).length;

  const accepted = bookings.filter(
    (booking) => booking.status === "accepted"
  ).length;

  const completed = bookings.filter(
    (booking) => booking.status === "completed"
  ).length;

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Date unavailable";
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getChildName = (booking) => {
    return (
      booking.child?.fullName ||
      booking.child?.name ||
      "Child"
    );
  };

  const getParentName = (booking) => {
    return (
      booking.parent?.user?.fullName ||
      booking.parent?.fullName ||
      "Parent"
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="h-32 animate-pulse rounded-2xl bg-gray-200" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-24 animate-pulse rounded-2xl bg-gray-200" />
            <div className="h-24 animate-pulse rounded-2xl bg-gray-200" />
            <div className="h-24 animate-pulse rounded-2xl bg-gray-200" />
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-gray-200" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="text-sm font-medium text-blue-600">
                CareBridge Provider
              </p>

              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                Welcome, {profile?.name || "Provider"}
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your care requests and availability.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleAvailability}
              disabled={availabilityLoading}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                profile?.availability
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-600"
              } disabled:opacity-50`}
            >
              {profile?.availability
                ? "🟢 Available"
                : "⚪ Unavailable"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Pending Requests</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {pending}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Accepted</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {accepted}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {completed}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Pending Requests
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Review incoming care requests.
            </p>
          </div>

          <Link
            href="/provider/bookings"
            className="text-sm font-semibold text-blue-600"
          >
            View All
          </Link>
        </div>

        <div className="mt-4 space-y-4">
          {bookings.filter(
            (booking) => booking.status === "pending"
          ).length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <div className="text-4xl">📋</div>
              <h3 className="mt-3 font-semibold text-gray-900">
                No pending requests
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                New care requests will appear here.
              </p>
            </div>
          ) : (
            bookings
              .filter(
                (booking) => booking.status === "pending"
              )
              .slice(0, 5)
              .map((booking) => (
                <article
                  key={booking._id}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-base font-bold text-gray-900">
                          {booking.service}
                        </h3>

                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                          Pending
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-gray-600">
                        <p>
                          <strong className="text-gray-900">
                            Parent:
                          </strong>{" "}
                          {getParentName(booking)}
                        </p>

                        <p>
                          <strong className="text-gray-900">
                            Child:
                          </strong>{" "}
                          {getChildName(booking)}
                        </p>

                        <p>
                          <strong className="text-gray-900">
                            Date:
                          </strong>{" "}
                          {formatDate(booking.date)}
                        </p>

                        <p>
                          <strong className="text-gray-900">
                            Time:
                          </strong>{" "}
                          {booking.time || "Time unavailable"}
                        </p>

                        {booking.notes && (
                          <p className="break-words">
                            <strong className="text-gray-900">
                              Notes:
                            </strong>{" "}
                            {booking.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          changeStatus(
                            booking._id,
                            "accepted"
                          )
                        }
                        disabled={updating === booking._id}
                        className="min-h-11 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {updating === booking._id
                          ? "..."
                          : "Accept"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          changeStatus(
                            booking._id,
                            "rejected"
                          )
                        }
                        disabled={updating === booking._id}
                        className="min-h-11 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </article>
              ))
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-900">
                My Profile
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {profile?.experience || 0} years experience
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
            <Link
              href="/provider/profile"
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
            >
              Edit Profile
            </Link>

            <Link
              href="/provider/bookings"
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
            >
              Booking History
            </Link>
          </div>
          </div>

          {profile?.bio && (
            <p className="mt-4 text-sm leading-6 text-gray-600">
              {profile.bio}
            </p>
          )}

          {Array.isArray(profile?.services) &&
            profile.services.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.services.map((service) => (
                  <span
                    key={service}
                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                  >
                    {service}
                  </span>
                ))}
              </div>
            )}
        </div>

      </div>
    </main>
  );
}
