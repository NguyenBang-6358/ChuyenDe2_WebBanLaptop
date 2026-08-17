import { createFileRoute, Link } from "@tanstack/react-router";
import { X, GitCompareArrows } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { getProductById, variantPrice } from "@/lib/products";
import { formatVND } from "@/lib/format";
import { ProductImage } from "@/components/ProductImage";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/compare")({
  head: () => ({ meta: [{ title: "So sánh laptop — Laptop Center" }] }),
  component: ComparePage,
});

function ComparePage() {
  const compareIds = useCart((s) => s.compareIds);
  const toggleCompare = useCart((s) => s.toggleCompare);
  const products = compareIds
    .map((id) => getProductById(id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  if (products.length === 0) {
    return (
      <div className="relative px-4 py-20 text-center md:px-6">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-mesh)" }} />
        <div
          className="mx-auto mb-6 flex size-24 items-center justify-center rounded-3xl text-primary-foreground"
          style={{ background: "var(--gradient-emerald)", boxShadow: "var(--shadow-glow)" }}
        >
          <GitCompareArrows className="size-10" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Chưa có sản phẩm để so sánh</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Thêm tối đa 3 laptop để so sánh thông số chi tiết, từ CPU đến trọng lượng.
        </p>
        <Link to="/products">
          <Button size="lg" className="mt-6">
            Khám phá sản phẩm
          </Button>
        </Link>
      </div>
    );
  }

  const rows: Array<[string, (p: (typeof products)[number]) => string]> = [
    ["Giá", (p) => formatVND(variantPrice(p, 0))],
    ["Thương hiệu", (p) => p.brand],
    ["Vi xử lý", (p) => p.cpu],
    ["Card đồ họa", (p) => p.gpu],
    ["RAM (mặc định)", (p) => `${p.variants[0].ram}GB`],
    [
      "SSD (mặc định)",
      (p) =>
        `${p.variants[0].ssd >= 1024 ? p.variants[0].ssd / 1024 + "TB" : p.variants[0].ssd + "GB"}`,
    ],
    ["Màn hình", (p) => p.display],
    ["Pin", (p) => p.battery],
    ["Trọng lượng", (p) => p.weight],
    ["Bảo hành", (p) => p.warranty],
    ["Đánh giá", (p) => `${p.rating} ★ (${p.reviewCount})`],
  ];

  return (
    <div className="px-4 py-8 md:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              So sánh trực quan
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
              Đối chiếu thông số
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Các giá trị khác biệt sẽ được tô sáng để dễ chọn.
            </p>
          </div>
          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {products.length}/3
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl bg-card ring-1 ring-foreground/5">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                <th className="w-40 p-4 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Thông số
                </th>
                {products.map((p) => (
                  <th key={p.id} className="border-l border-foreground/5 p-4 text-left">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link to="/products/$slug" params={{ slug: p.slug }}>
                          <ProductImage
                            seed={p.anhDaiDien || p.images[0]}
                            label={p.name}
                            className="mb-3 flex h-32 w-32 items-center justify-center rounded-xl bg-[#f8f9fa] p-2"
                            iconClassName="size-10"
                            imgClassName="max-h-28 w-auto max-w-full object-contain object-center mix-blend-multiply"
                          />
                          <div className="text-sm font-semibold hover:text-primary">{p.name}</div>
                        </Link>
                      </div>
                      <button
                        onClick={() => toggleCompare(p.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Xóa"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, get]) => {
                const values = products.map(get);
                const allSame = values.every((v) => v === values[0]);
                return (
                  <tr key={label} className="border-t border-foreground/5">
                    <td className="p-4 text-sm font-medium text-muted-foreground">{label}</td>
                    {values.map((v, i) => (
                      <td
                        key={i}
                        className={`border-l border-foreground/5 p-4 text-sm ${
                          !allSame ? "font-semibold text-primary" : ""
                        }`}
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
