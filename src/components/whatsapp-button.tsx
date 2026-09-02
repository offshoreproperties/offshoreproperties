import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type WhatsAppButtonProps = {
  href: string;
  label?: string;
  className?: string;
  variant?: "primary" | "outline";
};

export function WhatsAppButton({
  href,
  label = "Chat on WhatsApp",
  className,
  variant = "primary",
}: WhatsAppButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98]",
        variant === "primary"
          ? "bg-[#25D366] text-white shadow-sm hover:bg-[#1ebe57]"
          : "border border-[#25D366]/40 bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/15",
        className,
      )}
    >
      <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </a>
  );
}
