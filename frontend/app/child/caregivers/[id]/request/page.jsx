"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { getCaregiverById } from "@/services/caregiverService";
import { getParents } from "@/services/parentChildService";
import { createBooking } from "@/services/bookingService";

export default function RequestCarePage() {
  const params = useParams();
  const router = useRouter();

  const [caregiver, setCaregiver] = useState(null);
  const [parents, setParents] = useState([]);

  const [parent, setParent] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBookingData = async () => {
      try {
        setLoading(true);
        setError("");

        const [providerResponse, parentsResponse] = await Promise.all([
          getCaregiverById(params.id),
          getParents(),
        ]);

        setCaregiver(providerResponse.data);

        const parentData = Array.isArray(parentsResponse?.data)
          ? parentsResponse.data
          : Array.isArray(parentsResponse)
            ? parentsResponse
            : [];

        setParents(parentData);
      } catch (err) {
        console.error("Request care load error:", err);

        if (err.response?.status === 401) {
          setError("Your session has expired. Please log in again.");
        } else {
          setError(
            err.response?.data?.message ||
              "Unable to load booking information."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadBookingData();
    }
  }, [params.id]);

  const getParentId = (item) => {
    return (
      item.parent?._id ||
      item.parent?.id ||
      item.parentId ||
      item._id ||
      ""
    );
  };

  const getParentName = (item) => {
    return (
      item.parent?.user?.fullName ||
      item.parent?.fullName ||
      item.user?.fullName ||
      item.fullName ||
      "Parent"
    );
  };

  const todayString = new Date().toISOString().split("T")[0];

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    if (!parent) {
      setError("Please select a parent.");
      return;
    }

    if (!service) {
      setError("Please select a service.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    if (!time) {
      setError("Please select a time.");
      return;
    }

    if (date < todayString) {
      setError("Please select today or a future date.");
      return;
    }

    if (!caregiver?._id) {
      setError("Provider information is unavailable.");
      return;
    }

    if (
      caregiver.status &&
      caregiver.status !== "active"
    ) {
      setError("This provider is currently inactive.");
      return;
    }

    if (caregiver.availability !== true) {
      setError("This provider is currently unavailable.");
      return;
    }

    const providerServices = Array.isArray(caregiver.services)
      ? caregiver.services
      : [];

    const serviceExists = providerServices.some(
      (providerService) =>
        providerService.toLowerCase() === service.toLowerCase()
    );

    if (!serviceExists) {
      setError("The selected service is no longer available.");
      return;
    }

    try {
      setSubmitting(true);

      await createBooking({
        parent,
        provider: caregiver._id,
        service: service.trim(),
        date,
        time,
        notes: notes.trim(),
      });

      router.push("/child/bookings?created=1");
    } catch (err) {
      console.error("Create booking error:", err);

      const status = err.response?.status;
      const message = err.response?.data?.message;

      if (status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (status === 403) {
        setError(
          message ||
            "You are not authorized to request care for this parent."
        );
      } else if (status === 404) {
        setError(
          message ||
            "The selected parent or provider could not be found."
        );
      } else if (status === 400) {
        setError(
          message ||
            "Please check your booking details and try again."
        );
      } else if (!err.response) {
        setError(
          "Unable to connect to the server. Please check your connection."
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-xl">
          <div className="animate-pulse">
            <div className="h-5 w-32 rounded bg-gray-200" />

            <div className="mt-5 h-10 w-48 rounded bg-gray-200" />

            <div className="mt-5 h-28 rounded-2xl bg-gray-200" />

            <div className="mt-5 h-[500px] rounded-2xl bg-gray-200" />
          </div>
        </div>
      </main>
    );
  }

  if (!caregiver || error) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-xl">
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <div className="text-4xl">⚠️</div>

            <h1 className="mt-4 text-xl font-bold text-gray-900">
              Unable to Request Care
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              {error || "Provider information could not be loaded."}
            </p>

            <Link
              href="/child/caregivers"
              className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
            >
              Back to Caregivers
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const providerUnavailable =
    caregiver.availability !== true ||
    (caregiver.status && caregiver.status !== "active");

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-5 pb-10">
      <div className="mx-auto max-w-xl">
        <Link
          href={`/child/caregivers/${params.id}`}
          className="text-sm font-medium text-blue-600"
        >
          ← Back to Provider
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Request Care
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Send a care request to this provider.
          </p>
        </div>

        {/* Provider Information */}
        <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                Care Provider
              </p>

              <h2 className="mt-1 text-lg font-bold text-gray-900">
                {caregiver.name}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {caregiver.experience || 0} years of experience
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                providerUnavailable
                  ? "bg-gray-100 text-gray-600"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {providerUnavailable ? "Unavailable" : "Available"}
            </span>
          </div>
        </section>

        {/* Booking Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-5 rounded-2xl bg-white p-5 shadow-sm"
        >
          {/* Parent */}
          <div>
            <label className="text-sm font-semibold text-gray-900">
              Select Parent
            </label>

            <p className="mt-1 text-xs text-gray-500">
              Choose the connected parent who needs care.
            </p>

            {parents.length === 0 ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800">
                  No connected parents found.
                </p>

                <Link
                  href="/family"
                  className="mt-2 inline-block text-sm font-semibold text-blue-600"
                >
                  Manage Parents →
                </Link>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {parents.map((item, index) => {
                  const parentId = getParentId(item);
                  const parentName = getParentName(item);

                  if (!parentId) {
                    return null;
                  }

                  return (
                    <label
                      key={parentId || index}
                      className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                        parent === parentId
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="parent"
                        value={parentId}
                        checked={parent === parentId}
                        onChange={(event) =>
                          setParent(event.target.value)
                        }
                        className="h-4 w-4"
                      />

                      <span className="text-sm font-semibold text-gray-900">
                        {parentName}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Service */}
          <div className="mt-6">
            <label
              htmlFor="service"
              className="text-sm font-semibold text-gray-900"
            >
              Select Service
            </label>

            <select
              id="service"
              value={service}
              onChange={(event) => setService(event.target.value)}
              disabled={providerUnavailable}
              className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            >
              <option value="">Choose a service</option>

              {(caregiver.services || []).map((providerService) => (
                <option
                  key={providerService}
                  value={providerService}
                >
                  {providerService}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="mt-6">
            <label
              htmlFor="date"
              className="text-sm font-semibold text-gray-900"
            >
              Select Date
            </label>

            <input
              id="date"
              type="date"
              min={todayString}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={providerUnavailable}
              required
              className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            />
          </div>

          {/* Time */}
          <div className="mt-6">
            <label
              htmlFor="time"
              className="text-sm font-semibold text-gray-900"
            >
              Select Time
            </label>

            <input
              id="time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              disabled={providerUnavailable}
              required
              className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            />
          </div>

          {/* Notes */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <label
                htmlFor="notes"
                className="text-sm font-semibold text-gray-900"
              >
                Additional Notes
              </label>

              <span className="text-xs text-gray-400">
                Optional
              </span>
            </div>

            <textarea
              id="notes"
              rows={4}
              maxLength={1000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Please share any additional information..."
              disabled={providerUnavailable}
              className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            />

            <p className="mt-1 text-right text-xs text-gray-400">
              {notes.length}/1000
            </p>
          </div>

          {/* Error */}
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

          {/* Submit */}
          <button
            type="submit"
            disabled={
              submitting ||
              parents.length === 0 ||
              providerUnavailable
            }
            className="mt-6 min-h-12 w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {submitting
              ? "Creating Booking..."
              : "Confirm Booking"}
          </button>
        </form>
      </div>
    </main>
  );
}
