import { Link } from "@tanstack/react-router";
import {
  Star,
  GitCompareArrows,
  Cpu,
  MemoryStick,
  HardDrive,
  Monitor,
  CircuitBoard,
  type LucideIcon,
} from "lucide-react";
import { variantPrice, variantOriginalPrice, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart-store";
import { formatVND } from "@/lib/format";
import { getCompactSpecRows } from "@/lib/compact-spec";
import { ProductImage } from "./ProductImage";
import { PaymentMethodLogos } from "./PaymentMethodLogos";
import { toast } from "sonner";

const SPEC_ICONS: Record<string, LucideIcon> = {
  cpu: Cpu,
  ram: MemoryStick,
  storage: HardDrive,
  gpu: CircuitBoard,
  display: Monitor,
};

function buildSpecRows(product: Product): { icon: LucideIcon; text: string; fullText: string }[] {
  const v0 = product.variants[0];
  const ramFull = product.ram?.trim() || (v0 ? `${v0.ram}GB RAM` : "");
  const storageFull =
    product.storage?.trim() ||
    (v0 ? (v0.ssd >= 1024 ? `${v0.ssd / 1024}TB SSD` : `${v0.ssd}GB SSD`) : "");

  return getCompactSpecRows({
    cpu: product.cpu,
    ram: ramFull,
    storage: storageFull,
    gpu: product.gpu,
    display: product.display,
  }).map((row) => ({
    icon: SPEC_ICONS[row.key] ?? Cpu,
    text: row.compact,
    fullText: row.full,
  }));
}

function RelatedProductStarRating({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  const count = Math.max(0, reviewCount);
  const avg = count > 0 ? Math.min(5, Math.max(0, rating)) : 0;
  const filledStars = Math.round(avg);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex shrink-0 gap-px" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`size-3.5 ${
              count > 0 && i < filledStars
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
      <span className="truncate text-xs text-gray-500">Có {count} đánh giá</span>
    </div>
  );
}

export function RelatedProductCard({ product }: { product: Product }) {
  const toggleCompare = useCart((s) => s.toggleCompare);
  const compareIds = useCart((s) => s.compareIds);
  const inCompare = compareIds.includes(product.id);

  const price = variantPrice(product, 0);
  const specs = buildSpecRows(product);
  const showOriginal = product.originalPrice != null && product.originalPrice > price;

  const onCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inCompare && compareIds.length >= 3) {
      toast.error("Chỉ so sánh tối đa 3 sản phẩm");
      return;
    }
    toggleCompare(product.id);
    toast.success(inCompare ? "Đã bỏ khỏi so sánh" : "Đã thêm vào so sánh");
  };

  return (
    <Link to="/products/$slug" params={{ slug: product.slug }} className="group block h-[400px]">
      <article className="flex h-full w-full flex-col justify-between rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm transition-shadow duration-300 hover:shadow-md">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="relative flex h-40 shrink-0 items-center justify-center rounded-lg bg-[#f8f9fa] px-3">
            <ProductImage
              seed={product.anhDaiDien || product.images[0]}
              label={product.name}
              className="flex h-full w-full items-center justify-center"
              iconClassName="size-12 text-gray-400"
              imgClassName="max-h-36 w-auto max-w-full object-contain object-center mix-blend-multiply"
            />
            {product.badge && (
              <span className="absolute left-2 top-2 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white">
                {product.badge}
              </span>
            )}
            <button
              type="button"
              onClick={onCompare}
              className={`absolute right-2 top-2 flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors ${
                inCompare
                  ? "border-red-200 bg-red-600 text-white"
                  : "text-gray-500 hover:text-gray-800"
              }`}
              aria-label="So sánh"
            >
              <GitCompareArrows className="size-3.5" />
            </button>
          </div>

          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            {product.brand}
          </p>
          <h3
            className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-gray-900"
            title={product.name}
          >
            {product.name}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex shrink-0 rounded-md bg-red-600 px-2 py-0.5 text-sm font-bold text-white">
              {formatVND(price)}
            </span>
            {product.phanTramGiam && product.phanTramGiam > 0 ? (
              <>
                <span className="text-xs text-gray-400 line-through">
                  {formatVND(variantOriginalPrice(product, 0))}
                </span>
                <span className="rounded bg-red-600 px-1 py-0.5 text-[10px] font-bold text-white">
                  -{product.phanTramGiam}%
                </span>
              </>
            ) : (
              showOriginal && (
                <span className="text-xs text-gray-400 line-through">
                  {formatVND(product.originalPrice!)}
                </span>
              )
            )}
          </div>

          {specs.length > 0 && (
            <div className="mt-2 grid shrink-0 grid-cols-2 gap-x-2 gap-y-1.5 rounded-lg bg-[#f0f0f0] p-2.5">
              {specs.map(({ icon: Icon, text, fullText }) => (
                <div key={fullText} className="flex min-w-0 items-center gap-1.5" title={fullText}>
                  <Icon
                    className="size-3.5 shrink-0 text-gray-400"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-xs leading-none text-gray-600">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 shrink-0 space-y-1.5 border-t border-gray-50 pt-2">
          <PaymentMethodLogos />
          <RelatedProductStarRating rating={product.rating} reviewCount={product.reviewCount} />
        </div>
      </article>
    </Link>
  );
}
