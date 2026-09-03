import { Phone } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { cn } from "@/lib/utils";

export const BRAND_PHONES = [
  { label: BRAND.phone, tel: BRAND.phone.replace(/\s/g, ""), whatsapp: BRAND.whatsapp },
  { label: BRAND.phone2, tel: BRAND.phone2.replace(/\s/g, ""), whatsapp: BRAND.whatsapp2 },
] as const;

const DEFAULT_WA_LINES = [
  `Hi — I found you on ${BRAND.name} and wanted to ask about what's available.`,
];

export function ContactPhoneRow({
  label,
  tel,
  whatsapp,
  className,
  iconClassName,
  linkClassName,
  whatsappLines = DEFAULT_WA_LINES,
}: {
  label: string;
  tel: string;
  whatsapp: string;
  className?: string;
  iconClassName?: string;
  linkClassName?: string;
  whatsappLines?: string[];
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <a
        href={`tel:${tel}`}
        className={cn("flex min-w-0 flex-1 items-center gap-2 py-1", linkClassName)}
      >
        <Phone className={cn("h-3.5 w-3.5 shrink-0", iconClassName)} />
        <span className="whitespace-nowrap">{label}</span>
      </a>
      <a
        href={buildWhatsAppUrl(whatsapp, whatsappLines)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp ${label}`}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#25D366] transition hover:bg-[#25D366]/10"
      >
        <WhatsAppIcon className="h-4 w-4" />
      </a>
    </div>
  );
}

export function BrandPhoneList({
  className,
  rowClassName,
  iconClassName,
  linkClassName,
  whatsappLines,
  asItems = false,
}: {
  className?: string;
  rowClassName?: string;
  iconClassName?: string;
  linkClassName?: string;
  whatsappLines?: string[];
  asItems?: boolean;
}) {
  const items = BRAND_PHONES.map((p) => (
    <li key={p.tel}>
      <ContactPhoneRow
        {...p}
        className={rowClassName}
        iconClassName={iconClassName}
        linkClassName={linkClassName}
        whatsappLines={whatsappLines}
      />
    </li>
  ));

  if (asItems) return <>{items}</>;
  return <ul className={className}>{items}</ul>;
}
