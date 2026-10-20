import Link from "next/link";

import { UserMenu } from "@/components/auth/UserMenu";
import { ArrowRightIcon, LogoMark } from "@/components/icons";
import { signOutAction } from "@/lib/auth/actions";
import { auth } from "@/lib/auth/config";

export async function Navbar({ showLinks = true }: { showLinks?: boolean }) {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/20"
        >
          <LogoMark className="h-7 w-7" />
          <span className="text-[15px] font-semibold tracking-tight text-neutral-950">
            ContentRepurposer
          </span>
        </Link>

        {showLinks && (
          <div className="ml-4 hidden items-center gap-6 md:flex">
            <a href="#how-it-works" className="text-[13.5px] text-neutral-500 transition hover:text-neutral-950">
              كيف يعمل
            </a>
            <a href="#formats" className="text-[13.5px] text-neutral-500 transition hover:text-neutral-950">
              النتائج
            </a>
            <a href="#reliability" className="text-[13.5px] text-neutral-500 transition hover:text-neutral-950">
              الموثوقية
            </a>
            <a href="#pricing" className="text-[13.5px] text-neutral-500 transition hover:text-neutral-950">
              الأسعار
            </a>
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
            <Link
              href="/auth/signin"
              className="hidden rounded-lg px-3 py-1.5 text-[13.5px] font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950 sm:inline-flex"
            >
              تسجيل الدخول
            </Link>
          )}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2 text-[13.5px] font-semibold text-white transition hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/30 focus-visible:ring-offset-2"
          >
            افتح الاستوديو
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
