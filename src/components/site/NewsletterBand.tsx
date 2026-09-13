"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function NewsletterBand({
  kicker = "La newsletter",
  title = "Un mail par semaine. Zéro recette de grand-mère.",
  text = "Ce qu'on a compris cette semaine sur la production alimentaire, écrit court et vérifié. Tu peux te désabonner en un clic, on ne le prendra pas mal.",
  tone = "rose",
  className,
}: {
  kicker?: string;
  title?: string;
  text?: string;
  tone?: "rose" | "sand";
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <section
      className={cn(
        "flex flex-col items-center gap-4 rounded-[var(--radius-xl)] px-8 py-14 text-center sm:px-12",
        tone === "rose" ? "bg-[var(--rose-100)]" : "bg-[var(--surface-sunken)]",
        className,
      )}
    >
      <div className="font-mono text-[12px] font-bold uppercase tracking-[var(--tracking-wide)] text-rose-600">
        {kicker}
      </div>
      <div className="max-w-[24ch] font-display text-[clamp(22px,2.4vw,30px)] leading-[var(--leading-snug)] text-green-900">
        {title}
      </div>
      {text && (
        <p className="max-w-[52ch] text-[15px] leading-relaxed text-[var(--text-secondary)]">
          {text}
        </p>
      )}
      {done ? (
        <div className="rounded-[var(--radius-m)] bg-[var(--surface-card)] px-6 py-4 text-[15px] font-bold text-green-900 shadow-[var(--shadow-s)]">
          C&apos;est noté. Le prochain numéro part jeudi.
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) setDone(true);
          }}
          className="mt-1 flex w-full max-w-[520px] flex-wrap items-center justify-center gap-2.5"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="prenom@restaurant.fr"
            className="h-11 min-w-[240px] flex-1 rounded-[var(--radius-s)] bg-[var(--surface-card)] px-3.5 text-[15px] text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border-default)] outline-none placeholder:text-[var(--text-muted)] focus:shadow-[0_0_0_3px_hsl(150_25%_33%_/_0.18),inset_0_0_0_1px_var(--border-focus)]"
          />
          <Button type="submit">Je m&apos;abonne</Button>
        </form>
      )}
    </section>
  );
}
