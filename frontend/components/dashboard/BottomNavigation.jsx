"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext } from "react";
import { BottomNavContext } from "@/components/layout/BottomNavContext";

export default function BottomNavigation() {
  const pathname = usePathname();
  const { showBottomNav } = useContext(BottomNavContext);

  if (!showBottomNav) return null;

  const navigationItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: "🏠",
    },
    {
      name: "Care",
      href: "/care-plan",
      icon: "❤️",
    },
    {
      name: "Chat",
      href: "/chat",
      icon: "💬",
    },
    {
      name: "Location",
      href: "/location",
      icon: "📍",
    },
    {
      name: "Emergency",
      href: "/emergency-contacts",
      icon: "🚨",
    },
    {
      name: "Profile",
      href: "/profile",
      icon: "👤",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white shadow-sm">
      <div className="mx-auto flex max-w-md justify-between px-1 py-2">
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-1 text-[10px] font-medium transition ${
                isActive
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
            >
              <span className="text-lg leading-none">
                {item.icon}
              </span>

              <span className="truncate">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
