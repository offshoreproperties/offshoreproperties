import { PublicHeader } from "@/components/public-header";

/** Sticky header for inner pages — same pill nav as homepage */
export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return <PublicHeader variant="bar" compact={compact} />;
}
