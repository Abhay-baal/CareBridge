"use client";

import BottomNavigation from "@/components/dashboard/BottomNavigation";
import { useState } from "react";
import { BottomNavContext } from "@/components/layout/BottomNavContext";
import FloatingActionButton from "@/components/emergency/FloatingActionButton";
import { Phone, TriangleAlert } from "lucide-react";

export default function AppLayout({ children }) {
  const [showBottomNav, setShowBottomNav] = useState(true);

  return (
    <BottomNavContext.Provider
      value={{ showBottomNav, setShowBottomNav }}
    >
      <main className="min-h-screen bg-gray-50 pb-20">
        <div className="mx-auto max-w-md px-4 py-4">
          {children}
        </div>

        <BottomNavigation />

        <FloatingActionButton
          icon={<Phone size={24} />}
          position="right"
          color="bg-green-600"
          onClick={() => alert("Call Child")}
        />

        <FloatingActionButton
          icon={<TriangleAlert size={24} />}
          position="left"
          color="bg-red-600"
          onClick={() => alert("Emergency")}
        />
      </main>
    </BottomNavContext.Provider>
  );
}
