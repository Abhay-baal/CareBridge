"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppEntryPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    if (!token || !user?.role) {
      router.replace("/");
      return;
    }

    if (
      user.role === "child" ||
      user.role === "provider" ||
      user.role === "parent"
    ) {
      router.replace("/settings");
      return;
    }

    router.replace("/");
  }, [router]);

  return null;
}
