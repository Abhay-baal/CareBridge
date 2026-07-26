"use client";

import AppLayout from "@/components/layout/AppLayout";
import HealthRecordCard from "@/components/records/HealthRecordCard";
import UploadPlaceholder from "@/components/records/UploadPlaceholder";

const healthRecords = [
  {
    id: 1,
    title: "Blood Test",
    type: "PDF",
    createdAt: "2026-07-24T10:00:00.000Z",
  },
  {
    id: 2,
    title: "Prescription",
    type: "JPG",
    createdAt: "2026-07-20T10:00:00.000Z",
  },
  {
    id: 3,
    title: "MRI Scan",
    type: "PDF",
    createdAt: "2026-07-15T10:00:00.000Z",
  },
];

export default function HealthRecordsPage() {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Health Records
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          Access your parent's medical records in one place.
        </p>
      </div>

      <div className="space-y-4">
        {healthRecords.length > 0 ? (
          healthRecords.map((record) => (
            <HealthRecordCard
              key={record.id}
              record={record}
            />
          ))
        ) : (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-gray-500">
              No health records available.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <UploadPlaceholder />
      </div>
    </AppLayout>
  );
}
