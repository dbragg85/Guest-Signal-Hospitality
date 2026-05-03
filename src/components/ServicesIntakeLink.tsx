import Link from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link>;

/**
 * `output: "export"` on GitHub Pages has no RSC server. Default `<Link prefetch>` tries to fetch
 * a flight payload for `/services/inquiry/*` and throws (console: "Failed to fetch RSC payload",
 * `TypeError: a[e] is not a function`). Disable prefetch for these routes.
 */
export function ServicesIntakeLink(props: Props) {
  return <Link {...props} prefetch={false} />;
}
