"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { Tag } from "@/components/ui/Tag";
import type { Episode } from "@prisma/client";
import { frDate, episodeDuration } from "@/lib/content";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

const PLATFORMS = ["Spotify", "Apple Podcasts", "RSS"];

export function PodcastHub({
  episodes,
  topics,
}: {
  episodes: Episode[];
  topics: string[];
}) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("Tout");
  const [epId, setEpId] = useState(episodes[0]?.slug ?? "");
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const current = episodes.find((e) => e.slug === epId) ?? episodes[0];

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = undefined;
  };
  useEffect(() => stop, []);

  useEffect(() => {
    if (!playing) {
      stop();
      return;
    }
    stop();
    timer.current = setInterval(() => {
      setT((prev) => {
        if (prev + 1 >= current.seconds) {
          setPlaying(false);
          return current.seconds;
        }
        return prev + 1;
      });
    }, 1000);
    return stop;
  }, [playing, current.seconds]);

  function selectEpisode(slug: string) {
    stop();
    setEpId(slug);
    setT(0);
    setPlaying(true);
  }

  const q = query.trim().toLowerCase();
  const list = useMemo(
    () =>
      episodes.filter((e) => {
        const okT = topic === "Tout" || e.topic === topic;
        const okQ =
          !q ||
          `${e.title} ${e.guest} ${e.role} ${e.excerpt} ${e.topic}`.toLowerCase().includes(q);
        return okT && okQ;
      }),
    [episodes, topic, q],
  );

  const progress = current.seconds ? Math.min(100, (t / current.seconds) * 100) : 0;

  return (
    <>
      {/* En ce moment */}
      <div className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] pt-24">
        <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-600">
          En ce moment
        </div>
        <div className="mt-5 flex flex-wrap overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface-card)] shadow-[var(--shadow-l)]">
          <div className="relative min-h-[300px] flex-[1_1_320px]">
            <Image
              src={current.img}
              alt={current.guest}
              fill
              sizes="(max-width: 768px) 100vw, 500px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-[1_1_420px] flex-col justify-center gap-4 p-9 sm:p-12">
            <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-brand)]">
              Épisode {current.num} · {frDate(current.publishedAt!)}
            </div>
            <div className="text-pretty font-display text-[28px] leading-[var(--leading-snug)] text-[var(--text-primary)]">
              {current.title}
            </div>
            <p className="text-pretty text-[16px] leading-relaxed text-[var(--text-secondary)]">
              {current.excerpt}
            </p>
            <div className="flex items-center gap-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--rose-100)] font-display text-[13px] text-green-900">
                {current.initials}
              </span>
              <div>
                <div className="text-[14px] font-bold text-[var(--text-primary)]">
                  {current.guest}
                </div>
                <div className="text-[13px] text-[var(--text-muted)]">{current.role}</div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-5">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? "Pause" : "Lecture"}
                className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-green-700 text-white shadow-[var(--shadow-s)] hover:bg-green-900"
              >
                {playing ? (
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="ml-[3px] h-[18px] w-[18px] fill-current">
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                )}
              </button>
              <div className="flex flex-1 flex-col gap-2">
                <button
                  type="button"
                  aria-label="Avancer dans l'épisode"
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setT(Math.round(((e.clientX - r.left) / r.width) * current.seconds));
                  }}
                  className="relative h-1.5 w-full rounded-[var(--radius-pill)] bg-[var(--sand-200)]"
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-[var(--radius-pill)] bg-green-700"
                    style={{ width: `${progress.toFixed(2)}%` }}
                  />
                </button>
                <div className="flex justify-between font-display text-[12px] text-[var(--text-muted)]">
                  <span>{fmt(t)}</span>
                  <span>{episodeDuration(current.seconds).clock}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2.5">
              {PLATFORMS.map((p) => (
                <span
                  key={p}
                  className="rounded-[var(--radius-m)] bg-[var(--surface-card)] px-4 py-2 text-[13px] font-semibold text-[var(--text-secondary)] shadow-[inset_0_0_0_1px_var(--border-default)]"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tous les épisodes */}
      <div className="mx-auto w-full max-w-[var(--container-max)] px-[var(--container-pad)] pb-20 pt-24">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-6">
          <div>
            <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--accent-structural,#73986f)]">
              Tous les épisodes
            </div>
            <h2 className="mt-2 font-display text-[var(--text-display-m)] text-[var(--text-primary)]">
              {episodes.length} conversations, {episodes.length} métiers
            </h2>
            <p className="mt-3 max-w-[560px] text-[16px] leading-relaxed text-[var(--text-secondary)]">
              Un nouvel épisode tous les quinze jours. Toujours avec quelqu&apos;un qui produit,
              jamais avec quelqu&apos;un qui commente.
            </p>
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un invité, un sujet…"
            className="h-11 w-full min-w-[260px] max-w-[340px] flex-1 rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3.5 text-[15px] shadow-[inset_0_0_0_1px_var(--border-default)] outline-none placeholder:text-[var(--text-muted)] focus:shadow-[0_0_0_3px_hsl(150_25%_33%_/_0.18),inset_0_0_0_1px_var(--border-focus)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] pb-8">
          <span className="mr-2 font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
            Filière
          </span>
          {topics.map((tp) => (
            <Tag key={tp} selected={topic === tp} onClick={() => setTopic(tp)}>
              {tp}
            </Tag>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="mt-8 rounded-[var(--radius-l)] bg-[var(--surface-sunken)] p-16 text-center">
            <div className="font-display text-[21px] text-[var(--text-primary)]">
              Aucun épisode sous ce filtre. Ça arrive.
            </div>
            <div className="mt-2 text-[15px] text-[var(--text-secondary)]">
              Essayez une autre filière, il y a forcément quelqu&apos;un qui en parle.
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {list.map((e) => {
              const on = e.slug === epId;
              return (
                <button
                  key={e.slug}
                  type="button"
                  onClick={() => selectEpisode(e.slug)}
                  className={cn(
                    "flex flex-wrap items-center gap-5 border-b border-[var(--border-subtle)] px-2 py-6 text-left",
                    on ? "bg-[var(--surface-sunken)]" : "hover:bg-[var(--surface-sunken)]",
                  )}
                >
                  <span className="relative flex-none">
                    <span className="relative block h-[84px] w-[112px] overflow-hidden rounded-[var(--radius-s)] bg-[var(--sand-100)]">
                      <Image src={e.img} alt="" fill sizes="112px" className="object-cover" />
                    </span>
                    <span className="absolute inset-0 grid place-items-center">
                      <span
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-full shadow-[var(--shadow-s)]",
                          on ? "bg-rose-600" : "bg-[hsl(45_30%_98%_/_0.92)]",
                        )}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className={cn("ml-0.5 h-3.5 w-3.5", on ? "fill-white" : "fill-green-900")}
                        >
                          <path d="M8 5.5v13l11-6.5z" />
                        </svg>
                      </span>
                    </span>
                  </span>
                  <span className="min-w-0 flex-[1_1_320px]">
                    <span className="flex items-center gap-2.5">
                      <span className="font-display text-[13px] text-[var(--accent-structural,#73986f)]">
                        Ép. {e.num}
                      </span>
                      <span className="font-mono text-[11px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                        {e.topic}
                      </span>
                    </span>
                    <span className="mt-2 block text-pretty font-display text-[19px] leading-[var(--leading-snug)] text-[var(--text-primary)]">
                      {e.title}
                    </span>
                    <span className="mt-2 block text-pretty text-[14px] leading-relaxed text-[var(--text-secondary)]">
                      {e.excerpt}
                    </span>
                  </span>
                  <span className="flex flex-none basis-[200px] flex-col gap-1.5">
                    <span className="text-[14px] font-bold text-[var(--text-primary)]">
                      {e.guest}
                    </span>
                    <span className="text-[13px] text-[var(--text-muted)]">{e.role}</span>
                    <span className="text-[13px] text-[var(--text-muted)]">
                      {episodeDuration(e.seconds).durationLabel} · {frDate(e.publishedAt!)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
