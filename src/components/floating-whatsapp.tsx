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
        "fixed z-40 flex h-10 w-10 items-center justify-center rounded-full sm:h-11 sm:w-11",
        "bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 ring-2 ring-white/90",
        "transition hover:bg-[#20bd5a] hover:shadow-xl active:scale-95 motion-reduce:active:scale-100",
        "right-[max(0.875rem,env(safe-area-inset-right))]",
        isHome
          ? "bottom-[max(6.5rem,env(safe-area-inset-bottom))] sm:bottom-[max(7rem,env(safe-area-inset-bottom))]"
          : "bottom-[max(0.875rem,env(safe-area-inset-bottom))]",
      )}
    >
      <WhatsAppIcon className="h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5" />
    </a>
  );
}
