import { redirect } from "next/navigation";

import { auth, isAdminEmail } from "@/lib/auth/config";

/**
 * Admin gate — server-side, runs on every `/admin/*` request.
 *
 * A user may enter if EITHER:
 *  - their DB `role` is ADMIN (set automatically for `ADMIN_EMAILS` on sign-in), or
 *  - their email is listed in `ADMIN_EMAILS` right now.
 *
 * Non-admins are redirected home; they never see a 404-vs-403 distinction.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  const isAdmin = session?.user?.role === "ADMIN" || isAdminEmail(session?.user?.email);
  if (!isAdmin) redirect("/");

  return <>{children}</>;
}
