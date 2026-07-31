"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import CarePlanList from "@/components/dashboard/CarePlanList";
import AppointmentCard from "@/components/dashboard/AppointmentCard";

import {
  getCarePlans,
  updateCarePlan,
} from "@/services/carePlanService";

import {
  getAppointments,
} from "@/services/appointmentService";

export default function DashboardPage() {
  // Care Plan State
  const [carePlans, setCarePlans] = useState([]);
  const [carePlanLoading, setCarePlanLoading] = useState(true);
  const [carePlanError, setCarePlanError] = useState("");

  // Appointment State
  const [appointment, setAppointment] = useState(null);
  const [appointmentLoading, setAppointmentLoading] = useState(true);
  const [appointmentError, setAppointmentError] = useState("");

  // Fetch Care Plans
  const loadCarePlans = async () => {
    try {
      setCarePlanLoading(true);
      setCarePlanError("");

      const response = await getCarePlans();

      setCarePlans(response.data || []);
    } catch (error) {
      console.error("Failed to load care plans:", error);

      setCarePlanError(
        "Unable to load today's care plan."
      );
    } finally {
      setCarePlanLoading(false);
    }
  };

  // Fetch Appointments
  const loadAppointments = async () => {
    try {
      setAppointmentLoading(true);
      setAppointmentError("");

      const response = await getAppointments();

      const appointments = response.data || [];

      const upcomingAppointment = appointments
        .filter(
          (item) =>
            new Date(item.appointmentDate) >= new Date()
        )
        .sort(
          (a, b) =>
            new Date(a.appointmentDate) -
            new Date(b.appointmentDate)
        )[0];

      setAppointment(upcomingAppointment || null);
    } catch (error) {
      console.error("Failed to load appointments:", error);

      setAppointmentError(
        "Unable to load upcoming appointment."
      );
    } finally {
      setAppointmentLoading(false);
    }
  };

  // Load Dashboard Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      await Promise.all([
        loadCarePlans(),
        loadAppointments(),
      ]);
    };

    fetchDashboardData();
  }, []);

  // Update Care Plan
  const handleCarePlanUpdate = async (carePlan) => {
    try {
      setCarePlanError("");

      const newStatus =
        carePlan.status === "completed"
          ? "pending"
          : "completed";

      await updateCarePlan(carePlan._id, {
        status: newStatus,
      });

      toast.success(
        newStatus === "completed"
          ? "Task completed successfully."
          : "Task marked as pending."
      );

      await loadCarePlans();
    } catch (error) {
      console.error(
        "Failed to update care plan:",
        error
      );

      setCarePlanError(
        "Unable to update care plan."
      );

      toast.error(
        "Something went wrong. Please try again."
      );
    }
  };

  // Progress Calculation
  const completedTasks = carePlans.filter(
    (task) => task.status === "completed"
  ).length;

  const totalTasks = carePlans.length;

  const progress =
    totalTasks > 0
      ? Math.round(
          (completedTasks / totalTasks) * 100
        )
      : 0;

  return (
    <AppLayout>
      <WelcomeHeader name="Abhybir" />

      {/* Quick Actions */}
      <section className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/location"
            className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md active:scale-[0.98]"
          >
            <div className="text-2xl">📍</div>

            <h3 className="mt-2 font-semibold text-gray-900">
              Parent Location
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              View current location
            </p>
          </Link>

          <Link
            href="/emergency-contacts"
            className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md active:scale-[0.98]"
          >
            <div className="text-2xl">🚨</div>

            <h3 className="mt-2 font-semibold text-gray-900">
              Emergency
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Contact trusted people
            </p>
          </Link>
        </div>
      </section>

      {/* Today's Care Plan */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Today&apos;s Care Plan
          </h2>

          <span className="text-sm text-gray-500">
            {completedTasks}/{totalTasks}
          </span>
        </div>

        <CarePlanList
          carePlans={carePlans}
          loading={carePlanLoading}
          error={carePlanError}
          onUpdate={handleCarePlanUpdate}
        />
      </section>

      {/* Today's Progress */}
      <section className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            Today&apos;s Progress
          </h2>

          <span className="text-sm font-medium text-gray-600">
            {progress}%
          </span>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gray-900 transition-all duration-300"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <p className="mt-2 text-sm text-gray-500">
          {completedTasks} of {totalTasks} tasks completed
        </p>
      </section>

      {/* Upcoming Appointment */}
      <section className="mt-6">
        <AppointmentCard
          appointment={appointment}
          loading={appointmentLoading}
          error={appointmentError}
        />
      </section>
    </AppLayout>
  );
}
