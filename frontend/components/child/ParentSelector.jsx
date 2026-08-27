/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  getParents,
  switchActiveParent,
} from "@/services/parentChildService";

export default function ParentSelector() {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const loadParents = async () => {
    try {
      setLoading(true);

      const response = await getParents();

      setParents(response.data || []);
    } catch (error) {
      console.error("Parent selector error:", error);

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
      setSwitching(true);

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
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">
          Loading parents...
        </p>
      </div>
    );
  }

  const activeParent = parents.find(
    (relationship) => relationship.active
  );

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Active Parent
          </p>

          <h2 className="mt-1 font-semibold text-gray-900">
            {activeParent?.parent?.fullName ||
              "No active parent"}
          </h2>
        </div>

        <Link
          href="/family"
          className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600"
        >
          Manage
        </Link>
      </div>

      {parents.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {parents.map((relationship) => (
            <button
              key={relationship._id}
              type="button"
              onClick={() =>
                relationship.active
                  ? null
                  : handleSwitch(relationship._id)
              }
              disabled={
                switching || relationship.active
              }
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium ${
                relationship.active
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700"
              } disabled:cursor-not-allowed`}
            >
              {relationship.parent?.fullName ||
                "Parent"}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
