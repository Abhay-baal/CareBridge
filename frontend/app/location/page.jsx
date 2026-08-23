"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";

const LiveMap = dynamic(
  () => import("@/components/location/LiveMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 items-center justify-center bg-slate-100 text-sm text-gray-500">
        Loading map...
      </div>
    ),
  }
);

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

export default function LocationPage() {
  return null;

  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [gpsStatus, setGpsStatus] = useState("");

  const watchId = useRef(null);
  const gpsRefreshInterval = useRef(null);
  const sharingRef = useRef(false);
  const mountedRef = useRef(false);

  const fetchLocation = useCallback(async () => {
    try {
      const result = await apiRequest("/location");

      if (!mountedRef.current) return;

      setLocation(result.data);
      sharingRef.current = Boolean(result.data?.isSharing);
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

    return () => {
      mountedRef.current = false;

      if (
        watchId.current !== null &&
        typeof navigator !== "undefined" &&
        navigator.geolocation
      ) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }

      if (gpsRefreshInterval.current !== null) {
        clearInterval(gpsRefreshInterval.current);
        gpsRefreshInterval.current = null;
      }

      sharingRef.current = false;
    };
  }, [fetchLocation]);

  const sendPosition = useCallback(async (position, endpoint) => {
    const payload = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy:
        typeof position.coords.accuracy === "number"
          ? position.coords.accuracy
          : null,
    };

    console.log("📍 GPS position:", {
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: payload.accuracy,
      endpoint,
    });

    const result = await apiRequest(endpoint, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    if (!mountedRef.current) return;

    console.log("✅ Location uploaded:", result.data);

    setLocation((previous) => ({
      ...(previous || {}),
      ...result.data,
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: payload.accuracy,
      isSharing: true,
      updatedAt:
        result.data?.updatedAt ||
        new Date().toISOString(),
      parentName:
        previous?.parentName || "Your Location",
    }));

    setGpsStatus(
      `GPS active • ±${Math.round(
        payload.accuracy || 0
      )}m`
    );
  }, []);

  const handlePositionError = useCallback((err) => {
    console.error("GPS error:", err);

    if (!mountedRef.current) return;

    if (err.code === 1) {
      setError(
        "Location permission was denied. Please allow Precise Location for CareBridge."
      );
    } else if (err.code === 2) {
      setError(
        "Your device could not determine the current location. Check GPS/location services."
      );
    } else if (err.code === 3) {
      setError(
        "GPS request timed out. Keep Location Services enabled and try again."
      );
    } else {
      setError("Unable to access your current location.");
    }

    setGpsStatus("GPS unavailable");
  }, []);

  const startGpsWatcher = useCallback(() => {
    if (!navigator.geolocation) {
      throw new Error(
        "Geolocation is not supported by this browser."
      );
    }

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    console.log("▶️ Starting continuous GPS watcher");

    watchId.current = navigator.geolocation.watchPosition(
      async (position) => {
        console.log("🔄 watchPosition callback fired");

        if (!sharingRef.current) {
          console.log("GPS callback ignored because sharing is off");
          return;
        }

        try {
          await sendPosition(
            position,
            "/location/update"
          );
        } catch (err) {
          console.error(
            "❌ Watch location update failed:",
            err
          );

          if (mountedRef.current) {
            setError(
              "GPS is working, but the latest location could not be uploaded."
            );
          }
        }
      },
      handlePositionError,
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    console.log(
      "✅ GPS watcher started:",
      watchId.current
    );
  }, [handlePositionError, sendPosition]);

  const startGpsFallback = useCallback(() => {
    if (gpsRefreshInterval.current !== null) {
      clearInterval(gpsRefreshInterval.current);
    }

    console.log(
      "▶️ Starting foreground GPS refresh fallback"
    );

    gpsRefreshInterval.current = setInterval(() => {
      if (!sharingRef.current) {
        return;
      }

      console.log(
        "🔁 Foreground GPS refresh"
      );

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (!sharingRef.current) return;

          try {
            await sendPosition(
              position,
              "/location/update"
            );
          } catch (err) {
            console.error(
              "❌ Fallback location update failed:",
              err
            );
          }
        },
        handlePositionError,
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 15000,
        }
      );
    }, 5000);
  }, [handlePositionError, sendPosition]);

  const stopGpsTracking = useCallback(() => {
    sharingRef.current = false;

    if (
      watchId.current !== null &&
      navigator.geolocation
    ) {
      console.log(
        "⏹️ Clearing GPS watcher:",
        watchId.current
      );

      navigator.geolocation.clearWatch(
        watchId.current
      );

      watchId.current = null;
    }

    if (gpsRefreshInterval.current !== null) {
      console.log(
        "⏹️ Clearing GPS refresh fallback"
      );

      clearInterval(
        gpsRefreshInterval.current
      );

      gpsRefreshInterval.current = null;
    }
  }, []);

  const startSharing = () => {
    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by this browser."
      );
      return;
    }

    stopGpsTracking();

    setBusy(true);
    setError("");
    setGpsStatus("Finding your GPS location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          console.log(
            "📍 Initial GPS position received"
          );

          await sendPosition(
            position,
            "/location/start"
          );

          sharingRef.current = true;

          startGpsWatcher();
          startGpsFallback();

          if (mountedRef.current) {
            setGpsStatus(
              `GPS active • ±${Math.round(
                position.coords.accuracy || 0
              )}m`
            );
          }
        } catch (err) {
          console.error(
            "❌ Failed to start location sharing:",
            err
          );

          if (mountedRef.current) {
            setError(err.message);
          }

          sharingRef.current = false;
        } finally {
          if (mountedRef.current) {
            setBusy(false);
          }
        }
      },
      (err) => {
        setBusy(false);
        handlePositionError(err);
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

    stopGpsTracking();

    try {
      await apiRequest("/location/stop", {
        method: "PATCH",
      });

      if (mountedRef.current) {
        setLocation((previous) => ({
          ...(previous || {}),
          isSharing: false,
        }));

        setGpsStatus("GPS sharing stopped");
      }
    } catch (err) {
      console.error(
        "❌ Failed to stop location sharing:",
        err
      );

      if (mountedRef.current) {
        setError(err.message);
      }
    } finally {
      if (mountedRef.current) {
        setBusy(false);
      }
    }
  };

  const sharing =
    location?.isSharing === true;

  const accuracy =
    typeof location?.accuracy === "number"
      ? Math.round(location.accuracy)
      : null;

  const hasLocation =
    typeof location?.latitude === "number" &&
    typeof location?.longitude === "number";

  return (
    <AppLayout>
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="mb-5">
            <p className="text-sm font-medium text-blue-600">
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
              <p className="font-semibold">
                Location issue
              </p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <LiveMap
              latitude={location?.latitude}
              longitude={location?.longitude}
              accuracy={location?.accuracy}
              parentName={
                location?.parentName ||
                "Your Location"
              }
            />

            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Sharing status
                  </p>

                  <p
                    className={`mt-1 font-semibold ${
                      sharing
                        ? "text-emerald-600"
                        : "text-gray-700"
                    }`}
                  >
                    {sharing
                      ? "● Location is being shared"
                      : "○ Location sharing is off"}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    sharing
                      ? "bg-emerald-50"
                      : "bg-gray-100"
                  }`}
                >
                  <span className="text-xl">
                    {sharing ? "📍" : "🔒"}
                  </span>
                </div>
              </div>

              {location?.latitude != null &&
                location?.longitude != null && (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs text-gray-500">
                        GPS accuracy
                      </p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {accuracy !== null
                          ? `±${accuracy} m`
                          : "Unavailable"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs text-gray-500">
                        Last update
                      </p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {location.updatedAt
                          ? new Date(
                              location.updatedAt
                            ).toLocaleTimeString()
                          : "Unavailable"}
                      </p>
                    </div>
                  </div>
                )}

              {gpsStatus && (
                <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  {gpsStatus}
                </div>
              )}

              {loading ? (
                <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-center text-sm text-gray-500">
                  Loading location status...
                </div>
              ) : sharing ? (
                <button
                  onClick={stopSharing}
                  disabled={busy}
                  className="mt-5 w-full rounded-2xl bg-red-600 px-5 py-4 font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-50"
                >
                  {busy
                    ? "Stopping location..."
                    : "Stop Sharing Location"}
                </button>
              ) : (
                <button
                  onClick={startSharing}
                  disabled={busy}
                  className="mt-5 w-full rounded-2xl bg-blue-600 px-5 py-4 font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-50"
                >
                  {busy
                    ? "Getting your GPS location..."
                    : "Start Sharing Location"}
                </button>
              )}

              <p className="mt-4 text-center text-xs leading-5 text-gray-400">
                CareBridge uses your device GPS while
                location sharing is active. Your child
                can see your latest shared position.
              </p>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
