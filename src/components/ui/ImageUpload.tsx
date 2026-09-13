"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { uploadProducerImage, removeProducerImage } from "@/lib/actions/upload";
import { cn } from "@/lib/cn";

type Kind = "cover" | "logo" | "product" | "media";

export function ImageUpload({
  kind,
  productId,
  slot,
  initialUrl,
  shape = "rect",
  aspect = "video",
  compact = false,
  className,
  label,
  hint,
  disabled,
  disabledHint,
  onChange,
}: {
  kind: Kind;
  productId?: string;
  slot?: number;
  initialUrl?: string | null;
  shape?: "rect" | "circle";
  aspect?: "video" | "square";
  compact?: boolean;
  className?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
  disabledHint?: string;
  onChange?: (url: string | null) => void;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const [error, setError] = useState<string>();
  const [busy, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (file: File) => {
    setError(undefined);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("kind", kind);
    if (productId) fd.set("productId", productId);
    if (slot !== undefined) fd.set("slot", String(slot));
    start(async () => {
      const res = await uploadProducerImage(fd);
      if ("error" in res) setError(res.error);
      else {
        setUrl(res.url);
        onChange?.(res.url);
      }
    });
  };

  const clear = () => {
    setError(undefined);
    start(async () => {
      const ref = kind === "product" ? productId : kind === "media" ? String(slot) : undefined;
      const res = await removeProducerImage(kind, ref);
      if ("error" in res) setError(res.error);
      else {
        setUrl(null);
        onChange?.(null);
      }
    });
  };

  const rounded = shape === "circle" ? "rounded-full" : "rounded-[var(--radius-m)]";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <span className="mp-lab">{label}</span>}
      <div
        className={cn(
          "group relative flex items-center justify-center overflow-hidden bg-[var(--surface-sunken)] text-center",
          rounded,
          shape === "circle" || aspect === "square" ? "aspect-square" : "aspect-[16/9]",
          !disabled && "cursor-pointer",
        )}
        onClick={() => !disabled && !busy && inputRef.current?.click()}
      >
        {url ? (
          <Image src={url} alt={label ?? ""} fill className="object-cover" sizes="400px" unoptimized />
        ) : (
          <span className="px-3 text-[12px] text-[var(--text-muted)]">
            {disabled ? disabledHint ?? "Indisponible" : busy ? "Envoi…" : "Choisir un fichier"}
          </span>
        )}
        {url && !disabled && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[hsl(150_30%_8%_/_0.45)] text-[12px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
            {busy ? "Envoi…" : "Remplacer"}
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pick(f);
          e.target.value = "";
        }}
      />

      <div className={cn("flex items-center gap-3 text-[12px]", compact && "hidden")}>
        {!disabled && (
          <button
            type="button"
            className="font-semibold text-[var(--text-brand)] hover:underline disabled:opacity-50"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {url ? "Remplacer" : "Choisir un fichier"}
          </button>
        )}
        {url && !disabled && (
          <button
            type="button"
            className="font-semibold text-[var(--state-danger)] hover:underline disabled:opacity-50"
            disabled={busy}
            onClick={clear}
          >
            Retirer
          </button>
        )}
        {hint && !error && <span className="text-[var(--text-muted)]">{hint}</span>}
        {error && <span className="font-medium text-[var(--state-danger)]">{error}</span>}
      </div>
      {compact && error && (
        <span className="text-[11px] font-medium text-[var(--state-danger)]">{error}</span>
      )}
    </div>
  );
}
