import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LOGO_SIZES = {
  /** Sticky site header — prominent brand mark */
  header:
    "h-14 w-auto max-w-[min(280px,58vw)] object-contain sm:h-16 md:h-[4.25rem] lg:h-[4.75rem] lg:max-w-[320px]",
  default:
    "h-14 w-auto max-w-[min(280px,58vw)] object-contain sm:h-16 md:h-[4.25rem] lg:h-[4.75rem] lg:max-w-[320px]",
  hero: "h-24 w-auto max-w-[min(480px,88vw)] object-contain sm:h-28 md:h-32 lg:h-36 xl:h-[10rem]",
  compact: "h-10 w-auto max-w-[min(200px,44vw)] object-contain sm:h-11",
} as const;

export function BrandLogo({
  className,
  imgClassName,
  size = "default",
}: {
  className?: string;
  imgClassName?: string;
  size?: keyof typeof LOGO_SIZES;
}) {
  return (
    <span className={cn("inline-flex shrink-0 items-center", className)}>
      <img
        src={BRAND.logoSrc}
        alt={BRAND.name}
        className={cn(LOGO_SIZES[size], imgClassName)}
        width={420}
        height={120}
        decoding="async"
      />
    </span>
  );
}
