"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/tracking";

export function TrackingClickEvents() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const tracked = target?.closest("[data-track]") as HTMLElement | null;

      if (!tracked) {
        return;
      }

      trackEvent("cta_click", {
        action: tracked.getAttribute("data-track"),
        label: tracked.textContent?.trim(),
      });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
