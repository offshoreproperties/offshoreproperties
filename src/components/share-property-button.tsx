import { useState } from "react";
import { Share2, Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SharePropertyButtonProps = {
  url: string;
  title: string;
  text?: string;
  className?: string;
  variant?: "default" | "outline";
};

export function SharePropertyButton({
  url,
  title,
  text,
  className,
  variant = "outline",
}: SharePropertyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareText = text ?? `Check out ${title} on Offshore Properties`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text: shareText, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Property link copied!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Could not share this property");
    }
  }

  const Icon = copied ? Check : Share2;

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition active:scale-[0.98]",
        variant === "outline"
          ? "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
          : "bg-neutral-900 text-white hover:bg-neutral-800",
        className,
      )}
      aria-label={`Share ${title}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {copied ? "Link copied" : "Share"}
    </button>
  );
}

export function CopyPropertyLinkButton({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-neutral-200 px-3 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50",
        className,
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
