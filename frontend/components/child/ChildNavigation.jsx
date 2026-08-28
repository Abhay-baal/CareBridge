"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HeartPulse,
  House,
  MessageCircle,
  Siren,
  UserRound,
} from "lucide-react";

const navigation = [
  {
    href: "/child/dashboard",
    label: "Home",
    icon: House,
  },
  {
    href: "/child/care",
    label: "Care",
    icon: HeartPulse,
  },
  {
    href: "/child/chat",
    label: "Chat",
    icon: MessageCircle,
  },
  {
    href: "/child/emergency",
    label: "Emergency",
    icon: Siren,
  },
  {
    href: "/settings",
    label: "Account",
    icon: UserRound,
  },
];

export default function ChildNavigation() {
  const pathname = usePathname();

  return (
    <nav className="apple-bottom-nav fixed bottom-0 left-0 right-0 z-50">
      <div className="apple-bottom-nav__inner mx-auto flex max-w-md items-center justify-between">
        {navigation.map((item) => {
          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`apple-bottom-nav__item motion-press flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold ${
                active
                  ? item.label === "Emergency"
                    ? "apple-bottom-nav__item--emergency-active"
                    : "apple-bottom-nav__item--active"
                  : ""
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className="h-[21px] w-[21px]"
                strokeWidth={active ? 2.5 : 2}
              />

              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
