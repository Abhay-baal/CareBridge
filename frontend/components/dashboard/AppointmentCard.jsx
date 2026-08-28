"use client";

export default function AppointmentCard({
  appointment,
  loading,
  error,
}) {
  if (loading) {
    return (
      <div className="motion-card rounded-xl bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">
          Loading appointment...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="motion-card rounded-xl bg-white p-5 shadow-sm">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="motion-card rounded-xl bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">
          No upcoming appointments.
        </p>
      </div>
    );
  }

  const appointmentDate = new Date(
    appointment.appointmentDate
  );

  return (
    <div className="motion-card rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">
        Upcoming Appointment
      </p>

      <h3 className="mt-2 text-lg font-semibold text-gray-900">
        {appointment.doctorName}
      </h3>

      {appointment.hospitalName && (
        <p className="mt-1 text-sm text-gray-500">
          {appointment.hospitalName}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {appointmentDate.toLocaleDateString("en-IN")}
        </p>

        <p className="text-sm font-medium text-gray-700">
          {appointmentDate.toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>

      <p className="mt-3 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
        {appointment.status}
      </p>
    </div>
  );
}
