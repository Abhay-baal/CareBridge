/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import LoadingState from "@/components/ui/LoadingState";

import {
  getChildDashboard,
  updateChildCarePlan,
} from "@/services/childService";

const WALK_LEVELS = {
  light: {
    label: "Light",
    emoji: "🌱",
  },
  easy: {
    label: "Easy",
    emoji: "🟢",
  },
  medium: {
    label: "Medium",
    emoji: "🔵",
  },
  hard: {
    label: "Hard",
    emoji: "🟠",
  },
  extreme: {
    label: "Extreme",
    emoji: "🔥",
  },
};

function formatDate(value) {
  if (!value) return "No due date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No due date";
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isOverdue(task) {
  if (!task?.dueDate || task.status === "completed") {
    return false;
  }

  return new Date(task.dueDate).getTime() < Date.now();
}

function CareCard({ task, onToggle, updating }) {
  const isCompleted = task.status === "completed";
  const isWalk = task.careType === "walk";

  const walkLevel =
    WALK_LEVELS[task.walkLevel] || null;

  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
        isCompleted
          ? "border-green-200 bg-green-50/40"
          : isOverdue(task)
          ? "border-red-200"
          : "border-gray-100"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
            isCompleted
              ? "bg-green-100"
              : isWalk
              ? "bg-blue-100"
              : "bg-purple-100"
          }`}
        >
          {isCompleted
            ? "✓"
            : isWalk
            ? "🚶"
            : "💚"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2
              className={`font-semibold ${
                isCompleted
                  ? "text-gray-500 line-through"
                  : "text-gray-900"
              }`}
            >
              {task.title || "Care task"}
            </h2>

            {isCompleted && (
              <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                Done
              </span>
            )}
          </div>

          {task.description && (
            <p className="mt-1 text-sm leading-5 text-gray-500">
              {task.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                isOverdue(task)
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {isOverdue(task)
                ? "Overdue"
                : `Due ${formatDate(task.dueDate)}`}
            </span>

            {isWalk && (
              <>
                {walkLevel && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {walkLevel.emoji} {walkLevel.label}
                  </span>
                )}

                {task.walkDuration && (
                  <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                    ⏱ {task.walkDuration} min
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={updating}
        onClick={() => onToggle(task)}
        className={`mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isCompleted
            ? "border border-gray-200 bg-white text-gray-700"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {updating
          ? "Updating..."
          : isCompleted
          ? "Mark as Pending"
          : "Mark as Completed"}
      </button>
    </div>
  );
}

export default function ChildCarePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const loadCare = async () => {
    try {
      setError("");
      setLoading(true);

      const response = await getChildDashboard();

      setData(response?.data || null);
    } catch (err) {
      console.error("Child care page error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load your care plan."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCare();
  }, []);

  const tasks = data?.carePlans || [];

  const pendingTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status !== "completed"
      ),
    [tasks]
  );

  const completedTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "completed"
      ),
    [tasks]
  );

  const handleToggle = async (task) => {
    try {
      setUpdatingId(task._id);

      const newStatus =
        task.status === "completed"
          ? "pending"
          : "completed";

      await updateChildCarePlan(
        task._id,
        newStatus
      );

      toast.success(
        newStatus === "completed"
          ? "Care task completed 💚"
          : "Care task marked as pending."
      );

      await loadCare();
    } catch (err) {
      console.error(
        "Child care task update error:",
        err
      );

      toast.error(
        err.response?.data?.message ||
          "Unable to update this care task."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-md p-4">
        <LoadingState message="Loading your care..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md p-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-xl">
            ⚠️
          </div>

          <h1 className="mt-4 text-lg font-semibold text-gray-900">
            Unable to load Care
          </h1>

          <p className="mt-2 text-sm leading-5 text-gray-500">
            {error}
          </p>

          <button
            type="button"
            onClick={loadCare}
            className="mt-4 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4 pb-8">
      {/* Header */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
            💚
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Care
            </h1>

            <p className="text-sm text-gray-500">
              Things your family has planned for you
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Your progress
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">
              {completedTasks.length}/{tasks.length}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500">
              Completed
            </p>

            <p className="mt-1 text-lg font-semibold text-green-600">
              {tasks.length
                ? Math.round(
                    (completedTasks.length /
                      tasks.length) *
                      100
                  )
                : 0}
              %
            </p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{
              width: `${
                tasks.length
                  ? (completedTasks.length /
                      tasks.length) *
                    100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Pending */}
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="font-semibold text-gray-900">
            To Do
          </h2>

          <span className="text-sm text-gray-500">
            {pendingTasks.length}
          </span>
        </div>

        {pendingTasks.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <div className="text-3xl">🎉</div>

            <h3 className="mt-2 font-semibold text-gray-900">
              All caught up!
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              You don't have any pending care tasks.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <CareCard
                key={task._id}
                task={task}
                onToggle={handleToggle}
                updating={updatingId === task._id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      {completedTasks.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="font-semibold text-gray-900">
              Completed
            </h2>

            <span className="text-sm text-gray-500">
              {completedTasks.length}
            </span>
          </div>

          <div className="space-y-3">
            {completedTasks.map((task) => (
              <CareCard
                key={task._id}
                task={task}
                onToggle={handleToggle}
                updating={updatingId === task._id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
