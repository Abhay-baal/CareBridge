"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
    throw new Error(data.message || "Request failed");
  }

  return data;
};

export default function LiveLocationPage() {
  const [location, setLocation] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [gpsStatus, setGpsStatus] = useState("");

  const watchId = useRef(null);
  const sendingRef = useRef(false);
  const mountedRef = useRef(false);

  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("role")
      : null;

  const fetchLocation = useCallback(async () => {
    try {
      const result = await apiRequest("/location");

      if (!mountedRef.current) return;

      setLocation(result.data);
      setSharing(Boolean(result.data?.isSharing));
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    fetchLocation();

    const interval = setInterval(() => {
      fetchLocation();
    }, 5000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);

      if (
        watchId.current !== null &&
        typeof navigator !== "undefined" &&
        navigator.geolocation
      ) {
        navigator.geolocation.clearWatch(
          watchId.current
        );

        watchId.current = null;
      }
    };
  }, [fetchLocation]);

  const sendPosition = useCallback(
    async (position, endpoint) => {
      if (sendingRef.current) {
        return;
      }

      sendingRef.current = true;

      try {
        const payload = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy:
            typeof position.coords.accuracy === "number"
              ? position.coords.accuracy
              : null,
        };

        const result = await apiRequest(endpoint, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        if (!mountedRef.current) return;

        const serverLocation = result.data || {};

        setLocation((prev) => ({
          ...(prev || {}),
          ...serverLocation,
          latitude: payload.latitude,
          longitude: payload.longitude,
          accuracy: payload.accuracy,
          isSharing: true,
          updatedAt:
            serverLocation.updatedAt ||
            new Date().toISOString(),
        }));

        setSharing(true);

        setGpsStatus(
          `GPS active • ±${Math.round(
            position.coords.accuracy || 0
          )}m`
        );
      } finally {
        sendingRef.current = false;
      }
    },
    []
  );

  const handleGpsError = useCallback((err) => {
    console.error("GPS error:", err);

    if (!mountedRef.current) return;

    switch (err.code) {
      case 1:
        setError(
          "Location permission was denied. Please allow Precise Location for CareBridge."
        );
        break;

      case 2:
        setError(
          "Your device could not determine the current location. Check GPS/location services."
        );
        break;

      case 3:
        setError(
          "GPS request timed out. Keep Location Services enabled and try again."
        );
        break;

      default:
        setError(
          "Unable to determine your current location."
        );
    }

    setGpsStatus("GPS unavailable");
  }, []);

  const startSharing = () => {
    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(
        watchId.current
      );
      watchId.current = null;
    }

    setBusy(true);
    setError("");
    setGpsStatus("Finding your location...");

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
                  console.error(
                    "Location update failed:",
                    err
                  );

                  if (mountedRef.current) {
                    setError(
                      "GPS is working, but the latest location could not be uploaded."
                    );
                  }
                }
              },
              handleGpsError,
              {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 15000,
              }
            );
        } catch (err) {
          if (mountedRef.current) {
            setError(err.message);
          }
        } finally {
          if (mountedRef.current) {
            setBusy(false);
          }
        }
      },
      (err) => {
        handleGpsError(err);
        setBusy(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );
  };

  const stopSharing = async () => {
    setBusy(true);
    setError("");

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(
        watchId.current
      );

      watchId.current = null;
    }

    try {
      await apiRequest("/location/stop", {
        method: "PATCH",
      });

      if (mountedRef.current) {
        setSharing(false);
        setGpsStatus("GPS sharing stopped");

        setLocation((prev) => ({
          ...(prev || {}),
          isSharing: false,
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openMaps = () => {
    if (
      typeof location?.latitude !== "number" ||
      typeof location?.longitude !== "number"
    ) {
      return;
    }

    const url =
      `https://www.google.com/maps?q=` +
      `${location.latitude},${location.longitude}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const hasLocation =
    typeof location?.latitude === "number" &&
    typeof location?.longitude === "number";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5">
          <p className="text-sm font-semibold text-blue-600">
            CareBridge
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Live Location
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Share your real-time location with your
            connected child.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="h-80">
            {hasLocation ? (
              <iframe
                title="Current location"
                className="h-full w-full border-0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  location.longitude - 0.01
                }%2C${
                  location.latitude - 0.01
                }%2C${
                  location.longitude + 0.01
                }%2C${
                  location.latitude + 0.01
                }&layer=mapnik&marker=${
                  location.latitude
                }%2C${location.longitude}`}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-slate-100">
                <div className="text-center">
                  <div className="text-5xl">📍</div>
                  <p className="mt-3 font-medium text-gray-800">
                    Waiting for GPS
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Start sharing to detect your
                    current location.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Sharing status
                </p>

                <p
                  className={`mt-1 text-sm ${
                    sharing
                      ? "text-emerald-600"
                      : "text-gray-500"
                  }`}
                >
                  {sharing
                    ? "● Location is being shared"
                    : "○ Location sharing is off"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-400">
                  GPS accuracy
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {location?.accuracy != null
                    ? `±${Math.round(
                        location.accuracy
                      )} m`
                    : "—"}
                </p>
              </div>
            </div>

            {gpsStatus && (
              <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {gpsStatus}
              </div>
            )}

            {location?.updatedAt && (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-gray-500">
                  Last update
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {new Date(
                    location.updatedAt
                  ).toLocaleTimeString()}
                </p>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              {!sharing ? (
                <button
                  onClick={startSharing}
                  disabled={busy}
                  className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {busy
                    ? "Getting GPS..."
                    : "Start Sharing Location"}
                </button>
              ) : (
                <button
                  onClick={stopSharing}
                  disabled={busy}
                  className="flex-1 rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {busy
                    ? "Stopping..."
                    : "Stop Sharing Location"}
                </button>
              )}

              <button
                onClick={fetchLocation}
                disabled={loading}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-700 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            {hasLocation && (
              <button
                onClick={openMaps}
                className="mt-3 w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
              >
                Open Current Location in Maps
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-xs leading-5 text-blue-700">
          CareBridge uses your device GPS while
          location sharing is active. Your child can
          see your latest shared position.
        </div>
      </div>
    </main>
  );
}
