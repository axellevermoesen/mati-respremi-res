import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { ConsumerSettingsForm } from "./ConsumerSettingsForm";

export const metadata: Metadata = { title: "Mon compte" };

export default async function ProfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (session.user.role !== "CONSUMER") redirect("/compte");

  const user = await withRetry(() =>
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        name: true,
        createdAt: true,
        consumerProfile: true,
        follows: { select: { notify: true } },
      },
    }),
  );
  if (!user) redirect("/connexion");

  const c = user.consumerProfile;
  const since = user.createdAt.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="px-5 pb-12 pt-6 lg:px-12 lg:pb-16 lg:pt-8">
      <div className="max-w-[880px]">
        <h1 className="font-display text-[28px] text-[var(--text-primary)]">Mon compte</h1>
        <p className="mt-1.5 text-[14px] text-[var(--text-muted)]">
          Compte particulier · membre depuis {since}
        </p>
        <ConsumerSettingsForm
          email={user.email}
          initial={{
            firstName: c?.firstName ?? user.name?.split(/\s+/)[0] ?? "",
            lastName: c?.lastName ?? "",
            phone: c?.phone ?? "",
            city: c?.city ?? "",
            radius: c?.radius ?? "20 km",
            sundayMail: c?.sundayMail ?? true,
          }}
          followed={user.follows.length}
          inMail={user.follows.filter((f) => f.notify).length}
        />
      </div>
    </div>
  );
}
