import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { sendEmail } from "@/lib/brevo";
import { weeklyDigestEmail } from "@/lib/emails";
import { siteUrl } from "@/lib/tokens";
import { POST_KIND_LABEL, weekLabel, weekStart } from "@/lib/posts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * « Mail du dimanche » : chaque dimanche matin (planifié dans vercel.json), chaque
 * particulier reçoit les actus grand public des 7 derniers jours des producteurs
 * qu'il a cochés « Mail du dimanche ». Pas d'actu → pas de mail.
 *
 * Vercel appelle cette adresse avec `Authorization: Bearer <CRON_SECRET>`.
 * En local (sans CRON_SECRET), on peut la tester à la main ; `?dry=1` liste ce
 * qui partirait sans rien envoyer.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authz = request.headers.get("authorization");
  if (secret ? authz !== `Bearer ${secret}` : process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const dry = new URL(request.url).searchParams.get("dry") === "1";

  const now = new Date();
  const since = new Date(now.getTime() - 7 * 86_400_000);

  const users = await withRetry(() =>
    prisma.user.findMany({
      where: {
        role: "CONSUMER",
        status: { not: "SUSPENDED" },
        consumerProfile: { sundayMail: true },
        follows: { some: { notify: true } },
      },
      select: {
        email: true,
        name: true,
        consumerProfile: { select: { firstName: true } },
        follows: { where: { notify: true }, select: { producerId: true } },
      },
    }),
  );

  const report: { email: string; posts: number }[] = [];
  for (const u of users) {
    const posts = await withRetry(() =>
      prisma.producerPost.findMany({
        where: {
          forPublic: true,
          createdAt: { gte: since },
          producerId: { in: u.follows.map((f) => f.producerId) },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          kind: true,
          title: true,
          body: true,
          producer: { select: { farmName: true, slug: true } },
        },
      }),
    );
    if (!posts.length) continue;

    report.push({ email: u.email, posts: posts.length });
    if (dry) continue;

    const mail = weeklyDigestEmail({
      firstName: u.consumerProfile?.firstName || u.name?.split(/\s+/)[0] || "",
      week: weekLabel(weekStart(now)),
      items: posts.map((p) => ({
        producer: p.producer.farmName,
        kind: POST_KIND_LABEL[p.kind],
        title: p.title,
        excerpt: p.body.length > 220 ? `${p.body.slice(0, 217).trimEnd()}…` : p.body,
        url: siteUrl(`/producteurs/${p.producer.slug}#actus`),
      })),
      feedUrl: siteUrl("/compte"),
      settingsUrl: siteUrl("/compte?onglet=gerer"),
    });
    await sendEmail({ to: u.email, toName: u.name ?? undefined, ...mail });
  }

  return NextResponse.json({ dry, candidates: users.length, recipients: report.length, report });
}
