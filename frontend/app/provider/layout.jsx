"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProviderLayout({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const payload = JSON.parse(
        decodeURIComponent(
          atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
            .split("")
            .map((char) => `%${("00" + char.charCodeAt(0).toString(16)).slice(-2)}`)
            .join("")
        )
      );

      if (payload.role !== "provider") {
        router.replace("/dashboard");
        return;
      }

      setChecking(false);
    } catch (error) {
      console.error("Provider auth check failed:", error);
      localStorage.removeItem("token");
      router.replace("/login");
    }
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-2xl bg-white px-6 py-5 text-sm font-semibold text-gray-700 shadow-sm">
          Checking provider access...
        </div>
      </main>
    );
  }

  return children;
}
