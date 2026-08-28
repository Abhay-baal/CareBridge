import MapPlaceholder from "./MapPlaceholder";

export default function LocationCard() {
  return (
    <div className="space-y-4">
      <MapPlaceholder />

      <div className="motion-card rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900">
          Current Address
        </h3>

        <p className="mt-2 text-gray-500">
          Model Town, Ludhiana
        </p>

        <p className="mt-3 text-sm text-gray-400">
          Last Updated
        </p>

        <p className="text-gray-800">
          30 July 2026 • 4:05 PM
        </p>
      </div>
    </div>
  );
}
