import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white text-neutral-900">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:gap-10 sm:px-6 sm:py-16 md:grid-cols-4">
        <div>
          <div className="text-3xl font-bold tracking-tight sm:text-[2rem]">
            Offshore<span className="text-blue-600">.</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-600">
            {BRAND.tagline}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">Explore</h4>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <Link to="/properties" className="inline-flex min-h-[44px] items-center text-neutral-600 hover:text-blue-600">
                All listings
              </Link>
            </li>
            <li>
              <Link to="/map" className="inline-flex min-h-[44px] items-center text-neutral-600 hover:text-blue-600">
                Property map
              </Link>
            </li>
            <li>
              <Link to="/properties" search={{ propertyType: "villa" }} className="inline-flex min-h-[44px] items-center text-neutral-600 hover:text-blue-600">
                Villas
              </Link>
            </li>
            <li>
              <Link to="/properties" search={{ listingType: "rent" }} className="inline-flex min-h-[44px] items-center text-neutral-600 hover:text-blue-600">
                For rent
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">Company</h4>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <Link to="/about" className="inline-flex min-h-[44px] items-center text-neutral-600 hover:text-blue-600">
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className="inline-flex min-h-[44px] items-center text-neutral-600 hover:text-blue-600">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">Contact</h4>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <a href="mailto:hello@offshoreproperties.com" className="inline-flex min-h-[44px] items-center text-neutral-600 hover:text-blue-600">
                hello@offshoreproperties.com
              </a>
            </li>
            <li>
              <a
                href={buildWhatsAppUrl(BRAND.whatsapp, [
                  `Hi — I found you on ${BRAND.name} and wanted to ask about what's available.`,
                ])}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 text-[#128C7E] hover:text-[#25D366]"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                WhatsApp {BRAND.phone}
              </a>
            </li>
            <li className="inline-flex min-h-[44px] items-center text-neutral-600">
              {BRAND.phone2}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-neutral-500 sm:px-6">
          <span>© {new Date().getFullYear()} Offshore Properties</span>
          <span>Nairobi · Kenya</span>
        </div>
      </div>
    </footer>
  );
}
