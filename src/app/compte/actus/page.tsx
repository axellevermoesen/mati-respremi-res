import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { PostCard } from "@/components/site/PostCard";
import { POST_CARD_SELECT, plural } from "@/lib/posts";
import { PostComposer } from "./PostComposer";
import { DeletePostButton } from "./DeletePostButton";

export const metadata: Metadata = { title: "Mes actus" };

export default async function ActusPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (session.user.role !== "PRODUCER") redirect("/compte");

  const producer = await withRetry(() =>
    prisma.producerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, farmName: true },
    }),
  );
  if (!producer) redirect("/inscription/producteur");

  const [posts, followers] = await Promise.all([
    withRetry(() =>
      prisma.producerPost.findMany({
        where: { producerId: producer.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: POST_CARD_SELECT,
      }),
    ),
    withRetry(() =>
      prisma.producerFollow.findMany({
        where: { producerId: producer.id },
        select: { user: { select: { role: true } } },
      }),
    ),
  ]);

  const proFollowers = followers.filter(
    (f) => f.user.role === "RESTAURANT" || f.user.role === "RESELLER",
  ).length;
  const publicFollowers = followers.filter(
    (f) => f.user.role === "CONSUMER",
  ).length;

  return (
    <div className="px-6 py-8 sm:px-10 lg:px-12">
      <div className="max-w-[880px]">
        <h1 className="font-display text-[var(--text-display-m)] text-[var(--text-primary)]">
          Mes actus
        </h1>
        <p className="mt-1.5 max-w-[620px] text-[14px] leading-[var(--leading-relaxed)] text-[var(--text-muted)]">
          Un arrivage, des portes ouvertes, un plat chez un client : partagez ce
          qui bouge à la ferme. Choisissez qui le reçoit — vos clients pros, les
          particuliers qui vous suivent, ou les deux, avec un message différent
          pour chacun si besoin.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Stat
            label="Pros qui vous suivent"
            value={plural(
              proFollowers,
              "restaurateur ou revendeur",
              "restaurateurs ou revendeurs",
            )}
          />
          <Stat
            label="Particuliers qui vous suivent"
            value={plural(publicFollowers, "abonné", "abonnés")}
          />
        </div>

        <PostComposer />

        <div className="mt-12 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-[18px] text-[var(--text-primary)]">
            Déjà publiées
          </h2>
          <span className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
            {plural(posts.length, "actu", "actus")}
          </span>
        </div>

        {posts.length === 0 ? (
          <p className="mt-4 rounded-[var(--radius-l)] bg-[var(--surface-card)] px-7 py-10 text-center text-[14px] text-[var(--text-muted)] shadow-[var(--shadow-s)]">
            Rien de publié pour l&apos;instant. Une photo des champs suffit pour
            commencer.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                audience={post.forPublic ? "pub" : "pro"}
                showProducer={false}
                footer={
                  <>
                    {post.forPros && post.forPublic && post.bodyPro && (
                      <div className="mt-4 rounded-[var(--radius-m)] bg-[var(--surface-sunken)] px-4 py-3 text-[13px] leading-[var(--leading-relaxed)] text-[var(--text-secondary)]">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                          Version pros ·{" "}
                        </span>
                        {post.bodyPro}
                      </div>
                    )}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-4">
                      <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--text-muted)]">
                        Envoyée à
                        {post.forPros && <AudiencePill>Pros</AudiencePill>}
                        {post.forPublic && (
                          <AudiencePill>Particuliers</AudiencePill>
                        )}
                        {post.forPros && post.forPublic && post.bodyPro && (
                          <span>· texte différent pour les pros</span>
                        )}
                      </div>
                      <DeletePostButton id={post.id} />
                    </div>
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-m)] bg-[var(--surface-sunken)] px-4 py-3.5">
      <div className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-1 text-[15px] font-bold text-[var(--text-primary)]">
        {value}
      </div>
    </div>
  );
}

function AudiencePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-[var(--radius-pill)] bg-[var(--rose-100)] px-2.5 py-0.5 text-[12px] font-semibold text-green-900">
      {children}
    </span>
  );
}
