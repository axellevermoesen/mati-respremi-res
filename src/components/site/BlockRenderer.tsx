import Image from "next/image";
import type { Block } from "@/lib/content";
import { InlineText } from "@/components/site/InlineText";

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((b, i) => (
        <BodyBlock key={i} b={b} />
      ))}
    </div>
  );
}

function BodyBlock({ b }: { b: Block }) {
  switch (b.t) {
    case "p":
      return (
        <p className="text-pretty">
          <InlineText text={b.text} />
        </p>
      );
    case "h2":
      return (
        <h2
          id={b.id}
          className="scroll-mt-28 pt-4 font-display text-[26px] leading-[var(--leading-snug)] tracking-[var(--tracking-tight)] text-[var(--text-primary)]"
        >
          {b.text}
        </h2>
      );
    case "h3":
      return (
        <h3
          id={b.id}
          className="scroll-mt-28 pt-2 font-display text-[20px] leading-[var(--leading-snug)] text-[var(--text-primary)]"
        >
          {b.text}
        </h3>
      );
    case "quote":
      return (
        <div className="rounded-[var(--radius-l)] border-l-[3px] border-rose-600 bg-[var(--surface-card)] px-9 py-8 shadow-[var(--shadow-m)]">
          <div className="text-pretty font-display text-[22px] leading-[var(--leading-snug)] text-green-900">
            «&nbsp;<InlineText text={b.text} />&nbsp;»
          </div>
          {b.cite && <div className="mt-4 text-[13px] text-[var(--text-muted)]">{b.cite}</div>}
        </div>
      );
    case "list":
      return (
        <div className="flex flex-col gap-3">
          {b.items.map((it, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="pt-0.5 font-display text-[15px] text-[var(--accent-structural,#73986f)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>
                <InlineText text={it} />
              </span>
            </div>
          ))}
        </div>
      );
    case "callout":
      return (
        <div className="rounded-[var(--radius-l)] bg-green-900 p-10">
          <div className="mb-4 font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-[var(--rose-300,#d698ab)]">
            {b.kicker}
          </div>
          <div className="flex flex-col gap-3.5 text-[16px] leading-relaxed text-[hsl(45_30%_96%_/_0.85)] [&_a]:text-[var(--rose-300,#d698ab)] [&_a:hover]:text-white">
            {b.items.map((it, i) => (
              <div key={i}>
                <InlineText text={it} />
              </div>
            ))}
          </div>
        </div>
      );
    case "img":
      return (
        <figure className="m-0">
          <div className="overflow-hidden rounded-[var(--radius-l)]">
            <Image
              src={b.src}
              alt={b.alt}
              width={1200}
              height={640}
              className="h-auto w-full object-cover"
            />
          </div>
          {b.caption && (
            <figcaption className="mt-3 text-[13px] text-[var(--text-muted)]">{b.caption}</figcaption>
          )}
        </figure>
      );
  }
}
