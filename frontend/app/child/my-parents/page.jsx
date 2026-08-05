/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import ParentCard from "@/components/child/ParentCard";
import LoadingState from "@/components/ui/LoadingState";

import {
  getParents,
  removeParent,
  switchActiveParent,
} from "@/services/parentChildService";

export default function MyParentsPage() {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const loadParents = async () => {
    try {
      setLoading(true);

      const response = await getParents();

      setParents(response.data || []);
    } catch (error) {
      console.error("My parents error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load parents"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParents();
  }, []);

  const handleSwitch = async (relationshipId) => {
    try {
      setSwitchingId(relationshipId);

      await switchActiveParent(relationshipId);

      toast.success("Active parent switched successfully.");

      await loadParents();
    } catch (error) {
      console.error("Switch parent error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to switch parent"
      );
    } finally {
      setSwitchingId(null);
    }
  };

  const handleRemove = async (relationshipId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this parent?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingId(relationshipId);

      await removeParent(relationshipId);

      toast.success("Parent removed successfully.");

      await loadParents();
    } catch (error) {
      console.error("Remove parent error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to remove parent"
      );
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-md p-4">
        <LoadingState message="Loading your parents..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/child/dashboard"
            className="text-sm text-blue-600"
          >
            ← Dashboard
          </Link>

          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            My Parents
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your connected parents.
          </p>
        </div>

        <Link
          href="/child/add-parent"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          + Add
        </Link>
      </div>

      {parents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <div className="text-4xl">👨‍👩‍👧</div>

          <h2 className="mt-3 font-semibold text-gray-900">
            No additional parents
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Connect another parent using their connection code.
          </p>

          <Link
            href="/child/add-parent"
            className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Add Parent
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {parents.map((relationship) => (
            <ParentCard
              key={relationship._id}
              relationship={relationship}
              onSwitch={handleSwitch}
              onRemove={handleRemove}
              switching={
                switchingId === relationship._id
              }
              removing={
                removingId === relationship._id
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
