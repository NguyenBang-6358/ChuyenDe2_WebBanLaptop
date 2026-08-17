import { Link } from "@tanstack/react-router";
import {
  Star,
  Tag,
  Building2,
  ShieldCheck,
  Package,
  Mouse,
  Keyboard,
  Wifi,
  Box,
  Battery,
  Headphones,
  Palette,
  Zap,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { formatVND } from "@/lib/format";
import { PaymentMethodLogos } from "./PaymentMethodLogos";
import type { ApiPhuKien } from "@/lib/laptop-api";


// ─── Re-export type cho nơi khác dùng ────────────────────────────────────────
export type { ApiPhuKien };

// ─── Star Rating ─────────────────────────────────────────────────────────────

function StarRating({ rating, count }: { rating: number; count: number }) {
  const avg = count > 0 ? Math.min(5, Math.max(0, rating)) : 0;
  const filled = Math.round(avg);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-px" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`size-3.5 ${i < filled ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
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

// ─── Spec Icon Mapper ────────────────────────────────────────────────────────

function getIconForLabel(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (l.includes("phân giải")) return Mouse;
  if (l.includes("bàn phím") || l.includes("phím")) return Keyboard;
  if (l.includes("kết nối")) return Wifi;
  if (l.includes("kích thước") || l.includes("trọng lượng")) return Box;
  if (l.includes("pin")) return Battery;
  if (l.includes("âm thanh") || l.includes("micro")) return Headphones;
  if (l.includes("led")) return Zap;
  if (l.includes("công suất") || l.includes("điện áp")) return Zap;
  return Settings2;
}

// ─── Specs Builder for Category ──────────────────────────────────────────────

export function getSpecsForCategory(
  loaiPhuKien: string | null,
  pk: ApiPhuKien,
): { label: string; value: string }[] {
  if (!loaiPhuKien) return [];
  const loai = loaiPhuKien.trim();

  if (loai === "Chuột") {
    const specs = [
      { label: "Độ phân giải", value: pk.doPhanGiai },
      { label: "Kết nối", value: pk.ketNoi },
      { label: "Đèn LED", value: pk.denLed },
    ];
    if (pk.doDaiDay && pk.doDaiDay.trim() !== "" && pk.doDaiDay.trim().toLowerCase() !== "null") {
      specs.push({ label: "Độ dài dây", value: pk.doDaiDay });
    }
    return specs
      .filter((s) => s.value !== null && s.value !== undefined && s.value.trim() !== "")
      .map((s) => ({ label: s.label, value: s.value! }));
  }

  if (loai === "Bàn phím") {
    return [
      { label: "Loại bàn phím", value: pk.loaiBanPhim },
      { label: "Số phím", value: pk.soPhim ? String(pk.soPhim) : null },
      { label: "Kết nối", value: pk.ketNoi },
      { label: "Đèn LED", value: pk.denLed },
    ]
      .filter((s) => s.value !== null && s.value !== undefined && s.value.trim() !== "")
      .map((s) => ({ label: s.label, value: s.value! }));
  }

  if (loai === "Tai nghe") {
    return [
      { label: "Kích thước", value: pk.kichThuoc },
      { label: "Trọng lượng", value: pk.trongLuong },
      { label: "Công nghệ âm thanh", value: pk.congNgheAmThanh },
      { label: "Micro", value: pk.micro },
      { label: "Kết nối", value: pk.ketNoi },
      { label: "Thời lượng pin", value: pk.thoiLuongPin },
    ]
      .filter((s) => s.value !== null && s.value !== undefined && s.value.trim() !== "")
      .map((s) => ({ label: s.label, value: s.value! }));
  }

  if (loai === "Giá đỡ") {
    return [{ label: "Phiên bản quạt", value: pk.phienBanQuat }]
      .filter((s) => s.value !== null && s.value !== undefined && s.value.trim() !== "")
      .map((s) => ({ label: s.label, value: s.value! }));
  }

  if (loai === "Sạc laptop") {
    return [
      { label: "Công suất", value: pk.congSuat },
      { label: "Điện áp đầu vào", value: pk.dienApDauVao },
      { label: "Điện áp đầu ra", value: pk.dienApDauRa },
      { label: "Kết nối", value: pk.ketNoi },
    ]
      .filter((s) => s.value !== null && s.value !== undefined && s.value.trim() !== "")
      .map((s) => ({ label: s.label, value: s.value! }));
  }

  return [];
}

// ─── Spec Row ────────────────────────────────────────────────────────────────

function SpecRow({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-1.5" title={value}>
      <Icon className="mt-0.5 size-3.5 shrink-0 text-gray-400" strokeWidth={1.75} aria-hidden />
      <span className="min-w-0 flex-1 line-clamp-2 text-[11px] leading-snug text-gray-600">
        {value}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function AccessoryCard({ accessory }: { accessory: ApiPhuKien }) {
  const price = Number(accessory.gia) || 0;
  const inStock = Number(accessory.soLuongTon) || 0;
  const reviewCount = accessory.soLuongDanhGia ?? 0;
  const rating = accessory.diemDanhGiaTrungBinh ?? 0;

  const isSale = Boolean(
    (accessory.giaKhuyenMai && Number(accessory.giaKhuyenMai) < price) ||
    (accessory.phanTramGiam && accessory.phanTramGiam > 0)
  );

  const originalGia = accessory.giaGoc || price;
  const giaKhuyenMaiVal = accessory.giaKhuyenMai || price;
  const phanTramGiamVal = accessory.phanTramGiam || (originalGia > giaKhuyenMaiVal ? Math.round((1 - giaKhuyenMaiVal / originalGia) * 100) : 0);

  // ── Xây dựng rows thông số kỹ thuật ──────────────────────────────────────
  const specs = getSpecsForCategory(accessory.loaiPhuKien, accessory);
  const specRows = specs.map((s) => ({
    icon: getIconForLabel(s.label),
    label: s.label,
    value: s.value,
  }));

  return (
    <Link
      to="/accessories/$id"
      params={{ id: String(accessory.maPhuKien) }}
      className="group block h-full"
    >
      <article className="flex h-full flex-col rounded-lg border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        {/* ── Khung ảnh ── */}
        <div className="relative mb-3 flex h-44 w-full items-center justify-center overflow-hidden rounded-md bg-white p-3">
          {accessory.anhDaiDien ? (
            <img
              src={accessory.anhDaiDien}
              alt={accessory.tenPhuKien}
              className="max-h-36 w-auto max-w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-xl"
              style={{
                background: `radial-gradient(130% 100% at 25% 15%, oklch(0.97 0.025 ${(accessory.tenPhuKien.charCodeAt(0) * 13) % 360}) 0%, oklch(0.85 0.07 ${(accessory.tenPhuKien.charCodeAt(0) * 13 + 45) % 360}) 100%)`,
              }}
            >
              <Tag className="size-14 text-white/70 drop-shadow" strokeWidth={1.2} />
            </div>
          )}

          {/* Badges Overlay */}
          {isSale && phanTramGiamVal > 0 ? (
            <span className="absolute top-2 left-2 z-10 inline-flex items-center justify-center min-w-[50px] px-3.5 py-1 rounded-full bg-[#c8181e] text-white text-xs font-bold shadow-xs">
              -{phanTramGiamVal}%
            </span>
          ) : inStock === 0 ? (
            <span className="absolute left-2 top-2 rounded-md bg-gray-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Hết hàng
            </span>
          ) : inStock > 0 && inStock <= 5 ? (
            <span className="absolute left-2 top-2 rounded-md bg-orange-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              Sắp hết
            </span>
          ) : null}
        </div>

        {/* ── Thương hiệu & Loại (subtitle nhỏ) ── */}
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {accessory.thuongHieu || "Chính hãng"}
          {accessory.loaiPhuKien && (
            <span className="ml-1.5 text-emerald-500">· {accessory.loaiPhuKien}</span>
          )}
        </p>

        {/* ── Tên sản phẩm ── */}
        <h3 className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-gray-900">
          {accessory.tenPhuKien}
        </h3>

        {/* ── Giá — đỏ nổi bật, giống hệt ProductCard (Laptop) ── */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {isSale && phanTramGiamVal > 0 ? (
            <>
              <span className="inline-flex rounded-md bg-red-600 px-2.5 py-1 text-sm font-bold text-white">
                {formatVND(giaKhuyenMaiVal)}
              </span>
              <span className="text-xs text-gray-400 line-through">
                {formatVND(originalGia)}
              </span>
              <span className="rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                -{phanTramGiamVal}%
              </span>
            </>
          ) : (
            <span className="inline-flex rounded-md bg-red-600 px-2.5 py-1 text-sm font-bold text-white">
              {formatVND(price)}
            </span>
          )}
        </div>

        {/* ── Vùng thông số — nền xám, các dòng dọc ── */}
        {specRows.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5 rounded-lg bg-[#f5f5f5] p-2.5">
            {specRows.map((row, i) => (
              <SpecRow key={i} icon={row.icon} value={`${row.label}: ${row.value}`} />
            ))}
          </div>
        )}

        {/* ── Icon thanh toán + Sao đánh giá thật ── */}
        <div className="mt-auto pt-3">
          <PaymentMethodLogos />
          <div className="mt-2">
            <StarRating rating={rating} count={reviewCount} />
          </div>
        </div>
      </article>
    </Link>
  );
}
