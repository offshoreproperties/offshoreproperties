import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  align = "left",
  variant = "dark",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
  variant?: "dark" | "light";
}) {
  const light = variant === "light";
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      {eyebrow && (
        <p className={cn("text-xs font-semibold uppercase tracking-[0.28em]", light ? "text-[#64748b]" : "text-[#2563eb]")}>
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          "mt-3 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance",
          light ? "text-[#0a0a0a]" : "text-white",
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn("mt-4 max-w-2xl text-sm leading-relaxed sm:text-base", light ? "text-black/55" : "text-white/55")}>
          {description}
        </p>
      )}
    </div>
  );
}
