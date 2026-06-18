import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { SectionHeading } from "@/components/section-heading";
import { EnquiryForm } from "@/components/enquiry-form";
import { BRAND } from "@/lib/constants";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact — ${BRAND.name}` },
      { name: "description", content: "Get in touch with our advisory team." },
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
              eyebrow="Contact"
              title="Begin the conversation"
              description="Share your requirements and a senior advisor will respond within one business day."
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
              <li className="flex min-h-[48px] items-start gap-3 px-1 pt-3 text-neutral-600">
                <MapPin className="h-5 w-5 shrink-0 text-[#2563eb]" />
                <span>By appointment — reach out anytime</span>
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
