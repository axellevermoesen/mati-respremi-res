import type { ReactNode } from "react";
import { parseInline, type Inline } from "@/lib/inline";

function render(nodes: Inline[]): ReactNode[] {
  return nodes.map((n, i) => {
    if (typeof n === "string") return n;
    const kids = render(n.c);
    if (n.t === "b") return <strong key={i}>{kids}</strong>;
    if (n.t === "i") return <em key={i}>{kids}</em>;
    const external = /^https?:\/\//i.test(n.href);
    return (
      <a
        key={i}
        href={n.href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="font-semibold text-green-700 underline underline-offset-2 hover:text-green-900"
      >
        {kids}
      </a>
    );
  });
}

export function InlineText({ text }: { text: string }) {
  return <>{render(parseInline(text))}</>;
}
