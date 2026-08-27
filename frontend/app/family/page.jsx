"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  createFamily,
  getMyFamily,
  joinFamily,
} from "@/services/familyService";

const getLoggedInRole = () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) return null;

    const payload = JSON.parse(
      decodeURIComponent(
        atob(token.split(".")[1])
          .split("")
          .map(
            (char) =>
              "%" +
              ("00" + char.charCodeAt(0).toString(16)).slice(-2)
          )
          .join("")
      )
    );

    return payload.role || null;
  } catch {
    return null;
  }
};

export default function FamilyPage() {
  const [mode, setMode] = useState(null);
  const [position, setPosition] = useState("");
  const [familyCode, setFamilyCode] = useState("");

  const [role, setRole] = useState(null);
  const [family, setFamily] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const currentRole = getLoggedInRole();
    setRole(currentRole);

    const loadFamily = async () => {
      try {
        const result = await getMyFamily();

        if (result.hasFamily) {
          setFamily(result.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFamily();
  }, []);

  const reset = () => {
    setMode(null);
    setPosition("");
    setFamilyCode("");
    setError("");
  };

  const handleCreate = async () => {
    setError("");

    if (role === "parent" && !position) {
      setError("Please choose Father or Mother.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await createFamily(
        role === "parent" ? position : null
      );

      setFamily(result.data);
      setMode(null);
      setPosition("");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to create family."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async () => {
    setError("");

    if (!familyCode.trim()) {
      setError("Please enter your family code.");
      return;
    }

    if (role === "parent" && !position) {
      setError("Please choose Father or Mother.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await joinFamily(
        familyCode.trim(),
        role === "parent" ? position : null
      );

      setFamily(result.data);
      setMode(null);
      setPosition("");
      setFamilyCode("");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to join family."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-md">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
            <p className="mt-4 text-sm font-semibold text-gray-500">
              Loading family...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (family) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-md">

          <div className="mb-6 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black text-gray-900">
                🏡 Family
              </h1>

              <p className="text-xs font-medium text-gray-500">
                Your family connection
              </p>
            </div>

            <Link
              href="/dashboard"
              aria-label="Open Home"
              className="group mt-1 flex shrink-0 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm transition hover:border-gray-300 hover:shadow-md active:scale-95"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-lg transition group-hover:bg-gray-900 group-hover:text-white">
                🏠
              </span>

              <span className="text-xs font-black text-gray-900">
                Home
              </span>
            </Link>
          </div>

          <div className="rounded-3xl bg-gray-900 p-6 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              Family Code
            </p>

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-3xl font-black tracking-[0.2em]">
                {family.familyCode}
              </p>

              <button
                type="button"
                onClick={() =>
                  navigator.clipboard?.writeText(
                    family.familyCode
                  )
                }
                className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold"
              >
                Copy
              </button>
            </div>

            <p className="mt-3 text-xs font-medium text-gray-400">
              Share this code with your family members.
            </p>
          </div>

          <div className="mt-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-gray-900">
              Family Members
            </h2>

            <div className="mt-4 space-y-3">

              {family.father && (
                <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                    👨
                  </div>

                  <div>
                    <p className="text-sm font-black text-gray-900">
                      {family.father.fullName}
                    </p>
                    <p className="text-xs font-semibold text-gray-500">
                      Father
                    </p>
                  </div>
                </div>
              )}

              {family.mother && (
                <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                    👩
                  </div>

                  <div>
                    <p className="text-sm font-black text-gray-900">
                      {family.mother.fullName}
                    </p>
                    <p className="text-xs font-semibold text-gray-500">
                      Mother
                    </p>
                  </div>
                </div>
              )}

              {family.children?.map((child) => (
                <div
                  key={child._id}
                  className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                    🧒
                  </div>

                  <div>
                    <p className="text-sm font-black text-gray-900">
                      {child.fullName}
                    </p>
                    <p className="text-xs font-semibold text-gray-500">
                      Child
                    </p>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto w-full max-w-md">

        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black text-gray-900">
              🏡 Family
            </h1>

            <p className="text-xs font-medium text-gray-500">
              Connect your family simply
            </p>
          </div>

          <Link
            href="/dashboard"
            aria-label="Open Home"
            className="group mt-1 flex shrink-0 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 shadow-sm transition hover:border-gray-300 hover:shadow-md active:scale-95"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-lg transition group-hover:bg-gray-900 group-hover:text-white">
              🏠
            </span>

            <span className="text-xs font-black text-gray-900">
              Home
            </span>
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {!mode && (
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="mb-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-3xl">
                🏡
              </div>

              <h2 className="mt-4 text-xl font-black text-gray-900">
                Build Your Family
              </h2>

              <p className="mt-1 text-sm font-medium text-gray-500">
                Create a family or connect to one using a code.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setMode("create");
                setError("");
              }}
              className="w-full rounded-2xl bg-gray-900 px-5 py-4 text-left text-white transition hover:bg-gray-800"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl">
                  ➕
                </div>

                <div>
                  <p className="text-base font-black">
                    Create New Family
                  </p>

                  <p className="mt-0.5 text-xs font-medium text-gray-300">
                    Start your family
                  </p>
                </div>

                <span className="ml-auto text-xl">
                  →
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("join");
                setError("");
              }}
              className="mt-3 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-left transition hover:bg-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                  🔗
                </div>

                <div>
                  <p className="text-base font-black text-gray-900">
                    Join a Family
                  </p>

                  <p className="mt-0.5 text-xs font-medium text-gray-500">
                    Enter your family code
                  </p>
                </div>

                <span className="ml-auto text-xl text-gray-500">
                  →
                </span>
              </div>
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">

            <button
              type="button"
              onClick={reset}
              className="mb-5 text-sm font-bold text-gray-500"
            >
              ← Back
            </button>

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                🏡
              </div>

              <h2 className="mt-4 text-xl font-black text-gray-900">
                Create New Family
              </h2>

              <p className="mt-1 text-sm font-medium text-gray-500">
                We detected your account as{" "}
                <span className="font-black text-gray-900">
                  {role === "parent" ? "Parent" : "Child"}
                </span>
                .
              </p>
            </div>

            {role === "parent" && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Your position
                </p>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() => setPosition("father")}
                    className={`rounded-2xl border px-4 py-5 transition ${
                      position === "father"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-gray-50 text-gray-900"
                    }`}
                  >
                    <div className="text-2xl">👨</div>
                    <p className="mt-2 text-sm font-black">
                      Father
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPosition("mother")}
                    className={`rounded-2xl border px-4 py-5 transition ${
                      position === "mother"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-gray-50 text-gray-900"
                    }`}
                  >
                    <div className="text-2xl">👩</div>
                    <p className="mt-2 text-sm font-black">
                      Mother
                    </p>
                  </button>

                </div>
              </div>
            )}

            {role === "child" && (
              <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-center">
                <p className="text-2xl">🧒</p>

                <p className="mt-2 text-sm font-black text-gray-900">
                  You'll join as a Child
                </p>

                <p className="mt-1 text-xs font-medium text-gray-500">
                  No additional selection is needed.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleCreate}
              disabled={
                submitting ||
                (role === "parent" && !position)
              }
              className="mt-6 w-full rounded-2xl bg-gray-900 px-4 py-3.5 text-sm font-black text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Creating..." : "Create Family"}
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">

            <button
              type="button"
              onClick={reset}
              className="mb-5 text-sm font-bold text-gray-500"
            >
              ← Back
            </button>

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
                🔗
              </div>

              <h2 className="mt-4 text-xl font-black text-gray-900">
                Join a Family
              </h2>

              <p className="mt-1 text-sm font-medium text-gray-500">
                Your account is detected automatically.
              </p>
            </div>

            <div className="mt-6">
              <label className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Family Code
              </label>

              <input
                type="text"
                value={familyCode}
                onChange={(event) =>
                  setFamilyCode(
                    event.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                      .slice(0, 6)
                  )
                }
                placeholder="ABC123"
                maxLength={6}
                className="mt-2 w-full rounded-2xl border border-gray-300 bg-white px-4 py-4 text-center text-xl font-black tracking-[0.3em] text-gray-900 uppercase outline-none transition placeholder:text-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-gray-100"
              />
            </div>

            {role === "parent" && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Your position
                </p>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() => setPosition("father")}
                    className={`rounded-2xl border px-4 py-4 transition ${
                      position === "father"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-gray-50 text-gray-900"
                    }`}
                  >
                    <span className="text-xl">👨</span>
                    <p className="mt-1 text-sm font-black">
                      Father
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPosition("mother")}
                    className={`rounded-2xl border px-4 py-4 transition ${
                      position === "mother"
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-gray-50 text-gray-900"
                    }`}
                  >
                    <span className="text-xl">👩</span>
                    <p className="mt-1 text-sm font-black">
                      Mother
                    </p>
                  </button>

                </div>
              </div>
            )}

            {role === "child" && (
              <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-center">
                <p className="text-sm font-black text-gray-900">
                  🧒 You will join as a Child
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleJoin}
              disabled={
                submitting ||
                familyCode.length !== 6 ||
                (role === "parent" && !position)
              }
              className="mt-5 w-full rounded-2xl bg-gray-900 px-4 py-3.5 text-sm font-black text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Joining..." : "Join Family"}
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
