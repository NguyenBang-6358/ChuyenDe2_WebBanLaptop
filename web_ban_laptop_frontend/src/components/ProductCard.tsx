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

function ProductStarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const count = Math.max(0, reviewCount);
  const avg = count > 0 ? Math.min(5, Math.max(0, rating)) : 0;
  const filledStars = Math.round(avg);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-px" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`size-3.5 ${i < filledStars ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"
              }`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500">
        {count > 0 ? `${avg.toFixed(1)} · ` : ""}
        {count} đánh giá
      </span>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const toggleCompare = useCart((s) => s.toggleCompare);
  const compareIds = useCart((s) => s.compareIds);
  const inCompare = compareIds.includes(product.id);

  const price = variantPrice(product, 0);
  const specs = buildSpecRows(product);

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
    <Link to="/products/$slug" params={{ slug: product.slug }} className="group block h-full">
      <article className="flex h-full flex-col rounded-lg border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        {/* Khung ảnh sản phẩm cân đối, tự động fit đẹp mắt cho mọi loại ảnh */}
        <div className="relative mb-3 flex h-44 w-full items-center justify-center overflow-hidden rounded-md bg-white dark:bg-slate-900 p-2">
          <ProductImage
            seed={product.anhDaiDien || product.images[0]}
            label={product.name}
            className="h-full w-full flex items-center justify-center"
            iconClassName="size-14 text-gray-400"
            imgClassName="max-h-full max-w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1">
            {product.originalPrice != null && product.originalPrice > price ? (
              <span className="inline-flex items-center justify-center min-w-[46px] px-2 py-0.5 rounded-full bg-[#c8181e] text-white text-[11px] font-bold shadow-xs">
                -{Math.round((1 - price / product.originalPrice) * 100)}%
              </span>
            ) : null}
            {product.badge ? (
              <span className="inline-flex items-center justify-center min-w-[46px] px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wide shadow-xs">
                {product.badge}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onCompare}
            className={`absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full border border-gray-200 bg-white/90 shadow-sm backdrop-blur-xs transition-colors z-10 ${inCompare
                ? "border-red-200 bg-red-600 text-white"
                : "text-gray-500 hover:border-gray-300 hover:text-gray-800"
              }`}
            aria-label="So sánh"
          >
            <GitCompareArrows className="size-3.5" />
          </button>
        </div>

        {/* Nội dung thông tin sản phẩm */}
        <div className="flex flex-col flex-1">
          {/* Thương hiệu & tên */}
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            {product.brand}
          </p>
          <h3 className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
            {product.name}
          </h3>

          {/* Giá */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-md bg-red-600 px-2.5 py-1 text-sm font-bold text-white">
              {formatVND(price)}
            </span>
            {product.phanTramGiam && product.phanTramGiam > 0 ? (
              <>
                <span className="text-xs text-gray-400 line-through">
                  {formatVND(variantOriginalPrice(product, 0))}
                </span>
                <span className="rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                  -{product.phanTramGiam}%
                </span>
              </>
            ) : (
              product.originalPrice != null &&
              product.originalPrice > price && (
                <span className="text-xs text-gray-400 line-through">
                  {formatVND(product.originalPrice)}
                </span>
              )
            )}
          </div>

          {/* Thông số dạng tag / grid */}
          {specs.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2 rounded-lg bg-[#f5f5f5] dark:bg-slate-800 p-2.5">
              {specs.map(({ icon: Icon, text, fullText }) => (
                <div key={fullText} className="flex min-w-0 items-center gap-1.5" title={fullText}>
                  <Icon className="size-3.5 shrink-0 text-gray-400" strokeWidth={1.75} aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-xs leading-none text-gray-600 dark:text-gray-300">
                    {text}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Thanh toán + đánh giá — tách hàng như ảnh mẫu */}
          <div className="mt-auto pt-3">
            <PaymentMethodLogos />
            <div className="mt-2">
              <ProductStarRating rating={product.rating} reviewCount={product.reviewCount} />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
