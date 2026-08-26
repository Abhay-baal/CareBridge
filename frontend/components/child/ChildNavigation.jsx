"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    href: "/child/dashboard",
    label: "Home",
    icon: "🏠",
  },
  {
    href: "/child/my-parents",
    label: "Parents",
    icon: "👨‍👩‍👧",
  },
  {
    href: "/child/chat",
    label: "Chat",
    icon: "💬",
  },
  {
    href: "/child/emergency",
    label: "Emergency",
    icon: "🚨",
  },
  {
    href: "/child/care",
    label: "Care",
    icon: "❤️",
  },
  {
    href: "/child/profile",
    label: "Profile",
    icon: "👤",
  },
];

export default function ChildNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between px-2 py-1.5">
        {navigation.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition active:scale-95 ${
                active
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <span className="text-lg leading-none">
                {item.icon}
              </span>

              <span className="truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
