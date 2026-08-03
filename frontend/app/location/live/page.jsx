"use client";

import { useEffect, useRef, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const getToken = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null;

const apiRequest = async (url, options = {}) => {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Request failed"
    );
  }

  return data;
};

export default function LiveLocationPage() {
  const [location, setLocation] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const watchId = useRef(null);

  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("role")
      : null;

  const fetchLocation = async () => {
    try {
      const result = await apiRequest(
        "/location"
      );

      setLocation(result.data);
      setSharing(result.data?.isSharing || false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();

    const interval = setInterval(
      fetchLocation,
      5000
    );

    return () => {
      clearInterval(interval);

      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(
          watchId.current
        );
      }
    };
  }, []);

  const sendPosition = async (
    position,
    endpoint
  ) => {
    const payload = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };

    await apiRequest(endpoint, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    setLocation((prev) => ({
      ...(prev || {}),
      ...payload,
      isSharing: true,
      updatedAt: new Date().toISOString(),
    }));

    setSharing(true);
  };

  const startSharing = () => {
    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    setBusy(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await sendPosition(
            position,
            "/location/start"
          );

          watchId.current =
            navigator.geolocation.watchPosition(
              async (updatedPosition) => {
                try {
                  await sendPosition(
                    updatedPosition,
                    "/location/update"
                  );
                } catch (err) {
                  console.error(err);
                }
              },
              (err) => {
                console.error(err);
              },
              {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 10000,
              }
            );
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      },
      (err) => {
        setBusy(false);

        if (err.code === 1) {
          setError(
            "Location permission was denied."
          );
        } else {
          setError(
            "Unable to get your current location."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const stopSharing = async () => {
    try {
      setBusy(true);

      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(
          watchId.current
        );

        watchId.current = null;
      }

      await apiRequest("/location/stop", {
        method: "PATCH",
      });

      setSharing(false);

      setLocation((prev) => ({
        ...(prev || {}),
        isSharing: false,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openMaps = () => {
    if (
      !location?.latitude ||
      !location?.longitude
    ) {
      return;
    }

    const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-600">
            CareBridge
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Live Location
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {role === "parent"
              ? "Share your location with your connected child."
              : "View your parent's shared location."}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex h-80 items-center justify-center bg-gray-100">
            {location?.latitude &&
            location?.longitude ? (
              <div className="text-center">
                <div className="mb-4 text-6xl">
                  📍
                </div>

                <p className="font-semibold text-gray-900">
                  {location.parentName ||
                    "Current Location"}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  {location.latitude.toFixed(6)}
                  {" , "}
                  {location.longitude.toFixed(6)}
                </p>

                {location.accuracy && (
                  <p className="mt-1 text-xs text-gray-400">
                    Accuracy: ±
                    {Math.round(location.accuracy)}
                    m
                  </p>
                )}

                <button
                  onClick={openMaps}
                  className="mt-4 rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white"
                >
                  Open in Google Maps
                </button>
              </div>
            ) : (
              <div className="px-6 text-center">
                <div className="mb-3 text-5xl">
                  📍
                </div>

                <p className="font-medium text-gray-800">
                  No location available
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Location will appear here when sharing starts.
                </p>
              </div>
            )}
          </div>

          <div className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Sharing Status
                </p>

                <p
                  className={`mt-1 text-sm ${
                    sharing
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {sharing
                    ? "● Location sharing is active"
                    : "○ Location sharing is off"}
                </p>
              </div>

              {location?.updatedAt && (
                <p className="text-xs text-gray-400">
                  Updated{" "}
                  {new Date(
                    location.updatedAt
                  ).toLocaleTimeString()}
                </p>
              )}
            </div>

            {role === "parent" && (
              <div className="flex gap-3">
                {!sharing ? (
                  <button
                    onClick={startSharing}
                    disabled={busy}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white disabled:opacity-50"
                  >
                    {busy
                      ? "Getting location..."
                      : "Start Sharing"}
                  </button>
                ) : (
                  <button
                    onClick={stopSharing}
                    disabled={busy}
                    className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-medium text-white disabled:opacity-50"
                  >
                    {busy
                      ? "Stopping..."
                      : "Stop Sharing"}
                  </button>
                )}

                <button
                  onClick={fetchLocation}
                  disabled={loading}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700"
                >
                  Refresh
                </button>
              </div>
            )}

            {role === "child" && (
              <button
                onClick={fetchLocation}
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700"
              >
                Refresh Location
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-blue-50 p-4 text-xs leading-5 text-blue-700">
          Location sharing only works when browser
          permission is granted. Your location is sent
          to CareBridge only while sharing is enabled.
        </div>
      </div>
    </main>
  );
}
