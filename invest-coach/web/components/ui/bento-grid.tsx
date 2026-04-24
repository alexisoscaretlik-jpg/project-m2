import { cn } from "@/lib/utils";

// Aceternity UI — Bento Grid
// Modern asymmetric grid. Makes a features section feel like Finary
// or Linear — bigger cards, different spans, hover motion.

export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-5xl grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BentoGridItem({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "row-span-1 flex flex-col justify-between space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-xl group",
        className,
      )}
    >
      {header}
      <div className="transition duration-200 group-hover:translate-x-2">
        {icon}
        <div className="mt-2 mb-2 font-sans font-semibold text-foreground">
          {title}
        </div>
        <div className="font-sans text-sm font-normal text-muted-foreground">
          {description}
        </div>
      </div>
    </div>
  );
}
