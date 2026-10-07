"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { setFollow, setFollowNotify } from "@/lib/actions/follows";
import { cn } from "@/lib/cn";

/** Ligne « Vos producteurs » : interrupteurs Suivre + Mail du dimanche. */
export function FollowSwitches({ producerId, notify }: { producerId: string; notify: boolean }) {
  const router = useRouter();
  const [mail, setMail] = useState(notify);
  const [busy, start] = useTransition();
  const [error, setError] = useState<string>();

  const run = (fn: () => Promise<{ ok: true } | { error: string }>, rollback?: () => void) =>
    start(async () => {
      setError(undefined);
      const res = await fn();
      if ("error" in res) {
        setError(res.error);
        rollback?.();
      } else router.refresh();
    });

  return (
    <div className={cn("flex flex-wrap items-center gap-x-7 gap-y-3", busy && "opacity-60")}>
      <label className="flex items-center gap-2.5 text-[14px] font-semibold text-[var(--text-secondary)]">
        <Switch checked label="Suivre" onChange={() => run(() => setFollow(producerId, false))} />
        Suivre
      </label>
      <label className="flex items-center gap-2.5 text-[14px] font-semibold text-[var(--text-secondary)]">
        <Switch
          checked={mail}
          label="Mail du dimanche"
          onChange={(next) => {
            setMail(next);
            run(() => setFollowNotify(producerId, next), () => setMail(!next));
          }}
        />
        Mail du dimanche
      </label>
      {error && <span className="text-[13px] text-[var(--state-danger)]">{error}</span>}
    </div>
  );
}

/** Bouton « Suivre » d'une carte suggestion. */
export function FollowButton({ producerId }: { producerId: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="w-full"
      disabled={busy}
      onClick={() =>
        start(async () => {
          const res = await setFollow(producerId, true);
          if (!("error" in res)) router.refresh();
        })
      }
    >
      {busy ? "…" : "Suivre"}
    </Button>
  );
}

/**
 * Bouton de la page publique d'un producteur. Visiteur → lien vers la connexion ;
 * particulier ou pro → suivre / ne plus suivre.
 */
export function ProducerFollowToggle({
  producerId,
  followed,
  canFollow,
  loggedIn,
  audience,
}: {
  producerId: string;
  followed: boolean;
  canFollow: boolean;
  loggedIn: boolean;
  audience: "pro" | "pub";
}) {
  const router = useRouter();
  const [on, setOn] = useState(followed);
  const [busy, start] = useTransition();
  const [error, setError] = useState<string>();

  if (!loggedIn) {
    return (
      <Button href="/connexion" variant="outline" className="w-full">
        Suivre ses actus
      </Button>
    );
  }
  if (!canFollow) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant={on ? "ghost" : "outline"}
        className={cn("w-full", on && "shadow-[inset_0_0_0_1px_var(--border-default)]")}
        disabled={busy}
        onClick={() => {
          const next = !on;
          setOn(next);
          start(async () => {
            setError(undefined);
            const res = await setFollow(producerId, next);
            if ("error" in res) {
              setOn(!next);
              setError(res.error);
            } else router.refresh();
          });
        }}
      >
        {on ? "✓ Vous suivez ses actus" : "Suivre ses actus"}
      </Button>
      {on && (
        <span className="text-center text-[12px] text-[var(--text-muted)]">
          {audience === "pro" ? (
            <>Ses actus pros arrivent dans <Link href="/compte" className="underline">votre espace</Link>.</>
          ) : (
            <>Ses actus arrivent dans <Link href="/compte" className="underline">votre fil</Link> et le mail du dimanche.</>
          )}
        </span>
      )}
      {error && <span className="text-center text-[12px] text-[var(--state-danger)]">{error}</span>}
    </div>
  );
}
