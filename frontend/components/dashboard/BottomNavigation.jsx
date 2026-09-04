"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext } from "react";
import {
  HeartPulse,
  House,
  MessageCircle,
  UserRound,
} from "lucide-react";

import { BottomNavContext } from "@/components/layout/BottomNavContext";

export default function BottomNavigation() {
  const pathname = usePathname();
  const { showBottomNav } = useContext(BottomNavContext);

  if (!showBottomNav) return null;

  const navigationItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: House,
    },
    {
      name: "Care",
      href: "/care-plan",
      icon: HeartPulse,
    },
    {
      name: "Chat",
      href: "/chat",
      icon: MessageCircle,
    },
    {
      name: "Account",
      href: "/settings",
      icon: UserRound,
    },
  ];

  return (
    <nav className="apple-bottom-nav fixed bottom-0 left-0 right-0 z-40">
      <div className="apple-bottom-nav__inner mx-auto flex max-w-md justify-between">
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`apple-bottom-nav__item motion-press flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold ${
                isActive
                  ? "apple-bottom-nav__item--active"
                  : ""
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className="h-[21px] w-[21px]"
                strokeWidth={isActive ? 2.5 : 2}
              />

              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
