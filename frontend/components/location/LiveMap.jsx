"use client";

import { useEffect, useMemo } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

function MapCenter({ latitude, longitude }) {
  const map = useMap();

  useEffect(() => {
    if (
      typeof latitude === "number" &&
      typeof longitude === "number"
    ) {
      map.setView([latitude, longitude], Math.max(map.getZoom(), 16));
    }
  }, [latitude, longitude, map]);

  return null;
}

export default function LiveMap({
  latitude,
  longitude,
  accuracy,
  parentName = "Parent",
}) {
  const position = useMemo(() => {
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return null;
    }

    return [latitude, longitude];
  }, [latitude, longitude]);

  if (!position) {
    return (
      <div className="flex h-80 items-center justify-center rounded-2xl bg-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl">
            📍
          </div>
          <p className="font-semibold text-gray-900">
            Waiting for location
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Start location sharing to see the live map.
          </p>
        </div>
      </div>
    );
  }

  const accuracyRadius =
    typeof accuracy === "number" && accuracy > 0
      ? Math.min(accuracy, 500)
      : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <MapContainer
        center={position}
        zoom={16}
        scrollWheelZoom
        className="h-80 w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCenter
          latitude={latitude}
          longitude={longitude}
        />

        {accuracyRadius && (
          <Circle
            center={position}
            radius={accuracyRadius}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#3b82f6",
              fillOpacity: 0.12,
              weight: 1,
            }}
          />
        )}

        <CircleMarker
          center={position}
          radius={10}
          pathOptions={{
            color: "#ffffff",
            weight: 4,
            fillColor: "#2563eb",
            fillOpacity: 1,
          }}
        >
          <Popup>
            <strong>{parentName}</strong>
            <br />
            Current location
            {accuracyRadius
              ? ` • ±${Math.round(accuracyRadius)}m`
              : ""}
          </Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
