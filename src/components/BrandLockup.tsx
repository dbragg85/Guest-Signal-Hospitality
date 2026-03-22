import Image from "next/image";
import Link from "next/link";

/**
 * Raster mark + HTML wordmark. For a replacement asset, prefer a tight-cropped
 * horizontal PNG or SVG (see team notes in repo / design handoff): ~200–280×40–48px
 * @1x, transparent background, no extra canvas padding.
 */
export function BrandLockup() {
  return (
    <Link
      href="/"
      className="group flex min-w-0 items-center gap-2 sm:gap-3"
    >
      <Image
        src="/logo.png"
        alt=""
        width={160}
        height={40}
        className="h-9 w-auto max-h-9 max-w-[140px] shrink-0 object-left object-contain sm:max-w-[160px]"
        priority
      />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
          Guest Signal
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400 sm:text-[11px]">
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
