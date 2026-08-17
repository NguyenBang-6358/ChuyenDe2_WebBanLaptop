import { useMemo, useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import { brands, needs as needsList, variantPrice, type Need } from "@/lib/products";
import { fetchLaptops, API_BASE_URL, CATEGORY_MAP } from "@/lib/laptop-api";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/format";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  brand: fallback(z.union([z.string(), z.array(z.string())]), "").default(""),
  cpu: fallback(z.union([z.string(), z.array(z.string())]), "").default(""),
  gpu: fallback(z.union([z.string(), z.array(z.string())]), "").default(""),
  need: fallback(z.string(), "").default(""),
  min: fallback(z.number(), 0).default(0),
  max: fallback(z.number(), 100000000).default(100000000),
  sort: fallback(z.enum(["new", "price-asc", "price-desc", "rating"]), "new").default("new"),
});

export const Route = createFileRoute("/products/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Tất cả laptop — Laptop Center" },
      {
        name: "description",
        content: "Danh sách sản phẩm laptop với bộ lọc thương hiệu, mức giá và nhu cầu sử dụng.",
      },
    ],
  }),
  component: ProductsPage,
});

function toArray(v: string | string[]): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

const FILTER_OPTIONS = [
  { id: "under-15", label: "Dưới 15 triệu", min: 0, max: 15_000_000 },
  { id: "15-20", label: "15 - 20 triệu", min: 15_000_000, max: 20_000_000 },
  { id: "20-25", label: "20 - 25 triệu", min: 20_000_000, max: 25_000_000 },
  { id: "over-25", label: "Trên 25 triệu", min: 25_000_000, max: 100_000_000 },
  { id: "Văn phòng", label: "Văn phòng", need: "Văn phòng" },
  { id: "Gaming", label: "Gaming", need: "Gaming" },
  { id: "Đồ họa", label: "Đồ họa", need: "Đồ họa" },
  { id: "Mỏng nhẹ", label: "Mỏng nhẹ", need: "Mỏng nhẹ" },
  { id: "Sinh viên", label: "Sinh viên", need: "Sinh viên" },
];

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/products/" });

  const categoryId = search.need ? CATEGORY_MAP[search.need] : undefined;

  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["laptops", categoryId],
    queryFn: ({ signal }) => fetchLaptops({ maDanhMuc: categoryId, signal }),
    staleTime: 60_000,
    retry: 1,
  });

  const selectedBrand = useMemo(() => {
    const arr = toArray(search.brand).filter((s) => s.trim().length > 0);
    return arr.length > 0 ? arr[0] : "";
  }, [search.brand]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (search.q && !p.name.toLowerCase().includes(search.q.toLowerCase())) return false;
      if (selectedBrand && p.brand.toLowerCase() !== selectedBrand.toLowerCase()) return false;
      if (search.need && !p.needs.includes(search.need as Need)) return false;
      const price = variantPrice(p, 0);
      if (price < search.min) return false;
      if (search.max && price > search.max) return false;
      return true;
    });
    switch (search.sort) {
      case "price-asc":
        list = [...list].sort((a, b) => variantPrice(a, 0) - variantPrice(b, 0));
        break;
      case "price-desc":
        list = [...list].sort((a, b) => variantPrice(b, 0) - variantPrice(a, 0));
        break;
      case "rating":
        list = [...list].sort((a, b) => b.rating - a.rating);
        break;
    }
    return list;
  }, [products, search, selectedBrand]);

  const toggleBrand = (bName: string) => {
    const isCurrentlySelected = selectedBrand.toLowerCase() === bName.toLowerCase();
    const newBrand = isCurrentlySelected ? "" : bName;
    navigate({
      search: (prev: any) => ({
        ...prev,
        brand: newBrand,
      }),
    });
  };

  const hasFilters =
    !!selectedBrand ||
    !!search.need ||
    !!search.q ||
    search.min > 0 ||
    (search.max && search.max < 100_000_000) ||
    search.sort !== "new";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 pb-20">
      {/* Breadcrumb chuẩn DATN */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
        <Link to="/" className="hover:text-red-600 transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="size-3 text-slate-400" />
        <span className="text-red-600 font-semibold">Sản phẩm</span>
      </div>

      {/* Tiêu đề trang chính chuẩn DATN */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
          {search.need
            ? `Laptop ${search.need}`
            : selectedBrand
            ? `Laptop ${selectedBrand}`
            : search.q
            ? `Kết quả tìm kiếm: "${search.q}"`
            : "Tất cả Sản phẩm Laptop"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {filtered.length} sản phẩm phù hợp
        </p>
      </div>

      {/* Row 1: Thương hiệu (Thanh lọc dạng Nút Bo Tròn chuẩn DATN) */}
      <div className="mb-3.5">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 w-full">
          {brands.map((b) => {
            const isSelected = selectedBrand.toLowerCase() === b.toLowerCase();
            return (
              <button
                key={b}
                type="button"
                onClick={() => toggleBrand(b)}
                className={`w-full h-10 rounded-full border text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-center px-4 ${
                  isSelected
                    ? "border-red-600 bg-red-600 text-white shadow-md"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-red-600 hover:text-red-600"
                }`}
              >
                {b}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Khoảng giá & Nhu cầu sử dụng (Thanh lọc Nút Pills chuẩn DATN) */}
      <div className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 w-full">
          {FILTER_OPTIONS.map((f) => {
            const isNeedSelected = f.need && search.need === f.need;
            const isPriceSelected =
              f.min !== undefined && search.min === f.min && search.max === f.max;
            const isSelected = Boolean(isNeedSelected || isPriceSelected);

            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  if (f.need) {
                    navigate({
                      search: (prev: any) => ({
                        ...prev,
                        need: prev.need === f.need ? "" : f.need,
                      }),
                    });
                  } else if (f.min !== undefined) {
                    const isSame = search.min === f.min && search.max === f.max;
                    navigate({
                      search: (prev: any) => ({
                        ...prev,
                        min: isSame ? 0 : f.min,
                        max: isSame ? 100_000_000 : f.max,
                      }),
                    });
                  }
                }}
                className={`w-full py-2 px-2 rounded-full border text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs text-center flex items-center justify-center whitespace-nowrap ${
                  isSelected
                    ? "bg-red-600 text-white border-red-600 shadow-md"
                    : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-800 hover:border-red-600"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 3: Nút Sắp xếp & Bỏ lọc (Chuẩn DATN) */}
      <div className="mb-8 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() =>
            navigate({
              search: (prev: any) => ({
                ...prev,
                sort: prev.sort === "price-asc" ? "new" : "price-asc",
              }),
            })
          }
          className={`px-4 py-2 rounded-lg border text-xs sm:text-sm font-bold transition cursor-pointer ${
            search.sort === "price-asc"
              ? "bg-red-600 text-white border-red-600 shadow-xs"
              : "bg-white dark:bg-slate-900 text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-slate-800"
          }`}
        >
          Giá thấp đến cao
        </button>

        <button
          type="button"
          onClick={() =>
            navigate({
              search: (prev: any) => ({
                ...prev,
                sort: prev.sort === "price-desc" ? "new" : "price-desc",
              }),
            })
          }
          className={`px-4 py-2 rounded-lg border text-xs sm:text-sm font-bold transition cursor-pointer ${
            search.sort === "price-desc"
              ? "bg-red-600 text-white border-red-600 shadow-xs"
              : "bg-white dark:bg-slate-900 text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-slate-800"
          }`}
        >
          Giá cao đến thấp
        </button>

        {hasFilters && (
          <button
            type="button"
            onClick={() => navigate({ search: {} })}
            className="text-xs text-red-600 hover:underline font-bold ml-2 cursor-pointer"
          >
            Bỏ lọc
          </button>
        )}
      </div>

      {/* Lưới sản phẩm Full-width 5 Cột chuẩn DATN */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="aspect-square w-full rounded-xl bg-slate-100 mb-3" />
              <div className="space-y-2">
                <div className="h-3 w-16 rounded bg-slate-100" />
                <div className="h-4 w-3/4 rounded bg-slate-100" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
              </div>
            </div>
          ))}
          <div className="col-span-full flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin text-red-600" /> Đang tải danh sách laptop từ hệ thống…
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-5 text-destructive" />
          </div>
          <h3 className="text-base font-semibold text-destructive">Hệ thống đang bảo trì</h3>
          <p className="mt-1 text-sm text-slate-500">
            Hệ thống đang trong quá trình nâng cấp hoặc bảo trì định kỳ. Vui lòng quay lại sau ít phút!
          </p>
          <Button
            className="mt-5"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Thử lại
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 py-16 text-center bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Không tìm thấy sản phẩm laptop phù hợp
          </h3>
          <p className="mt-1 text-xs text-slate-500">Hãy thử thay đổi hoặc chọn nút Bỏ lọc.</p>
          <Button
            className="mt-4 bg-red-600 text-white hover:bg-red-700 font-bold"
            onClick={() => navigate({ search: {} })}
          >
            Bỏ lọc
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
