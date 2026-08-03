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
    href: "/chat",
    label: "Chat",
    icon: "💬",
  },
  {
    href: "/child/location",
    label: "Location",
    icon: "📍",
  },
  {
    href: "/child/emergency",
    label: "Emergency",
    icon: "🚨",
  },
];

export default function ChildNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {navigation.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center px-2 py-3 text-xs transition ${
                active
                  ? "font-semibold text-blue-600"
                  : "text-gray-500"
              }`}
            >
              <span className="text-xl">
                {item.icon}
              </span>

              <span className="mt-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
