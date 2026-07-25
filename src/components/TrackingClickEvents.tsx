"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackEvent } from "@/lib/tracking";

export function TrackingClickEvents() {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent("page_view", {});
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const tracked = target?.closest("[data-track]") as HTMLElement | null;

      if (!tracked) {
        return;
      }

      const action = tracked.getAttribute("data-track") ?? "unknown";
      trackEvent(action.startsWith("portal_upgrade_") ? "portal_upgrade_click" : "cta_click", {
        action,
        label: tracked.textContent?.trim(),
      });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
