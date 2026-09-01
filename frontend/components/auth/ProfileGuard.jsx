"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function ProfileGuard({ children }) {
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setChecking(false);
  }, [pathname]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8fc]">
        <div className="rounded-2xl bg-white px-6 py-5 text-sm font-semibold text-gray-700 shadow-sm">
          Loading CareBridge...
        </div>
      </main>
    );
  }

  return children;
}
