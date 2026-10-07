import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { PostCard, ProducerAvatar } from "@/components/site/PostCard";
import {
  POST_CARD_SELECT,
  POST_KIND_COLOR,
  POST_KIND_LABEL,
  frShortDate,
  nextSunday,
  plural,
  relativeDays,
  weekLabel,
  weekStart,
} from "@/lib/posts";
import { FollowButton, FollowSwitches } from "@/components/site/FollowControls";
import { cn } from "@/lib/cn";

const ARCHIVE_WEEKS = 4;

/** Espace particulier — « Mes producteurs » (maquette Espace Particulier). */
export async function ConsumerHome({
  userId,
  firstName,
  sundayMail,
  tab,
  showArchives,
  banner,
}: {
  userId: string;
  firstName: string;
  sundayMail: boolean;
  tab: "actus" | "gerer";
  showArchives: boolean;
  banner: React.ReactNode;
}) {
  const now = new Date();
  const thisMonday = weekStart(now);
  const oldest = new Date(thisMonday);
  oldest.setDate(oldest.getDate() - 7 * ARCHIVE_WEEKS);

  const follows = await withRetry(() =>
    prisma.producerFollow.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        notify: true,
        producer: {
          select: {
            id: true,
            slug: true,
            farmName: true,
            productionType: true,
            city: true,
            region: true,
            logoUrl: true,
            coverUrl: true,
            posts: {
              where: { forPublic: true },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { createdAt: true },
            },
          },
        },
      },
    }),
  );
  const followedIds = follows.map((f) => f.producer.id);

  const [posts, suggestions] = await Promise.all([
    followedIds.length
      ? withRetry(() =>
          prisma.producerPost.findMany({
            where: { producerId: { in: followedIds }, forPublic: true, createdAt: { gte: oldest } },
            orderBy: { createdAt: "desc" },
            take: 80,
            select: POST_CARD_SELECT,
          }),
        )
      : Promise.resolve([]),
    withRetry(() =>
      prisma.producerProfile.findMany({
        where: { id: { notIn: followedIds }, user: { status: "ACTIVE" } },
        orderBy: [{ posts: { _count: "desc" } }, { createdAt: "desc" }],
        take: 6,
        select: {
          id: true,
          slug: true,
          farmName: true,
          productionType: true,
          city: true,
          region: true,
          coverUrl: true,
        },
      }),
    ),
  ]);

  const weekPosts = posts.filter((p) => p.createdAt >= thisMonday);
  const archiveWeeks: { label: string; posts: typeof posts }[] = [];
  for (let i = 1; i <= ARCHIVE_WEEKS; i++) {
    const from = new Date(thisMonday);
    from.setDate(from.getDate() - 7 * i);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    const wk = posts.filter((p) => p.createdAt >= from && p.createdAt < to);
    if (wk.length) archiveWeeks.push({ label: weekLabel(from), posts: wk });
  }

  const inMail = follows.filter((f) => f.notify);
  const mailWithNews = inMail.filter((f) => weekPosts.some((p) => p.producer.id === f.producer.id)).length;
  const sunday = nextSunday(now).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const mailLine = !sundayMail
    ? "Le mail du dimanche est désactivé. Tout reste ici, dans votre fil."
    : mailWithNews
      ? `${sunday.charAt(0).toUpperCase()}${sunday.slice(1)}, votre récap réunira ${plural(mailWithNews, "producteur", "producteurs")}.`
      : "Rien à vous envoyer dimanche pour l'instant. On ne vous écrira pas pour rien.";

  return (
    <div className="px-5 pb-12 pt-6 lg:px-12 lg:pb-16 lg:pt-8">
      <div className="max-w-[880px]">
        {banner}
        <h1 className="font-display text-[28px] text-[var(--text-primary)]">Bonjour {firstName}</h1>
        <p className="mt-1.5 text-[14px] text-[var(--text-muted)]">
          {weekLabel(thisMonday)} · voici ce qui bouge chez vos producteurs
        </p>

        <div className="mt-7 flex gap-6 border-b border-[var(--border-subtle)]">
          <TabLink href="/compte" active={tab === "actus"}>
            Actus
          </TabLink>
          <TabLink href="/compte?onglet=gerer" active={tab === "gerer"}>
            Gérer mes producteurs
          </TabLink>
        </div>

        {tab === "actus" ? (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-m)] bg-[var(--rose-100)] px-[18px] py-3.5">
              <div className="flex items-center gap-3 text-[14px] text-green-900">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden>
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-10 6L2 7" />
                </svg>
                <span>{mailLine}</span>
              </div>
              <Link href="/compte?onglet=gerer" className="whitespace-nowrap text-[13px] font-bold text-green-900 hover:underline">
                Choisir qui y figure →
              </Link>
            </div>

            <div className="mt-8 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[18px] text-[var(--text-primary)]">Cette semaine</h2>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                {plural(weekPosts.length, "actu", "actus")}
              </span>
            </div>

            {weekPosts.length === 0 ? (
              <div className="mt-4 rounded-[var(--radius-l)] bg-[var(--surface-card)] px-7 py-12 text-center shadow-[var(--shadow-s)]">
                {follows.length === 0 ? (
                  <>
                    <p className="font-display text-[17px] text-[var(--text-primary)]">
                      Vous ne suivez encore aucun producteur.
                    </p>
                    <p className="mt-2 text-[14px] text-[var(--text-muted)] [text-wrap:pretty]">
                      Choisissez-en quelques-uns : leurs actus arriveront ici, et dans un petit récap le
                      dimanche matin.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-[17px] text-[var(--text-primary)]">
                      Calme plat dans les fermes.
                    </p>
                    <p className="mt-2 text-[14px] text-[var(--text-muted)] [text-wrap:pretty]">
                      Vos producteurs sont au champ, pas sur leur téléphone. Revenez plus tard, ou
                      suivez-en d&apos;autres.
                    </p>
                  </>
                )}
                <div className="mt-5 flex justify-center">
                  <Button href="/compte?onglet=gerer" variant="secondary">
                    Découvrir des producteurs
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                {weekPosts.map((post) => (
                  <PostCard key={post.id} post={post} audience="pub" />
                ))}
              </div>
            )}

            {/* Archives */}
            <div className="mt-12 border-t border-[var(--border-subtle)] pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-[18px] text-[var(--text-primary)]">
                  Semaines précédentes
                </h2>
                <Button
                  href={showArchives ? "/compte" : "/compte?archives=1"}
                  variant="ghost"
                  size="sm"
                  scroll={false}
                >
                  {showArchives ? "Masquer" : "Afficher les archives"}
                </Button>
              </div>
              {showArchives &&
                (archiveWeeks.length === 0 ? (
                  <p className="mt-3 text-[14px] text-[var(--text-muted)]">
                    Rien dans les {ARCHIVE_WEEKS} dernières semaines.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-col gap-7">
                    {archiveWeeks.map((wk) => (
                      <div key={wk.label}>
                        <div className="py-3 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                          {wk.label}
                        </div>
                        <div className="flex flex-col overflow-hidden rounded-[var(--radius-l)] bg-[var(--surface-card)] shadow-[var(--shadow-s)]">
                          {wk.posts.map((ap, i) => (
                            <Link
                              key={ap.id}
                              href={`/producteurs/${ap.producer.slug}`}
                              className={cn(
                                "flex items-center gap-4 px-5 py-4 hover:bg-[var(--surface-sunken)]",
                                i > 0 && "border-t border-[var(--border-subtle)]",
                              )}
                            >
                              {ap.imageUrl ? (
                                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-s)]">
                                  <Image src={ap.imageUrl} alt="" fill sizes="64px" className="object-cover" unoptimized />
                                </span>
                              ) : (
                                <ProducerAvatar name={ap.producer.farmName} size={64} rounded="m" />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-[12px] text-[var(--text-muted)]">
                                  {ap.producer.farmName} · {frShortDate(ap.createdAt)}
                                </div>
                                <div className="mt-0.5 text-[15px] font-bold text-[var(--text-primary)]">
                                  {ap.title}
                                </div>
                              </div>
                              <span
                                className="shrink-0 font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)]"
                                style={{ color: POST_KIND_COLOR[ap.kind] }}
                              >
                                {POST_KIND_LABEL[ap.kind]}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[var(--radius-m)] bg-[var(--surface-sunken)] px-4 py-3.5">
                <div className="text-[14px] font-bold text-[var(--text-primary)]">Suivre</div>
                <div className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
                  Ses actus arrivent dans votre fil.
                </div>
              </div>
              <div className="rounded-[var(--radius-m)] bg-[var(--surface-sunken)] px-4 py-3.5">
                <div className="text-[14px] font-bold text-[var(--text-primary)]">Mail du dimanche</div>
                <div className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
                  Elles figurent aussi dans votre récap hebdo.
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[18px] text-[var(--text-primary)]">Vos producteurs</h2>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                {plural(follows.length, "suivi", "suivis")}
              </span>
            </div>
            {follows.length === 0 ? (
              <p className="mt-4 rounded-[var(--radius-l)] bg-[var(--surface-card)] px-6 py-8 text-center text-[14px] text-[var(--text-muted)] shadow-[var(--shadow-s)]">
                Personne pour l&apos;instant. Commencez par les suggestions ci-dessous, ou parcourez{" "}
                <Link href="/producteurs" className="font-semibold text-[var(--text-brand)] hover:underline">
                  tous les producteurs
                </Link>
                .
              </p>
            ) : (
              <div className="mt-4 flex flex-col overflow-hidden rounded-[var(--radius-l)] bg-[var(--surface-card)] shadow-[var(--shadow-s)]">
                {follows.map(({ producer: p, notify }, i) => {
                  const last = p.posts[0]?.createdAt;
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "flex flex-wrap items-center gap-x-6 gap-y-4 px-5 py-[18px]",
                        i > 0 && "border-t border-[var(--border-subtle)]",
                      )}
                    >
                      <Link href={`/producteurs/${p.slug}`} className="flex min-w-[220px] flex-1 items-center gap-3.5">
                        {p.coverUrl || p.logoUrl ? (
                          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-m)]">
                            <Image src={(p.logoUrl || p.coverUrl)!} alt="" fill sizes="56px" className="object-cover" unoptimized />
                          </span>
                        ) : (
                          <ProducerAvatar name={p.farmName} size={56} rounded="m" />
                        )}
                        <div className="min-w-0">
                          <div className="text-[15px] font-bold text-[var(--text-primary)]">{p.farmName}</div>
                          <div className="text-[13px] text-[var(--text-muted)]">
                            {[p.productionType, p.city || p.region].filter(Boolean).join(" · ")}
                          </div>
                          <div className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                            {last ? `Dernière actu ${relativeDays(last, now)}` : "Pas encore d'actu"}
                          </div>
                        </div>
                      </Link>
                      <FollowSwitches producerId={p.id} notify={notify} />
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-12">
              <h2 className="font-display text-[18px] text-[var(--text-primary)]">Ils pourraient vous plaire</h2>
              <p className="mt-1.5 text-[14px] text-[var(--text-muted)]">
                Des producteurs du réseau, qui livrent déjà des restaurants.
              </p>
              {suggestions.length === 0 ? (
                <p className="mt-4 text-[14px] text-[var(--text-muted)]">
                  Vous suivez tout le monde. On vous prévient dès qu&apos;un nouveau producteur arrive.
                </p>
              ) : (
                <div className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
                  {suggestions.map((s) => (
                    <div key={s.id} className="flex flex-col overflow-hidden rounded-[var(--radius-l)] bg-[var(--surface-card)] shadow-[var(--shadow-m)]">
                      <Link href={`/producteurs/${s.slug}`} className="relative block aspect-[4/3] w-full bg-[var(--surface-sunken)]">
                        {s.coverUrl ? (
                          <Image src={s.coverUrl} alt="" fill sizes="280px" className="object-cover" unoptimized />
                        ) : (
                          <span className="flex h-full items-center justify-center font-display text-[22px] text-green-900">
                            {s.farmName.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </Link>
                      <div className="flex flex-1 flex-col gap-3.5 p-[18px]">
                        <div className="flex-1">
                          <div className="text-[15px] font-bold text-[var(--text-primary)]">{s.farmName}</div>
                          <div className="text-[13px] text-[var(--text-muted)]">
                            {[s.productionType, s.city || s.region].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                        <FollowButton producerId={s.id} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "-mb-px border-b-2 px-0.5 py-2.5 text-[15px] font-semibold",
        active
          ? "border-[var(--accent-primary)] text-[var(--text-primary)]"
          : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]",
      )}
    >
      {children}
    </Link>
  );
}
