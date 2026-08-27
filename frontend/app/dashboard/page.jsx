/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

import AppLayout from "@/components/layout/AppLayout";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import FamilyCommunication from "@/components/dashboard/FamilyCommunication";
import LoadingState from "@/components/ui/LoadingState";
import CarePlanItem from "@/components/dashboard/CarePlanItem";

import {
  getCarePlans,
  updateCarePlan,
} from "@/services/carePlanService";

import { getParentProfile } from "@/services/parentService";

export default function DashboardPage() {
  const [parent, setParent] = useState(null);

  const [carePlans, setCarePlans] = useState([]);
  const [carePlanLoading, setCarePlanLoading] = useState(true);
  const [carePlanError, setCarePlanError] = useState("");

  const [profileLoading, setProfileLoading] = useState(true);

  const loadProfile = async () => {
    try {
      setProfileLoading(true);

      const response = await getParentProfile();

      setParent(response.data || null);
    } catch (error) {
      console.error("Failed to load profile:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load your profile."
      );
    } finally {
      setProfileLoading(false);
    }
  };

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

  useEffect(() => {
    loadProfile();
    loadCarePlans();
  }, []);

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
          ? "Task completed ❤️"
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

  const previewCarePlans = carePlans.slice(0, 3);

  if (profileLoading) {
    return (
      <AppLayout>
        <LoadingState message="Loading your dashboard..." />
      </AppLayout>
    );
  }

  const parentName =
    parent?.user?.fullName ||
    parent?.fullName ||
    "Parent";

  return (
    <AppLayout>
      <div className="space-y-7 pb-4">

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1"><WelcomeHeader name={parentName} /></div>

          <Link
            href="/family"
            aria-label="Open Family"
            className="group mt-1 flex shrink-0 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm transition hover:border-gray-300 hover:shadow-md active:scale-95"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-lg transition group-hover:bg-gray-900 group-hover:text-white">
              🏡
            </span>

            <span className="text-xs font-black text-gray-900">
              Family
            </span>
          </Link>
        </div>

        <FamilyCommunication />

      </div>
    </AppLayout>
  );
}
