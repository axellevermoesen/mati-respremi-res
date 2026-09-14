"use client";

import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Brouillon" },
  { value: "SCHEDULED", label: "Programmée" },
  { value: "PUBLISHED", label: "En ligne" },
];

export function StatusField({
  status,
  setStatus,
  scheduledAt,
  setScheduledAt,
}: {
  status: string;
  setStatus: (v: string) => void;
  scheduledAt: string;
  setScheduledAt: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-l)] bg-[var(--surface-card)] p-6 shadow-[var(--shadow-m)]">
      <Select
        name="status"
        label="État"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        options={STATUS_OPTIONS}
      />
      {status === "SCHEDULED" && (
        <Input
          name="scheduledAt"
          type="datetime-local"
          label="Publier automatiquement le"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
      )}
    </div>
  );
}
