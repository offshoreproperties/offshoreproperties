import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { SectionHeading } from "@/components/section-heading";
import { BRAND, HAVENLY_HERO_SALE } from "@/lib/constants";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About — ${BRAND.name}` },
      { name: "description", content: BRAND.tagline },
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
              eyebrow="Who we are"
              title="We'd rather show you five right homes than fifty wrong ones"
              description="Offshore started because too many buyers and renters waste weeks on listings that were never going to work. We keep the portfolio tight and the advice straight."
            />
          </div>
        </div>
      </section>

      <section className="page-panel mt-0 sm:mt-6">
        <div className="mx-auto max-w-3xl space-y-5 text-[15px] leading-relaxed text-neutral-600 sm:space-y-6 sm:text-base">
          <p>
            We work across Nairobi and the coast with a focused set of villas, apartments, and land —
            properties we would actually take a client to see. When you enquire, you speak to people who
            know the neighbourhoods, not a call centre reading a script.
          </p>
          <p>
            Some clients are buying their first home in Kenya. Others are adding a rental or a holiday
            place. Either way, we start with how you live — commute, schools, budget, security — and
            narrow down from there. No pressure to decide on the spot.
          </p>
          <p>
            Every listing is checked for location, title clarity, and whether the price makes sense in
            that area. Fewer properties on the site, but each one is worth your time.
          </p>
        </div>
        <Link
          to="/contact"
          className="mt-8 inline-flex h-11 items-center rounded-full bg-neutral-900 px-8 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-neutral-800 sm:mt-10"
        >
          Talk to the team
        </Link>
      </section>
    </SiteLayout>
  );
}
