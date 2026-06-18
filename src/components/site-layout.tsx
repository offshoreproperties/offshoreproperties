import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export function SiteLayout({
  children,
  className = "",
  showFooter = true,
  compactHeader = false,
  mainClassName = "",
  overflowVisible = false,
}: {
  children: React.ReactNode;
  className?: string;
  showFooter?: boolean;
  compactHeader?: boolean;
  mainClassName?: string;
  overflowVisible?: boolean;
}) {
  const overflow = overflowVisible ? "overflow-visible" : "overflow-x-hidden";
  return (
    <div className={`flex min-h-screen flex-col ${overflow} bg-[#f8fafc] ${className}`}>
      <div className={`flex min-h-screen flex-1 flex-col ${overflow} bg-white`}>
        <SiteHeader compact={compactHeader} />
        <main className={`flex-1 text-neutral-900 ${mainClassName || overflow}`}>{children}</main>
        {showFooter && <SiteFooter />}
      </div>
    </div>
  );
}
