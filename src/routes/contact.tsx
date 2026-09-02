import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { SectionHeading } from "@/components/section-heading";
import { EnquiryForm } from "@/components/enquiry-form";
import { BRAND } from "@/lib/constants";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Mail, Phone, MapPin } from "lucide-react";
import { WhatsAppButton } from "@/components/whatsapp-button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact — ${BRAND.name}` },
      { name: "description", content: "Tell us what you're looking for — we'll get back to you within a working day." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <SiteLayout>
      <section className="page-panel">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              variant="light"
              eyebrow="Get in touch"
              title="Tell us what you're looking for"
              description="Share your budget, preferred areas, or a property you've seen on the site. Someone from the team will reply within one working day — no hard sell, just a proper conversation."
            />
            <ul className="mt-8 space-y-2 text-sm sm:mt-10">
              <li>
                <a
                  href={`mailto:${BRAND.email}`}
                  className="flex min-h-[48px] items-center gap-3 rounded-lg px-1 text-neutral-600 hover:text-neutral-900"
                >
                  <Mail className="h-5 w-5 shrink-0 text-[#2563eb]" />
                  {BRAND.email}
                </a>
              </li>
              <li className="flex min-h-[48px] items-center gap-3 px-1 text-neutral-600">
                <Phone className="h-5 w-5 shrink-0 text-[#2563eb]" />
                <span>{BRAND.phone}<br />{BRAND.phone2}</span>
              </li>
              <li className="px-1 pt-2">
                <WhatsAppButton
                  href={buildWhatsAppUrl(BRAND.whatsapp, [
                    `Hi — I'm getting in touch via ${BRAND.name}.`,
                    "",
                    "I'm looking for:",
                  ])}
                  label="Chat on WhatsApp"
                  className="max-w-xs"
                />
              </li>
              <li className="flex min-h-[48px] items-start gap-3 px-1 pt-3 text-neutral-600">
                <MapPin className="h-5 w-5 shrink-0 text-[#2563eb]" />
                <span>Nairobi & coast — viewings by appointment</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-6 md:p-8">
            <EnquiryForm source="contact" />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
