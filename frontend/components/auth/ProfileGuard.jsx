"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
];

export default function ProfileGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      /*
       * Authentication pages must remain accessible.
       */
      if (
        PUBLIC_PATHS.some(
          (path) =>
            pathname === path ||
            pathname.startsWith(`${path}/`)
        )
      ) {
        setChecking(false);
        return;
      }

      const token = localStorage.getItem("token");

      /*
       * No token = let the existing page/auth logic handle it.
       */
      if (!token) {
        setChecking(false);
        return;
      }

      /*
       * Settings contains the locked Profile modal.
       * Do not redirect Settings back to itself.
       */
      if (pathname === "/settings") {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/settings`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          setChecking(false);
          return;
        }

        const data = await response.json();

        const role = data.user?.role;

        /*
         * Only authenticated CareBridge roles
         * need mandatory profile completion.
         */
        if (
          role !== "parent" &&
          role !== "child" &&
          role !== "provider"
        ) {
          setChecking(false);
          return;
        }

        const dateOfBirth =
          data.parentProfile?.dateOfBirth ||
          data.settings?.profile?.dateOfBirth ||
          "";

        const gender = data.user?.gender || "";

        /*
         * MISSING DOB OR GENDER:
         * Force the user into Settings.
         */
        if (!dateOfBirth || !gender) {
          router.replace("/settings");
          return;
        }

        /*
         * Profile is complete.
         */
        setChecking(false);
      } catch (error) {
        console.error(
          "Profile completion check failed:",
          error
        );

        setChecking(false);
      }
    };

    checkProfile();
  }, [pathname, router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8fc]">
        <div className="rounded-2xl bg-white px-6 py-5 text-sm font-semibold text-gray-700 shadow-sm">
          Checking your profile...
        </div>
      </main>
    );
  }

  return children;
}
