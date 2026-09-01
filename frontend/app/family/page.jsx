"use client";

import { getGenderAvatar } from "@/utils/genderAvatar";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [mode, setMode] = useState(null);
  const [position, setPosition] = useState("");
  const [familyCode, setFamilyCode] = useState("");

  const [role, setRole] = useState(null);
  const [family, setFamily] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const homePath =
    role === "child" ? "/child/dashboard" : "/dashboard";

  useEffect(() => {
    const currentRole = getLoggedInRole();

    if (!currentRole) {
      setRole(null);
      setLoading(false);
      router.replace("/login");
      return;
    }

    const loadFamily = async () => {
      try {
        const result = await getMyFamily();

        if (result.hasFamily) {
          setFamily(result.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setRole(currentRole);
        setLoading(false);
      }
    };

    loadFamily();
  }, [router]);

  const reset = () => {
    setMode(null);
    setPosition("");
    setFamilyCode("");
    setError("");
  };

  const handleCreate = async () => {
    setError("");

    if (!localStorage.getItem("token")) {
      router.replace("/login");
      return;
    }

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

    if (!localStorage.getItem("token")) {
      router.replace("/login");
      return;
    }

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
      <main className="min-h-screen bg-[#fffafb] px-4 py-5">
        <div className="mx-auto max-w-md">
            <div className="rounded-2xl border border-[#f3e3e5] bg-white p-8 text-center shadow-[0_8px_24px_rgba(74,55,61,0.05)]">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-rose-100 border-t-gray-900" />
            <p className="mt-4 text-sm font-semibold text-rose-400">
                Loading family...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!role) {
    return (
      <main className="min-h-screen bg-[#fffafb] px-4 py-5">
        <div className="mx-auto max-w-md">
          <div className="rounded-[28px] border border-[#f3e3e5] bg-white p-6 text-center shadow-[0_8px_24px_rgba(74,55,61,0.05)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff0f2] text-3xl">
              🔒
            </div>
            <h1 className="mt-4 text-2xl font-black text-[#182033]">
              Please log in
            </h1>
            <p className="mt-2 text-sm font-medium text-[#b38c94]">
              You need an active session to view or create a family.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-[#FF8FA3] px-4 py-3 text-sm font-black text-white transition hover:bg-[#FF7F96]"
            >
              Go to login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (family) {
    return (
      <main className="min-h-screen bg-[#fffafb] px-4 py-5">
        <div className="mx-auto max-w-md">

          <div className="mb-6 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-black tracking-tight text-[#182033]">
                  Family
              </h1>

              <p className="text-xs font-medium text-rose-400">
                Your family connection
              </p>
            </div>

            <Link
              href={homePath}
              aria-label="Open Home"
              className="group mt-1 flex shrink-0 items-center gap-2 rounded-2xl border border-rose-100 bg-white px-3.5 py-2.5 shadow-sm transition hover:border-rose-200 hover:shadow-md active:scale-95"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff0f2] text-lg transition group-hover:bg-[#ff8fa3] group-hover:text-white">
                🏠
              </span>

              <span className="text-xs font-black text-[#182033]">
                Home
              </span>
            </Link>
          </div>

          <div className="rounded-[28px] border border-rose-100 bg-linear-to-r from-rose-50 via-pink-50 to-orange-50 p-5 shadow-[0_14px_32px_rgba(244,114,182,0.08)]">
            <p className="text-xs font-bold uppercase tracking-widest text-rose-500">
              Family Code
            </p>

            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-3xl font-black tracking-[0.2em] text-gray-900">
                {family?.familyCode}
              </p>

              <button
                type="button"
                onClick={() =>
                  navigator.clipboard?.writeText(
                    family?.familyCode
                  )
                }
                className="rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-gray-900 shadow-sm transition hover:bg-white"
              >
                Copy
              </button>
            </div>

            <p className="mt-3 text-xs font-medium text-gray-500">
              Share this code with your family members.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-[#f3e3e5] bg-white p-5 shadow-[0_8px_24px_rgba(74,55,61,0.05)]">
            <h2 className="text-lg font-black text-[#182033]">
              Family Members
            </h2>

            <div className="mt-4 space-y-3">

              {family?.father && (
                <div className="flex items-center gap-3 rounded-xl border border-[#f8eaec] bg-[#fffafb] p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#fff0f2] text-xl">
                    {getGenderAvatar(family?.father)}
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#182033]">
                      {family?.father.fullName}
                    </p>
                    <p className="text-xs font-semibold text-rose-400">
                      Father
                    </p>
                  </div>
                </div>
              )}

              {family?.mother && (
                <div className="flex items-center gap-3 rounded-xl border border-[#f8eaec] bg-[#fffafb] p-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#fff0f2] text-xl">
                    {getGenderAvatar(family?.mother)}
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#182033]">
                      {family?.mother.fullName}
                    </p>
                    <p className="text-xs font-semibold text-rose-400">
                      Mother
                    </p>
                  </div>
                </div>
              )}

              {family.children?.map((child) => (
                <div
                  key={child._id}
                  className="flex items-center gap-3 rounded-xl border border-[#f8eaec] bg-[#fffafb] p-3"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                    🧒
                  </div>

                  <div>
                    <p className="text-sm font-black text-[#182033]">
                      {child.fullName}
                    </p>
                    <p className="text-xs font-semibold text-rose-400">
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
    <main className="min-h-screen bg-[#fffafb] px-4 py-5">
    <div className="mx-auto w-full max-w-md">

        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black tracking-tight text-[#182033]">
              Family
            </h1>

            <p className="mt-1 text-xs font-medium text-[#b38c94]">
              Connect your family simply
            </p>
          </div>

          <Link
            href={homePath}
            aria-label="Open Home"
            className="group mt-1 flex shrink-0 items-center gap-2 rounded-xl border border-[#f3e3e5] bg-white px-3 py-2 shadow-sm transition hover:border-[#e7c5cb] hover:shadow-md active:scale-95"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff0f2] text-lg transition group-hover:bg-[#ff8fa3] group-hover:text-white">
              🏠
            </span>

            <span className="text-xs font-black text-[#182033]">
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
          <div className="rounded-2xl border border-[#f3e3e5] bg-white p-5 shadow-[0_8px_24px_rgba(74,55,61,0.05)]">

            <div className="mb-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff0f2] text-3xl">
                🏡
              </div>

              <h2 className="mt-4 text-xl font-black text-[#182033]">
                Build Your Family
              </h2>

              <p className="mt-1 text-sm font-medium text-[#b38c94]">
                Create a family or connect to one using a code.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setMode("create");
                setError("");
              }}
              className="w-full rounded-2xl bg-[#FF8FA3] px-5 py-4 text-left text-white transition hover:bg-[#FF7F96]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl">
                  ➕
                </div>

                <div>
                  <p className="text-base font-black">
                    Create New Family
                  </p>

                  <p className="mt-0.5 text-xs font-medium text-rose-100">
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
              className="mt-3 w-full rounded-2xl border border-[#f3e3e5] bg-[#fffafb] px-5 py-4 text-left transition hover:border-[#e7c5cb] hover:bg-[#fff0f2]"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#fff0f2] text-xl">
                  🔗
                </div>

                <div>
                  <p className="text-base font-black text-[#182033]">
                    Join a Family
                  </p>

                  <p className="mt-0.5 text-xs font-medium text-[#b38c94]">
                    Enter your family code
                  </p>
                </div>

                <span className="ml-auto text-xl text-[#d78392]">
                  →
                </span>
              </div>
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="rounded-2xl border border-[#f3e3e5] bg-white p-5 shadow-[0_8px_24px_rgba(74,55,61,0.05)]">

            <button
              type="button"
              onClick={reset}
              className="mb-5 text-sm font-bold text-[#c47786]"
            >
              ← Back
            </button>

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0f2] text-2xl">
                🏡
              </div>

              <h2 className="mt-4 text-xl font-black text-[#182033]">
                Create New Family
              </h2>

              <p className="mt-1 text-sm font-medium text-[#b38c94]">
                We detected your account as{" "}
                <span className="font-black text-[#182033]">
                  {role === "parent" ? "Parent" : "Child"}
                </span>
                .
              </p>
            </div>

            {role === "parent" && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-rose-400">
                  Your position
                </p>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() => setPosition("father")}
                    className={`rounded-2xl border px-4 py-5 transition ${
                      position === "father"
                        ? "border-[#ff7f96] bg-[#ff8fa3] text-white"
                        : "border-[#f3e3e5] bg-[#fffafb] text-[#182033] hover:border-[#e7c5cb]"
                    }`}
                  >
                    <div className="text-2xl">{getGenderAvatar(family?.father)}</div>
                    <p className="mt-2 text-sm font-black">
                      Father
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPosition("mother")}
                    className={`rounded-2xl border px-4 py-5 transition ${
                      position === "mother"
                        ? "border-[#ff7f96] bg-[#ff8fa3] text-white"
                        : "border-[#f3e3e5] bg-[#fffafb] text-[#182033] hover:border-[#e7c5cb]"
                    }`}
                  >
                    <div className="text-2xl">{getGenderAvatar(family?.mother)}</div>
                    <p className="mt-2 text-sm font-black">
                      Mother
                    </p>
                  </button>

                </div>
              </div>
            )}

            {role === "child" && (
              <div className="mt-6 rounded-xl border border-[#f3e3e5] bg-[#fffafb] p-4 text-center">
                <p className="text-2xl">🧒</p>

                <p className="mt-2 text-sm font-black text-[#182033]">
                  You&apos;ll join as a Child
                </p>

                <p className="mt-1 text-xs font-medium text-rose-400">
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
              className="mt-6 w-full rounded-2xl bg-[#FF8FA3] px-4 py-3.5 text-sm font-black text-white transition hover:bg-[#FF7F96] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Creating..." : "Create Family"}
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className="rounded-2xl border border-[#f3e3e5] bg-white p-5 shadow-[0_8px_24px_rgba(74,55,61,0.05)]">

            <button
              type="button"
              onClick={reset}
              className="mb-5 text-sm font-bold text-[#c47786]"
            >
              ← Back
            </button>

            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0f2] text-2xl">
                🔗
              </div>

              <h2 className="mt-4 text-xl font-black text-[#182033]">
                Join a Family
              </h2>

              <p className="mt-1 text-sm font-medium text-[#b38c94]">
                Your account is detected automatically.
              </p>
            </div>

            <div className="mt-6">
              <label className="text-xs font-bold uppercase tracking-wide text-[#b38c94]">
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
                className="mt-2 w-full rounded-xl border border-[#ead3d7] bg-[#fffafb] px-4 py-4 text-center text-xl font-black tracking-[0.3em] text-[#182033] uppercase outline-none transition placeholder:text-[#e8cdd2] focus:border-[#ffb1be] focus:ring-2 focus:ring-[#ffecef]"
              />
            </div>

            {role === "parent" && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-rose-400">
                  Your position
                </p>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() => setPosition("father")}
                    className={`rounded-2xl border px-4 py-4 transition ${
                      position === "father"
                        ? "border-[#ff7f96] bg-[#ff8fa3] text-white"
                        : "border-[#f3e3e5] bg-[#fffafb] text-[#182033] hover:border-[#e7c5cb]"
                    }`}
                  >
                    <span className="text-xl">{getGenderAvatar(family?.father)}</span>
                    <p className="mt-1 text-sm font-black">
                      Father
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPosition("mother")}
                    className={`rounded-2xl border px-4 py-4 transition ${
                      position === "mother"
                        ? "border-[#ff7f96] bg-[#ff8fa3] text-white"
                        : "border-[#f3e3e5] bg-[#fffafb] text-[#182033] hover:border-[#e7c5cb]"
                    }`}
                  >
                    <span className="text-xl">{getGenderAvatar(family?.mother)}</span>
                    <p className="mt-1 text-sm font-black">
                      Mother
                    </p>
                  </button>

                </div>
              </div>
            )}

            {role === "child" && (
              <div className="mt-5 rounded-xl border border-[#f3e3e5] bg-[#fffafb] p-4 text-center">
                <p className="text-sm font-black text-[#182033]">
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
              className="mt-5 w-full rounded-2xl bg-[#FF8FA3] px-4 py-3.5 text-sm font-black text-white transition hover:bg-[#FF7F96] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Joining..." : "Join Family"}
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
