import Link from "next/link";

import { UserMenu } from "@/components/auth/UserMenu";
import { LogoMark } from "@/components/icons";
import { signOutAction } from "@/lib/auth/actions";
import { auth } from "@/lib/auth/config";

const NAV = [
  { href: "/dashboard", label: "Studio" },
  { href: "/dashboard/library", label: "Library" },
  { href: "/dashboard/voice", label: "Brand voice" },
  { href: "/weekly-plan", label: "Weekly plan" },
];

interface DashboardShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Highlights the matching nav entry. */
  active?: string;
}

/**
 * Shared chrome for every signed-in page (studio, library, voice, billing),
 * so the header, nav and footer never drift apart.
 */
export async function DashboardShell({ title, description, children, active }: DashboardShellProps) {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="min-h-dvh bg-neutral-50/50">
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none">
            <LogoMark className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight text-neutral-950">
              ContentRepurposer
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 sm:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active === item.href ? "page" : undefined}
                className={
                  active === item.href ? "btn btn-secondary btn-sm" : "btn btn-ghost btn-sm"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {user ? (
            <UserMenu
              name={user.name}
              email={user.email}
              image={user.image}
              isAdmin={user.role === "ADMIN"}
              signOutAction={signOutAction}
            />
          ) : (
            <Link href="/auth/signin" className="btn btn-secondary btn-sm">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-[15px] leading-7 text-neutral-500">{description}</p>
          )}
        </div>

        {children}
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10">
        <p className="text-xs text-neutral-400">
          © {new Date().getFullYear()}{" "}
          <span className="font-medium text-neutral-600">Ahmad Khalil</span>. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
