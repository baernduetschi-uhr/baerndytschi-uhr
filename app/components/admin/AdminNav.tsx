"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Uhr" },
  { href: "/admin/translations", label: "Begriffe" },
  { href: "/admin/meal-windows", label: "Zytfänschter" },
  { href: "/admin/holidays", label: "Feiertäg" },
  { href: "/admin/time-words", label: "Zytwörter" },
  { href: "/admin/settings", label: "Einstellungen" },
  { href: "/admin/languages", label: "Sprachen" },
  { href: "/admin/date-display", label: "Aazige" },
  { href: "/admin/language-import", label: "Import" },
  { href: "/admin/language-export", label: "Export" },
  { href: "/admin/language-validation", label: "Prüfumg" },
  { href: "/admin/menu", label: "Menü" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-3 flex-wrap">
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "rounded-full border px-5 py-3 text-sm transition",
              active
                ? "bg-white text-black border-white"
                : "bg-transparent text-white border-zinc-700 hover:border-zinc-500",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}