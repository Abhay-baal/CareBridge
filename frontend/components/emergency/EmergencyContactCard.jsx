export default function EmergencyContactCard({
  name,
  relation,
  phone,
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900">
        {name}
      </h3>

      <p className="text-sm text-gray-500">
        {relation}
      </p>

      <p className="mt-2 font-medium text-gray-800">
        {phone}
      </p>
    </div>
  );
}
