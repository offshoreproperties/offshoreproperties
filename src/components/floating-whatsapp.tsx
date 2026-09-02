import { useLocation } from "@tanstack/react-router";
import { BRAND } from "@/lib/constants";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { cn } from "@/lib/utils";

export function FloatingWhatsApp() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  if (pathname.startsWith("/admin")) return null;

  const href = buildWhatsAppUrl(BRAND.whatsapp, [
    `Hello! I'd like to enquire about a property on ${BRAND.name}.`,
    "",
    "Please share what's available — thank you!",
  ]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Offshore Properties on WhatsApp"
      className={cn(
        "group fixed z-40 flex items-center gap-1 rounded-full py-1 pl-1 pr-3.5 sm:pr-4",
        "bg-[#25D366] text-white shadow-[0_10px_40px_-8px_rgba(37,211,102,0.65)]",
        "ring-2 ring-white/90 transition-[transform,box-shadow,background-color] duration-200",
        "hover:bg-[#20bd5a] hover:shadow-[0_14px_44px_-6px_rgba(37,211,102,0.7)]",
        "active:scale-[0.98] motion-reduce:active:scale-100",
        isHome
          ? "bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))]"
          : "bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]",
      )}
    >
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center sm:h-12 sm:w-12">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-white/15 opacity-0 transition-opacity group-hover:opacity-100"
        />
        <WhatsAppIcon className="relative h-[1.35rem] w-[1.35rem] sm:h-6 sm:w-6" />
        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white ring-2 ring-[#25D366]" />
        </span>
      </span>

      <span className="flex min-w-0 flex-col items-start pr-0.5 leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80">
          WhatsApp
        </span>
        <span className="text-sm font-semibold text-white sm:text-[0.9375rem]">Chat with us</span>
      </span>
    </a>
  );
}
