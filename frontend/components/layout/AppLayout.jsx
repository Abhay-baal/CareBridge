"use client";

import BottomNavigation from "@/components/dashboard/BottomNavigation";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  BottomNavContext,
} from "@/components/layout/BottomNavContext";

export default function AppLayout({ children }) {
  const [showBottomNav, setShowBottomNav] =
    useState(true);
  const pathname = usePathname();

  return (
    <BottomNavContext.Provider
      value={{
        showBottomNav,
        setShowBottomNav,
      }}
    >
      <main className="min-h-screen overflow-x-hidden bg-[#fafafa] pb-24">
        <div className="mx-auto min-h-screen max-w-md px-4 pt-5">
          <div key={pathname} className="motion-page">
            {children}
          </div>
        </div>

        <BottomNavigation />
      </main>
    </BottomNavContext.Provider>
  );
}
