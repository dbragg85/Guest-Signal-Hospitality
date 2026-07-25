import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";

export function CTA({
  title,
  desc,
  primaryHref = "/snapshot/",
  primaryLabel = "Get your free snapshot",
  secondaryHref = "/services/",
  secondaryLabel = "Compare plans",
  align = "start",
  className,
}: {
  title: string;
  desc: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  /** `center` stacks copy and buttons for pages like /team */
  align?: "start" | "center";
  className?: string;
}) {
  const centered = align === "center";
  const PrimaryLink =
    typeof primaryHref === "string" &&
    (primaryHref.includes("/services/inquiry") || primaryHref.includes("/snapshot"))
      ? ServicesIntakeLink
      : Link;

  return (
    <div
      className={`rounded-3xl border border-stone-200 bg-stone-50/80 p-8 shadow-sm ${className || ""}`}
    >
      <div
        className={
          centered
            ? "flex flex-col items-center gap-6 text-center"
            : "flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
        }
      >
        <div className={centered ? "max-w-xl" : "max-w-2xl"}>
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className="mt-2 text-sm text-slate-600">{desc}</p>
        </div>
        <div
          className={
            centered
              ? "flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center"
              : "flex flex-col gap-3 sm:flex-row"
          }
        >
          <PrimaryLink href={primaryHref} className="btn-primary text-center">
            {primaryLabel}
          </PrimaryLink>
          <Link href={secondaryHref} className="btn-secondary text-center">
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
