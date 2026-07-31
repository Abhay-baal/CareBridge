"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import WelcomeHeader from "@/components/child/WelcomeHeader";
import ParentSummaryCard from "@/components/child/ParentSummaryCard";
import ProgressCard from "@/components/child/ProgressCard";
import AppointmentCard from "@/components/child/AppointmentCard";
import TodayTasks from "@/components/child/TodayTasks";
import StatsGrid from "@/components/child/StatsGrid";

import {
  getChildDashboard,
  updateChildCarePlan,
} from "@/services/childService";

export default function ChildDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setError("");

      const response = await getChildDashboard();

      setData(response.data);
    } catch (err) {
      console.error("Child dashboard error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load child dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleToggleTask = async (task) => {
    try {
      const newStatus =
        task.status === "completed"
          ? "pending"
          : "completed";

      await updateChildCarePlan(task._id, newStatus);

      toast.success(
        newStatus === "completed"
          ? "Task completed successfully."
          : "Task marked as pending."
      );

      await loadDashboard();
    } catch (err) {
      console.error("Task update error:", err);

      toast.error(
        "Something went wrong. Please try again."
      );
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Loading child dashboard...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h1 className="font-semibold text-red-600">
              Unable to load dashboard
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {error}
            </p>

            <button
              onClick={loadDashboard}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const parent = data?.parent;
  const tasks = data?.carePlans || [];
  const appointments = data?.appointments || [];
  const stats = data?.stats || {};

  const upcomingAppointment =
    appointments.find(
      (appointment) =>
        appointment.status === "upcoming"
    ) || appointments[0];

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md space-y-4 pb-6">

        <WelcomeHeader
          parentName={parent?.user?.fullName}
        />

        <ParentSummaryCard
          parent={{
            fullName: parent?.user?.fullName,
            bloodGroup: parent?.bloodGroup,
            healthStatus: "Good",
          }}
        />

        <ProgressCard
          completed={stats.completedTasks || 0}
          total={stats.totalTasks || 0}
        />

        <AppointmentCard
          appointment={upcomingAppointment}
        />

        <StatsGrid
          totalTasks={stats.totalTasks || 0}
          completedTasks={stats.completedTasks || 0}
          appointments={stats.totalAppointments || 0}
          reports={stats.totalReports || 0}
        />

        <TodayTasks
          tasks={tasks}
          onToggle={handleToggleTask}
        />

      </div>
    </main>
  );
}
