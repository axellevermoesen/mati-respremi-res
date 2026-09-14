import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import type { Block } from "@/lib/content";
import { PageEditor, type PageFormValues } from "../PageEditor";

function toLocalDateTimeInput(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await withRetry(() => prisma.page.findUnique({ where: { id } }));
  if (!page) notFound();

  const initial: PageFormValues = {
    id: page.id,
    title: page.title,
    slug: page.slug,
    excerpt: page.excerpt,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    status: page.status,
    scheduledAt: toLocalDateTimeInput(page.scheduledAt),
    body: page.body as unknown as Block[],
  };

  return <PageEditor initial={initial} />;
}
