import Link from "next/link";

import { UserMenu } from "@/components/auth/UserMenu";
import { ArrowRightIcon, LogoMark } from "@/components/icons";
import { signOutAction } from "@/lib/auth/actions";
import { auth } from "@/lib/auth/config";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#formats", label: "What you get" },
  { href: "#reliability", label: "Reliability" },
  { href: "#pricing", label: "Pricing" },
];

export async function Navbar({ showLinks = true }: { showLinks?: boolean }) {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none"
        >
          <LogoMark className="h-7 w-7" />
          <span className="text-[15px] font-semibold tracking-tight text-neutral-950">
            ContentRepurposer
          </span>
        </Link>

        {showLinks && (
          <div className="ml-4 hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13.5px] text-neutral-500 transition hover:text-neutral-950"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <UserMenu
              name={user.name}
              email={user.email}
              image={user.image}
              isAdmin={user.role === "ADMIN"}
              signOutAction={signOutAction}
            />
          ) : (
            <Link href="/auth/signin" className="btn btn-ghost btn-sm hidden sm:inline-flex">
              Sign in
            </Link>
          )}
          <Link href="/dashboard" className="btn btn-primary btn-sm">
            Open the studio
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
