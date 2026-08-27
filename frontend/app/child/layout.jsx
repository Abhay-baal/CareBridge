"use client";

import ChildNavigation from "@/components/child/ChildNavigation";
import { usePathname } from "next/navigation";

export default function ChildLayout({ children }) {
  const pathname = usePathname();
  const showNavigation = pathname !== "/child/chat";

  return (
    <main
      className={`min-h-screen bg-gray-50 ${
        showNavigation ? "pb-24" : ""
      }`}
    >
      {children}

      {showNavigation && <ChildNavigation />}
    </main>
  );
}
