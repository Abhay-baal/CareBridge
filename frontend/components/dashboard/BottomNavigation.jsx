"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNavigation() {
  const pathname = usePathname();

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
      name: "Records",
      href: "/health-records",
      icon: "📋",
    },
    {
      name: "Profile",
      href: "/profile",
      icon: "👤",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white">
      <div className="mx-auto flex max-w-md justify-around py-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-1 text-xs font-medium transition ${
                isActive
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
            >
              <span className="text-lg">
                {item.icon}
              </span>

              <span>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}