import { resolveProductImageUrl } from "@/lib/products";

interface Props {
  seed: string;
  label?: string;
  className?: string;
  iconClassName?: string;
  imgClassName?: string;
}

export function ProductImage({ seed, label, className, imgClassName }: Props) {
  const imageUrl = resolveProductImageUrl(seed, label);

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`} aria-label={label}>
      <img
        src={imageUrl}
        alt={label ?? ""}
        loading="lazy"
        className={`h-full w-full ${imgClassName ?? "object-cover"}`}
        onError={(e) => {
          const el = e.currentTarget;
          el.src = "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=80";
        }}
      />
    </div>
  );
}
