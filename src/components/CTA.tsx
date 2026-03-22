import Link from "next/link";

export function CTA({
  title,
  desc,
  primaryHref = "/contact",
  primaryLabel = "Get a Free Snapshot",
  secondaryHref = "/services",
  secondaryLabel = "See Services",
}: {
  title: string;
  desc: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-stone-50/80 p-8 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className="mt-2 text-sm text-slate-600">{desc}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href={primaryHref} className="btn-primary text-center">
            {primaryLabel}
          </Link>
          <Link href={secondaryHref} className="btn-secondary text-center">
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
