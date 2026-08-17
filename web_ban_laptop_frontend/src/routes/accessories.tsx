import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  Mouse,
  Keyboard,
  Headphones,
  Sparkles,
  ShieldCheck,
  Truck,
  RefreshCw,
  Laptop2,
  Plug,
  Package,
  Loader2,
} from "lucide-react";
import { formatVND } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { fetchPhuKiens, type ApiPhuKien } from "@/lib/laptop-api";
import { AccessoryCard } from "@/components/AccessoryCard";

// ─── Danh mục phụ kiện ───────────────────────────────────────────────────────

type AccessoryCategory = "Chuột" | "Bàn phím" | "Tai nghe" | "Giá đỡ" | "Sạc laptop";

const LAPTOP_ACC: AccessoryCategory[] = ["Giá đỡ", "Sạc laptop"];
const LAPTOP_GROUP = "Phụ kiện laptop";

const TOP_GROUPS: { key: string; icon: typeof Mouse }[] = [
  { key: "Chuột", icon: Mouse },
  { key: "Bàn phím", icon: Keyboard },
  { key: "Tai nghe", icon: Headphones },
  { key: LAPTOP_GROUP, icon: Package },
];

const CATEGORY_ICON: Record<AccessoryCategory, typeof Mouse> = {
  Chuột: Mouse,
  "Bàn phím": Keyboard,
  "Tai nghe": Headphones,
  "Giá đỡ": Laptop2,
  "Sạc laptop": Plug,
};

// ─── Search schema ────────────────────────────────────────────────────────────

const searchSchema = z.object({
  cat: fallback(z.string(), "").default(""),
  sort: fallback(z.enum(["new", "price-asc", "price-desc", "rating"]), "new").default("new"),
});

export const Route = createFileRoute("/accessories")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Phụ kiện — Chuột · Bàn phím · Tai nghe · Giá đỡ · Sạc | Laptop Center" },
      {
        name: "description",
        content: "Phụ kiện laptop chính hãng: chuột, bàn phím cơ, tai nghe, giá đỡ, sạc GaN.",
      },
    ],
  }),
  component: AccessoriesPage,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map loaiPhuKien từ backend → AccessoryCategory hiển thị */
function mapLoai(loai: string | null): AccessoryCategory {
  if (!loai) return "Chuột";
  const l = loai.toLowerCase().trim();
  if (l.includes("bàn phím") || l.includes("ban phim") || l.includes("keyboard")) return "Bàn phím";
  if (l.includes("tai nghe") || l.includes("headphone") || l.includes("earphone"))
    return "Tai nghe";
  if (l.includes("giá đỡ") || l.includes("gia do") || l.includes("stand")) return "Giá đỡ";
  if (
    l.includes("sạc") ||
    l.includes("sac") ||
    l.includes("cáp") ||
    l.includes("cap") ||
    l.includes("charger") ||
    l.includes("gan")
  )
    return "Sạc laptop";
  return "Chuột";
}

// ─── Page Component ───────────────────────────────────────────────────────────

function AccessoriesPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  // Lưu raw ApiPhuKien[] để giữ đầy đủ thông tin (baoHanh, soLuongTon, ...)
  const [rawItems, setRawItems] = useState<ApiPhuKien[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPhuKiens()
      .then(setRawItems)
      .catch((err) => {
        console.warn("Lỗi gọi API /api/PhuKien:", err);
        setError("Hệ thống đang bảo trì. Vui lòng quay lại sau ít phút!");
        setRawItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Lọc + sắp xếp
  const filtered = useMemo(() => {
    let list = rawItems.filter((pk) => {
      const cat = mapLoai(pk.loaiPhuKien);
      if (!search.cat) return true;
      if (search.cat === LAPTOP_GROUP) return LAPTOP_ACC.includes(cat);
      return cat === search.cat || pk.loaiPhuKien === search.cat;
    });

    switch (search.sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.gia - b.gia);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.gia - a.gia);
        break;
      case "rating":
        list = [...list].sort((a, b) => (b as any).rating ?? 0 - ((a as any).rating ?? 0));
        break;
      default:
        /* new — giữ thứ tự API trả về */ break;
    }
    return list;
  }, [rawItems, search]);

  const setCat = (cat: string) =>
    navigate({ search: (p: any) => ({ ...p, cat }), resetScroll: false });

  const countForGroup = (key: string) =>
    key === LAPTOP_GROUP
      ? rawItems.filter((pk) => LAPTOP_ACC.includes(mapLoai(pk.loaiPhuKien))).length
      : rawItems.filter((pk) => mapLoai(pk.loaiPhuKien) === key || pk.loaiPhuKien === key).length;

  const inLaptopGroup =
    search.cat === LAPTOP_GROUP || LAPTOP_ACC.includes(search.cat as AccessoryCategory);

  return (
    <div className="px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl">


        {/* ── CONTROLS ── */}
        <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-foreground/5 bg-card p-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCat("")}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                !search.cat
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Tất cả · {rawItems.length}
            </button>
            {TOP_GROUPS.map(({ key, icon: Icon }) => {
              const active = key === LAPTOP_GROUP ? inLaptopGroup : search.cat === key;
              return (
                <button
                  key={key}
                  onClick={() => setCat(active ? "" : key)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="size-3.5" /> {key}{" "}
                  <span className="opacity-60">· {countForGroup(key)}</span>
                </button>
              );
            })}
          </div>

          <select
            value={search.sort}
            onChange={(e) =>
              navigate({ search: (p: any) => ({ ...p, sort: e.target.value }), resetScroll: false })
            }
            className="rounded-full border border-foreground/10 bg-background px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="new">Mới nhất</option>
            <option value="price-asc">Giá ↑</option>
            <option value="price-desc">Giá ↓</option>
            <option value="rating">Đánh giá</option>
          </select>
        </div>

        {/* Sub-pills nhóm "Phụ kiện laptop" */}
        {inLaptopGroup && (
          <div className="mb-6 flex flex-wrap items-center gap-1.5 rounded-2xl border border-dashed border-foreground/10 bg-card/50 p-2.5">
            <span className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Phụ kiện laptop ·
            </span>
            <button
              onClick={() => setCat(LAPTOP_GROUP)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                search.cat === LAPTOP_GROUP
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Tất cả
            </button>
            {LAPTOP_ACC.map((sub) => {
              const SubIcon = CATEGORY_ICON[sub];
              const active = search.cat === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setCat(active ? LAPTOP_GROUP : sub)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <SubIcon className="size-3.5" /> {sub}
                  <span className="opacity-60">
                    · {rawItems.filter((pk) => mapLoai(pk.loaiPhuKien) === sub).length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Kết quả / Bộ lọc */}
        {search.cat && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={() =>
                navigate({ search: { cat: "", sort: search.sort }, resetScroll: false })
              }
              className="text-xs font-semibold text-primary hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {/* ── GRID SẢN PHẨM ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-muted-foreground rounded-3xl border border-dashed border-foreground/10 bg-card/30">
            <Loader2 className="size-8 animate-spin text-primary" />
            <span className="text-sm font-medium">Đang tải phụ kiện...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center rounded-3xl border border-dashed border-red-200 bg-red-50/40">
            <p className="text-sm font-semibold text-red-600">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Thử lại
            </Button>
          </div>
        ) : rawItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center rounded-3xl border border-dashed border-foreground/10 bg-card/40">
            <div className="flex size-20 items-center justify-center rounded-full bg-muted/40 ring-1 ring-foreground/5">
              <Package className="size-9 text-muted-foreground/30 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                Hiện chưa có sản phẩm phụ kiện nào.
              </p>
              <p className="text-sm text-muted-foreground">Vui lòng quay lại sau!</p>
            </div>
            <Link to="/">
              <Button size="sm" className="mt-2 px-6 font-medium" variant="outline">
                Quay lại Trang chủ
              </Button>
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-foreground/10 py-20 text-center bg-card/40">
            <p className="text-sm text-muted-foreground">
              Không có phụ kiện phù hợp với bộ lọc đã chọn.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate({ search: {}, resetScroll: false })}
            >
              Xóa bộ lọc
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {filtered.map((pk) => (
              <AccessoryCard key={pk.maPhuKien} accessory={pk} />
            ))}
          </div>
        )}


      </div>
    </div>
  );
}
