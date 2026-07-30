export default function AppointmentCard({ appointment }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">Upcoming Appointment</p>

      {!appointment ? (
        <p className="mt-3 text-sm text-gray-500">
          No upcoming appointments.
        </p>
      ) : (
        <div className="mt-3">
          <h3 className="font-semibold text-gray-900">
            {appointment.doctorName || "Doctor"}
          </h3>

          <p className="mt-1 text-sm text-gray-600">
            {appointment.hospitalName || "Hospital"}
          </p>

          {appointment.appointmentDate && (
            <p className="mt-2 text-sm font-medium text-blue-600">
              {new Date(appointment.appointmentDate).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
