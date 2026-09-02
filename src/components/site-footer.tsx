import { Link } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

const EXPLORE_LINKS = [
  { to: "/properties" as const, label: "All listings" },
  { to: "/map" as const, label: "Property map" },
  { to: "/properties" as const, search: { propertyType: "villa" as const }, label: "Villas" },
  { to: "/properties" as const, search: { listingType: "rent" as const }, label: "For rent" },
];

const COMPANY_LINKS = [
  { to: "/about" as const, label: "About" },
  { to: "/contact" as const, label: "Contact" },
];

function FooterLink({
  to,
  search,
  children,
}: {
  to: string;
  search?: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      search={search}
      className="block py-1 text-sm text-slate-400 transition-colors hover:text-white sm:py-1.5"
    >
      {children}
    </Link>
  );
}

function FooterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-xs sm:tracking-wider">
        {title}
      </h4>
      <ul className="mt-2 space-y-0.5 sm:mt-3">{children}</ul>
    </div>
  );
}

export function SiteFooter() {
  const whatsappHref = buildWhatsAppUrl(BRAND.whatsapp, [
    `Hi — I found you on ${BRAND.name} and wanted to ask about what's available.`,
  ]);

  return (
    <footer className="border-t border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] lg:gap-12">
          {/* Brand + mobile CTA */}
          <div className="space-y-4 border-b border-white/10 pb-6 lg:border-b-0 lg:pb-0">
            <BrandLogo size="compact" imgClassName="h-10 sm:h-11" />
            <p className="max-w-sm text-sm leading-relaxed text-slate-400">{BRAND.tagline}</p>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all",
                "bg-[#128C7E] hover:bg-[#0f7a6e] sm:w-auto sm:rounded-full sm:px-5 sm:py-2.5",
              )}
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              Chat on WhatsApp
            </a>
          </div>

          {/* Links + contact */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 sm:gap-x-8 lg:gap-x-10">
            <FooterSection title="Explore">
              {EXPLORE_LINKS.map((item) => (
                <li key={item.label}>
                  <FooterLink to={item.to} search={"search" in item ? item.search : undefined}>
                    {item.label}
                  </FooterLink>
                </li>
              ))}
            </FooterSection>

            <FooterSection title="Company">
              {COMPANY_LINKS.map((item) => (
                <li key={item.label}>
                  <FooterLink to={item.to}>{item.label}</FooterLink>
                </li>
              ))}
            </FooterSection>

            <div className="col-span-2 sm:col-span-1">
              <FooterSection title="Contact">
              <li>
                <a
                  href={`mailto:${BRAND.email}`}
                  className="flex items-start gap-2 py-1 text-sm text-slate-400 transition-colors hover:text-white sm:py-1.5"
                >
                  <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <span className="break-all">{BRAND.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 py-1 text-sm text-[#6ee7b7] transition-colors hover:text-[#a7f3d0] sm:py-1.5"
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                  {BRAND.phone}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${BRAND.phone2.replace(/\s/g, "")}`}
                  className="flex items-center gap-2 py-1 text-sm text-slate-400 transition-colors hover:text-white sm:py-1.5"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                  {BRAND.phone2}
                </a>
              </li>
              </FooterSection>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/25">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3 w-3 shrink-0 text-slate-600" aria-hidden />
              Nairobi, Kenya
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
