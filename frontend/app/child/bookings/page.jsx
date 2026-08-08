"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  getBookings,
  cancelBooking,
} from "@/services/bookingService";

const STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
  completed: "Completed",
};

const STATUS_CLASSES = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  accepted: "border-green-200 bg-green-50 text-green-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  cancelled: "border-gray-200 bg-gray-100 text-gray-600",
  completed: "border-blue-200 bg-blue-50 text-blue-700",
};

export default function ChildBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState("");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getBookings();

      const data = Array.isArray(response?.data)
        ? response.data
        : [];

      setBookings(data);
    } catch (err) {
      console.error("Bookings error:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(
          err.response?.data?.message ||
            "Unable to load your bookings."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    if (cancelling) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancelling(bookingId);
      setError("");

      const response = await cancelBooking(bookingId);
      const updatedBooking = response?.data;

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking._id === bookingId
            ? updatedBooking || {
                ...booking,
                status: "cancelled",
              }
            : booking
        )
      );
    } catch (err) {
      console.error("Cancel booking error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to cancel this booking."
      );
    } finally {
      setCancelling("");
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "Date unavailable";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) {
      return "Time unavailable";
    }

    const parts = time.split(":");

    if (parts.length < 2) {
      return time;
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return time;
    }

    const date = new Date();

    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getParentName = (booking) => {
    return (
      booking.parent?.user?.fullName ||
      booking.parent?.fullName ||
      "Parent"
    );
  };

  const getProviderName = (booking) => {
    return booking.provider?.name || "Care Provider";
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <Link
          href="/child/caregivers"
          className="text-sm font-medium text-blue-600"
        >
          ← Caregivers
        </Link>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              My Bookings
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Track your care requests.
            </p>
          </div>

          <button
            type="button"
            onClick={loadBookings}
            disabled={loading}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {showSuccess && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">
            <p className="font-semibold text-green-800">
              🎉 Care Request Sent
            </p>

            <p className="mt-1 text-sm text-green-700">
              Your request has been sent to the care provider.
            </p>

            <p className="mt-1 text-sm font-medium text-green-700">
              Status: Pending
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="mt-6 space-y-4">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl bg-gray-200"
              />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="text-4xl">📋</div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              No bookings yet
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Find a caregiver and send your first care request.
            </p>

            <Link
              href="/child/caregivers"
              className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Find Caregivers
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {bookings.map((booking) => {
              const status = booking.status || "pending";

              const canCancel =
                status === "pending" ||
                status === "accepted";

              return (
                <article
                  key={booking._id}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="break-words text-base font-bold text-gray-900">
                        {booking.service}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Provider: {getProviderName(booking)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                        STATUS_CLASSES[status] ||
                        STATUS_CLASSES.pending
                      }`}
                    >
                      ●{" "}
                      {STATUS_LABELS[status] || status}
                    </span>
                  </div>

                  <div className="mt-5 space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-semibold text-gray-900">
                        Parent:
                      </span>{" "}
                      {getParentName(booking)}
                    </p>

                    <p>
                      <span className="font-semibold text-gray-900">
                        Date:
                      </span>{" "}
                      {formatDate(booking.date)}
                    </p>

                    <p>
                      <span className="font-semibold text-gray-900">
                        Time:
                      </span>{" "}
                      {formatTime(booking.time)}
                    </p>

                    {booking.notes && (
                      <p className="break-words">
                        <span className="font-semibold text-gray-900">
                          Notes:
                        </span>{" "}
                        {booking.notes}
                      </p>
                    )}
                  </div>

                  {canCancel && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCancel(booking._id)
                      }
                      disabled={
                        cancelling === booking._id
                      }
                      className="mt-5 min-h-11 w-full rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cancelling === booking._id
                        ? "Cancelling..."
                        : "Cancel Booking"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
