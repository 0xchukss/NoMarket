import clsx from "clsx";

const categoryIcon: Record<string, string> = {
  Crypto: "/developer-icons/solidity.svg",
  Tech: "/developer-icons/typescript.svg",
  Featured: "/developer-icons/nextjs.svg"
};

export function DeveloperIconBadge({
  category,
  fallback,
  size = "md"
}: {
  category: string;
  fallback: string;
  size?: "sm" | "md" | "lg";
}) {
  const icon = categoryIcon[category];
  const classes = clsx(
    "grid shrink-0 place-items-center overflow-hidden rounded-lg border border-white/8 bg-white/8",
    size === "sm" && "h-9 w-9",
    size === "md" && "h-10 w-10",
    size === "lg" && "h-12 w-12 rounded-xl"
  );

  if (!icon) {
    return (
      <div className={clsx(classes, "text-[11px] font-black text-blue-200")}>
        {fallback}
      </div>
    );
  }

  return (
    <div className={classes}>
      <img src={icon} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
    </div>
  );
}
