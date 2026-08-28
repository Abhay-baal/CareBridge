"use client";

import CarePlanItem from "./CarePlanItem";

export default function CarePlanList({
  carePlans,
  loading,
  error,
  onUpdate,
}) {
  if (loading) {
    return (
      <div className="motion-card rounded-xl bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">
          Loading today&apos;s care plan...
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

  if (carePlans.length === 0) {
    return (
      <div className="motion-card rounded-xl bg-white p-5 shadow-sm">
        <p className="text-sm text-gray-500">
          No care plan for today.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {carePlans.map((carePlan) => (
        <CarePlanItem
          key={carePlan._id}
          carePlan={carePlan}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}
