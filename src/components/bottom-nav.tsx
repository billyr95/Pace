"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, ArrowLeftRight, PieChart, User } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/plan", label: "Plan", icon: Calendar },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/insights", label: "Insights", icon: PieChart },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 border-t border-brand-mist bg-white/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition ${
                  active ? "text-brand-dark" : "text-brand-forest/50"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
