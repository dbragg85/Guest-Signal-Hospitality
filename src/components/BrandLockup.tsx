import Image from "next/image";
import Link from "next/link";

/** Raster logo (often hard to read at small sizes) + crisp HTML wordmark for legibility. */
export function BrandLockup() {
  return (
    <Link
      href="/"
      className="group flex min-w-0 items-center gap-2.5 sm:gap-3"
    >
      <Image
        src="/logo.png"
        alt=""
        width={120}
        height={48}
        className="h-8 w-auto max-w-[100px] shrink-0 object-left object-contain opacity-95 sm:h-9 sm:max-w-[110px]"
        priority
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[15px] font-bold tracking-tight text-white sm:text-base">
          Guest Signal
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400/95">
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
        src="/logo.png"
        alt=""
        width={96}
        height={40}
        className="h-7 w-auto max-w-[88px] object-left object-contain opacity-80"
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
