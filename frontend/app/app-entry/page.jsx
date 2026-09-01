"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const PROTECTED_ROLES = [
  "parent",
  "child",
  "provider",
];

function getDashboardPath(role) {
  if (role === "child") {
    return "/child/dashboard";
  }

  if (role === "provider") {
    return "/provider/dashboard";
  }

  if (role === "parent") {
    return "/dashboard";
  }

  return "/";
}

export default function AppEntryPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const routeUser = () => {
      const token = localStorage.getItem("token");

      let user = null;

      try {
        user = JSON.parse(
          localStorage.getItem("user") || "null"
        );
      } catch {
        user = null;
      }

      if (!token || !user?.role) {
        router.replace("/");
        return;
      }

      if (!PROTECTED_ROLES.includes(user.role)) {
        router.replace("/");
        return;
      }

      if (cancelled) {
        return;
      }

      router.replace(getDashboardPath(user.role));
    };

    routeUser();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="rounded-2xl bg-white px-6 py-5 text-sm font-semibold text-gray-700 shadow-sm">
        Opening CareBridge...
      </div>
    </main>
  );
}
