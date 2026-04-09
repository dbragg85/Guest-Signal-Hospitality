import Image from "next/image";
import Link from "next/link";

const HEADER_ICON = "/guest-signal-header-icon.svg";

/** Vector mark + HTML wordmark — icon is readable at small sizes; text carries the name. */
export function BrandLockup() {
  return (
    <Link
      href="/"
      className="group flex min-w-0 items-center gap-2 sm:gap-3"
    >
      <Image
        src={HEADER_ICON}
        alt=""
        width={190}
        height={96}
        sizes="(max-width: 640px) 56px, 64px"
        className="h-auto w-14 shrink-0 object-left object-contain sm:w-16"
        priority
      />
      <span className="flex min-w-0 flex-col leading-tight max-[360px]:hidden">
        <span className="truncate text-sm font-bold tracking-tight text-slate-900 sm:text-lg">
          Guest Signal
        </span>
        <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-amber-800/95 sm:text-[11px] sm:tracking-[0.2em]">
          Hospitality
        </span>
      </span>
    </Link>
  );
}

export function BrandLockupFooter() {
  return (
    <div className="flex items-center gap-2.5">
      <Image
        src={HEADER_ICON}
        alt=""
        width={190}
        height={96}
        sizes="48px"
        className="h-auto w-12 shrink-0 object-left object-contain opacity-95"
      />
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-bold tracking-tight text-white">
          Guest Signal
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400/90">
          Hospitality
        </span>
      </span>
    </div>
  );
}
