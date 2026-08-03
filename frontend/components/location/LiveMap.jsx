export default function LiveMap({
  latitude,
  longitude,
}) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-500">
        Waiting for location...
      </div>
    );
  }

  return (
    <div className="flex h-72 items-center justify-center rounded-2xl bg-gray-100">
      <div className="text-center">
        <div className="mb-3 text-5xl">📍</div>

        <p className="font-semibold">
          Live Location
        </p>

        <p className="mt-2 text-xs text-gray-500">
          {latitude.toFixed(6)},{" "}
          {longitude.toFixed(6)}
        </p>

        <a
          href={`https://www.google.com/maps?q=${latitude},${longitude}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
        >
          Open Google Maps
        </a>
      </div>
    </div>
  );
}
