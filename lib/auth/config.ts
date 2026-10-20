import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { trackSignup } from "@/lib/analytics/tracker";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      language: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    language: string;
  }
}

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
  },
  events: {
    /**
     * New account created via Google → record the signup for admin analytics.
     */
    async createUser({ user }) {
      try {
        await trackSignup();
      } catch (err) {
        console.error("[auth] failed to track signup:", err);
      }
    },
    /**
     * Promote any email listed in `ADMIN_EMAILS` to ADMIN on sign-in.
     * Keeps the allow-list in env as the single source of truth, while the
     * `User.role` column backs fast database checks in the admin dashboard.
     */
    async signIn({ user }) {
      if (!user?.id) return;
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            ...(isAdminEmail(user.email) ? { role: "ADMIN" as const } : {}),
          },
        });
      } catch (err) {
        console.error("[auth] failed to update sign-in metadata:", err);
      }
    },
  },
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.language = user.language;
      }
      return session;
    },
    authorized: async ({ auth, request }) => {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/admin")) {
        return auth?.user?.role === "ADMIN";
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
});
