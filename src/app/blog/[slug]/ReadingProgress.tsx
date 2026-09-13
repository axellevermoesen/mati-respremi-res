"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [ratio, setRatio] = useState(0);

  useEffect(() => {
    const compute = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setRatio(max > 0 ? Math.min(1, Math.max(0, h.scrollTop / max)) : 0);
    };
    const id = requestAnimationFrame(compute);
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-40 h-[3px] bg-transparent">
      <div
        className="h-full bg-rose-600 transition-[width] duration-75 ease-linear"
        style={{ width: `${(ratio * 100).toFixed(1)}%` }}
      />
    </div>
  );
}
