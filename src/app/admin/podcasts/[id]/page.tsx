import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { withRetry } from "@/lib/db";
import { EpisodeEditor, type EpisodeFormValues } from "../EpisodeEditor";

function toLocalDateTimeInput(d: Date | null): string {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditAdminEpisode({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const episode = await withRetry(() => prisma.episode.findUnique({ where: { id } }));
  if (!episode) notFound();

  const initial: EpisodeFormValues = {
    id: episode.id,
    title: episode.title,
    slug: episode.slug,
    num: episode.num,
    excerpt: episode.excerpt,
    topic: episode.topic,
    guest: episode.guest,
    role: episode.role,
    initials: episode.initials,
    img: episode.img,
    seconds: episode.seconds,
    status: episode.status,
    scheduledAt: toLocalDateTimeInput(episode.scheduledAt),
  };

  return <EpisodeEditor initial={initial} />;
}
