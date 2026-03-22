"use client";

import { useMemo, useState, ReactNode } from "react";

export type TabItem<T extends string> = {
  key: T;
  label: string;
  content: ReactNode;
};

export function Tabs<T extends string>({
  items,
  initialKey,
}: {
  items: TabItem<T>[];
  initialKey?: T;
}) {
  const defaultKey = useMemo(() => initialKey ?? items[0]?.key, [initialKey, items]);
  const [active, setActive] = useState<T>(defaultKey);

  const activeItem = items.find((i) => i.key === active) ?? items[0];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => {
          const isActive = i.key === active;
          return (
            <button
              key={i.key}
              type="button"
              onClick={() => setActive(i.key)}
              className={[
                "rounded-xl px-4 py-2 text-sm font-semibold border",
                isActive
                  ? "border-amber-500 bg-amber-500 text-slate-950"
                  : "border-stone-200 bg-white text-slate-800 hover:bg-stone-50",
              ].join(" ")}
            >
              {i.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">{activeItem?.content}</div>
    </div>
  );
}
