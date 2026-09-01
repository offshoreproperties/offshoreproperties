import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { SectionHeading } from "@/components/section-heading";
import { BRAND, HAVENLY_HERO_SALE } from "@/lib/constants";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About — ${BRAND.name}` },
      { name: "description", content: "Our philosophy — real estate made easy and transparent." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="relative flex min-h-[min(32dvh,32vh)] items-end sm:min-h-[min(38dvh,38vh)]">
          <img
            src={HAVENLY_HERO_SALE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          <div className="relative w-full px-4 pb-8 pt-16 sm:px-10 sm:pb-12 sm:pt-20">
            <SectionHeading
              eyebrow="Our story"
              title="Perspective over volume"
              description="Offshore Properties was founded on a simple belief: the finest homes are discovered, not scrolled past."
            />
          </div>
        </div>
      </section>

      <section className="page-panel mt-0 sm:mt-6">
        <div className="mx-auto max-w-3xl space-y-5 text-[15px] leading-relaxed text-neutral-600 sm:space-y-6 sm:text-base">
          <p>
            We represent a deliberately curated portfolio of villas, apartments, and land across
            prime locations. Each instruction is handled with discretion — from first enquiry through
            completion.
          </p>
          <p>
            Our advisors combine local market knowledge with an international buyer network. Whether
            you are acquiring a primary residence, a rental investment, or a short-let retreat, we
            guide you with clarity and without pressure.
          </p>
          <p>
            Every listing is vetted for location, title clarity, and long-term value. We focus on
            fewer properties, presented properly — so you spend less time searching and more time
            deciding.
          </p>
        </div>
        <Link
          to="/contact"
          className="mt-8 inline-flex h-11 items-center rounded-full bg-neutral-900 px-8 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-neutral-800 sm:mt-10"
        >
          Speak with us
        </Link>
      </section>
    </SiteLayout>
  );
}
