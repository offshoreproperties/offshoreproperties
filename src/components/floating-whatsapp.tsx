import { useLocation } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function FloatingWhatsApp() {
  const { pathname } = useLocation();

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
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-4 ring-white/80 transition hover:scale-105 hover:bg-[#1ebe57] active:scale-95 safe-bottom sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="h-7 w-7" aria-hidden />
    </a>
  );
}
