import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { StripeCheckoutButton } from "@/components/StripeCheckoutButton";
import type { PlanInquiryKey } from "@/content/site";

type CheckoutPlan = Exclude<PlanInquiryKey, "free_snapshot">;

export function CTA({
  title,
  desc,
  primaryHref = "/snapshot/",
  primaryLabel = "Get your free snapshot",
  secondaryHref = "/services/",
  secondaryLabel = "Compare plans",
  secondaryCheckout,
  align = "start",
  className,
}: {
  title: string;
  desc: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  /** When set, secondary CTA starts Stripe checkout instead of linking. */
  secondaryCheckout?: CheckoutPlan;
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
          {secondaryCheckout ? (
            <div className={centered ? "w-full sm:min-w-[14rem]" : "min-w-[14rem]"}>
              <StripeCheckoutButton
                planKey={secondaryCheckout}
                label={secondaryLabel}
                className="btn-secondary w-full text-center"
              />
            </div>
          ) : (
            <Link href={secondaryHref} className="btn-secondary text-center">
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
