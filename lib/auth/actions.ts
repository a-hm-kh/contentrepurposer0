"use server";

import { signOut } from "@/lib/auth/config";

/** Server action: sign the current user out and return them to the landing page. */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
