import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { BlockRenderer } from "@/components/site/BlockRenderer";
import type { Block } from "@/lib/content";

async function getVisiblePage(slug: string) {
  const page = await withRetry(() => prisma.page.findUnique({ where: { slug } }));
  if (!page) return null;
  const now = new Date();
  const visible =
    page.status === "PUBLISHED" || (page.status === "SCHEDULED" && page.scheduledAt && page.scheduledAt <= now);
  return visible ? page : null;
}

export async function getPageMetadata(slug: string): Promise<Metadata> {
  const page = await getVisiblePage(slug);
  if (!page) return { title: "Page introuvable" };
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.excerpt || undefined,
  };
}

export async function InstitutionalPage({ slug }: { slug: string }) {
  const page = await getVisiblePage(slug);
  if (!page) notFound();

  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-[760px] px-[var(--container-pad)] py-20">
        <h1 className="text-pretty font-display text-[clamp(30px,4vw,44px)] leading-[var(--leading-tight)] text-[var(--text-primary)]">
          {page.title}
        </h1>
        {page.excerpt && (
          <p className="mt-5 text-pretty text-[18px] leading-relaxed text-[var(--text-secondary)]">
            {page.excerpt}
          </p>
        )}
        <div className="mt-10 flex flex-col gap-6 text-[16px] leading-[1.75] text-[var(--text-secondary)]">
          <BlockRenderer blocks={page.body as unknown as Block[]} />
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
