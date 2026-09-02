import { cn } from "@/lib/utils";

/** Clean assistant mark — no sparkle/glitter styling */
export function AiAssistantIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-4 w-4", className)}
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="14" rx="4" className="stroke-current" strokeWidth="1.75" />
      <path
        d="M8 10.5h.01M12 10.5h.01M16 10.5h.01M8.5 14.5c1.2.9 2.5 1.35 3.5 1.35s2.3-.45 3.5-1.35"
        className="stroke-current"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M12 4V2.5" className="stroke-current" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="12" cy="2" r="0.75" className="fill-current" />
    </svg>
  );
}
