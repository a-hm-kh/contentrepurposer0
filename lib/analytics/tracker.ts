import { prisma } from "@/lib/db";

export async function trackGeneration() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.siteAnalytics.upsert({
    where: { date: today },
    create: { date: today, generations: 1 },
    update: { generations: { increment: 1 } },
  });
}

export async function trackModification() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.siteAnalytics.upsert({
    where: { date: today },
    create: { date: today, modifications: 1 },
    update: { modifications: { increment: 1 } },
  });
}

export async function trackSignup() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.siteAnalytics.upsert({
    where: { date: today },
    create: { date: today, signups: 1 },
    update: { signups: { increment: 1 } },
  });
}

export async function trackVisit() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.siteAnalytics.upsert({
    where: { date: today },
    create: { date: today, uniqueVisitors: 1, pageViews: 1 },
    update: {
      uniqueVisitors: { increment: 1 },
      pageViews: { increment: 1 },
    },
  });
}
