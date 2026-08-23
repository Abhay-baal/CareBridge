"use client";

export default function CarePlanItem({ carePlan, onUpdate }) {
  const isCompleted = carePlan.status === "completed";

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex-1">
        <h3
          className={`font-medium ${
            isCompleted
              ? "text-gray-400 line-through"
              : "text-gray-900"
          }`}
        >
          {carePlan.title}
        </h3>

        {carePlan.description && (
          <p className="mt-1 text-sm text-gray-500">
            {carePlan.description}
          </p>
        )}

        {carePlan.dueDate && (
          <p className="mt-2 text-xs text-gray-400">
            Due:{" "}
            {new Date(carePlan.dueDate).toLocaleDateString(
              "en-IN"
            )}
          </p>
        )}
      </div>

      <input
        type="checkbox"
        checked={isCompleted}
        onChange={() => onUpdate(carePlan)}
        className="h-5 w-5 cursor-pointer"
      />
    </div>
  );
}