"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isAdmin?: boolean;
  /** Server action that signs the user out and redirects home. */
  signOutAction: () => Promise<void>;
}

const MENU_ITEMS = [
  { href: "/dashboard", label: "Studio" },
  { href: "/weekly-plan", label: "Weekly plan" },
  { href: "/dashboard/billing", label: "Billing & plan" },
];

export function UserMenu({ name, email, image, isAdmin, signOutAction }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const initial = (name ?? email ?? "?").trim().charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 text-[13px] font-semibold text-neutral-700 transition hover:border-neutral-300"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[var(--shadow-overlay)]"
        >
          <div className="border-b border-neutral-100 px-4 py-3">
            {name && <p className="truncate text-[13px] font-semibold text-neutral-900">{name}</p>}
            {email && <p className="truncate text-[11.5px] text-neutral-500">{email}</p>}
          </div>

          <div className="py-1">
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className="block px-4 py-2 text-[13px] text-neutral-700 transition hover:bg-neutral-50"
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                role="menuitem"
                className="block px-4 py-2 text-[13px] text-neutral-700 transition hover:bg-neutral-50"
              >
                Admin dashboard
              </Link>
            )}
          </div>

          <form action={signOutAction} className="border-t border-neutral-100 py-1">
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-4 py-2 text-left text-[13px] text-neutral-700 transition hover:bg-neutral-50"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
