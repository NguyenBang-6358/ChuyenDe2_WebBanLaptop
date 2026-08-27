if (typeof process !== "undefined" && process.env) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

import type { Product, Brand, CpuFamily, GpuFamily, Need } from "./products";
import { cacheApiProducts, cacheApiProduct, products } from "./products";
import { getAuthHeaders, useAuth } from "./auth-store";


/**
 * Base URL của Backend .NET. Cấu hình qua biến môi trường VITE_API_BASE_URL
 * (đặt trong file .env ở gốc dự án). Mặc định trỏ về localhost dev của .NET.
 *
 * LƯU Ý: Preview chạy trên cloud KHÔNG thể gọi `https://localhost:7281`.
 * Hãy mở preview ngay trên máy đang chạy backend, hoặc expose backend qua
 * ngrok/cloudflared rồi đặt VITE_API_BASE_URL=https://your-tunnel.ngrok.app
 */
export const API_BASE_URL: string =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL)
    ? import.meta.env.VITE_API_BASE_URL
    : "https://localhost:7281";

export const LAPTOP_IMAGE_PREFIX = `${API_BASE_URL}/images/laptops/`;

/** Shape trả về từ GET /api/SanPham */
export interface ApiSanPham {
  maSanPham: number;
  tenSanPham: string;
  gia: number;
  soLuongTon: number;
  anhDaiDien: string | null;
  moTa: string | null;
  cpu: string | null;
  ram: string | null;
  oCung: string | null;
  cardDoHoa: string | null;
  manHinh: string | null;
  pin: string | null;
  heDieuHanh: string | null;
  thuongHieu?: {
    maThuongHieu: string | number;
    tenThuongHieu: string;
    logo?: string | null;
  } | null;
  danhMuc?: { maDanhMuc: number; tenDanhMuc: string } | null;
  maThuongHieu?: string | number | null;
  maDanhMuc?: number | null;
  soLuongDanhGia?: number;
  diemDanhGiaTrungBinh?: number;
  hinhAnhSanPhams?: Array<{ maHinhAnh: number; maSanPham: number; duongDanAnh: string }> | null;
  albumAnh?: string[] | null;
  giaGoc?: number | null;
  phanTramGiam?: number | null;
  giaKhuyenMai?: number | null;
  maKhuyenMai?: number | null;
  khuyenMai?: ApiKhuyenMai | null;
}

// Giữ lại kiểu alias cho khả năng tương thích ngược
export type ApiLaptop = ApiSanPham;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const BRAND_FALLBACK: Brand = "ASUS";
const KNOWN_BRANDS: Brand[] = ["ASUS", "Lenovo", "MSI", "Acer", "HP", "Dell", "GIGABYTE"];

const normalizeBrand = (s?: string | null): Brand => {
  if (!s) return BRAND_FALLBACK;
  const upper = s.trim();
  const hit = KNOWN_BRANDS.find((b) => b.toLowerCase() === upper.toLowerCase());
  return hit ?? (upper as Brand);
};

const inferNeed = (cat?: string | null): Need[] => {
  if (!cat) return ["Văn phòng"];
  const c = cat.toLowerCase();
  if (c.includes("gaming") || c.includes("game")) return ["Gaming"];
  if (c.includes("đồ họa") || c.includes("do hoa") || c.includes("studio")) return ["Đồ họa"];
  if (c.includes("mỏng") || c.includes("mong") || c.includes("ultrabook")) return ["Mỏng nhẹ"];
  if (c.includes("sinh viên") || c.includes("sinh vien")) return ["Sinh viên"];
  if (c.includes("ai")) return ["Laptop AI"];
  if (c.includes("cảm ứng") || c.includes("touch")) return ["Cảm ứng"];
  return ["Văn phòng"];
};

export const resolveLaptopImage = (anhDaiDien: string | null | undefined): string => {
  if (!anhDaiDien) return "";
  if (/^https?:\/\//i.test(anhDaiDien)) return anhDaiDien;
  return LAPTOP_IMAGE_PREFIX + anhDaiDien.replace(/^\/+/, "");
};

const BRAND_NAMES: Record<string, string> = {
  AS: "ASUS",
  AC: "Acer",
  DE: "Dell",
  HP: "HP",
  MS: "MSI",
  AP: "Apple",
  LE: "Lenovo",
  GI: "GIGABYTE",
  "1": "ASUS",
  "2": "Lenovo",
  "3": "Dell",
  "4": "HP",
  "5": "MSI",
  "6": "Apple",
  "7": "Acer",
  "8": "GIGABYTE",
};

const CATEGORY_NAMES: Record<string, string> = {
  "1": "Gaming",
  "2": "Văn phòng",
  "3": "Đồ họa",
  "4": "Mỏng nhẹ",
  "5": "Sinh viên",
  "6": "Laptop AI",
  "7": "Cảm ứng",
  GM: "Gaming",
  VP: "Văn phòng",
  DH: "Đồ họa",
  MN: "Mỏng nhẹ",
  SV: "Sinh viên",
};

export const CATEGORY_MAP: Record<string, number> = {
  Gaming: 1,
  "Văn phòng": 2,
  "Đồ họa": 3,
  "Mỏng nhẹ": 4,
  "Sinh viên": 5,
  "Laptop AI": 6,
  "Cảm ứng": 7,
};

/** Map đối tượng SanPham từ API sang Product để dùng cho UI hiện tại. */
export function mapSanPhamToProduct(l: ApiSanPham): Product {
  const rawObj = l as any;
  const id = String(
    l.maSanPham ??
    rawObj.maSanPham ??
    rawObj.MaSanPham ??
    rawObj.ma_san_pham ??
    rawObj.maLaptop ??
    rawObj.MaLaptop ??
    rawObj.ma_laptop ??
    "",
  );
  const name = l.tenSanPham ?? rawObj.tenSanPham ?? rawObj.TenSanPham ?? rawObj.ten_san_pham ?? "";

  // Resolve brand name (e.g. abbreviation "AS" -> "ASUS", "AC" -> "Acer")
  let brandName =
    l.thuongHieu?.tenThuongHieu ??
    rawObj.thuongHieu?.tenThuongHieu ??
    rawObj.ThuongHieu?.TenThuongHieu ??
    rawObj.thuong_hieu?.ten_thuong_hieu ??
    "";
  if (!brandName) {
    const maThuongHieu = String(
      l.maThuongHieu ?? rawObj.maThuongHieu ?? rawObj.MaThuongHieu ?? rawObj.ma_thuong_hieu ?? "",
    );
    brandName = BRAND_NAMES[maThuongHieu.toUpperCase()] || maThuongHieu || "ASUS";
  } else {
    const norm = brandName.trim().toUpperCase();
    if (BRAND_NAMES[norm]) brandName = BRAND_NAMES[norm];
  }

  // Resolve category name (e.g. "GM" -> "Gaming", "VP" -> "Văn phòng")
  let catName =
    l.danhMuc?.tenDanhMuc ??
    rawObj.danhMuc?.tenDanhMuc ??
    rawObj.DanhMuc?.TenDanhMuc ??
    rawObj.danh_muc?.ten_danh_muc ??
    "";
  if (!catName) {
    const maDanhMuc = String(
      l.maDanhMuc ?? rawObj.maDanhMuc ?? rawObj.MaDanhMuc ?? rawObj.ma_danh_muc ?? "",
    );
    catName = CATEGORY_NAMES[maDanhMuc.toUpperCase()] || maDanhMuc || "Văn phòng";
  } else {
    const norm = catName.trim().toUpperCase();
    if (CATEGORY_NAMES[norm]) catName = CATEGORY_NAMES[norm];
  }

  const slug = `${slugify(name)}-${id}`;
  const image = resolveLaptopImage(
    l.anhDaiDien ?? rawObj.anhDaiDien ?? rawObj.AnhDaiDien ?? rawObj.anh_dai_dien,
  );
  const basePriceVal = Number(l.gia ?? rawObj.gia ?? rawObj.Gia) || 0;
  const km = l.khuyenMai ?? rawObj.khuyenMai ?? rawObj.KhuyenMai;
  let isPromoExpired = false;
  if (km) {
    if (km.trangThai === "het_han" || km.trang_thai === "het_han" || km.trangThai === "da_ket_thuc") {
      isPromoExpired = true;
    }
    const endStr = km.ngayKetThuc ?? km.ngay_ket_thuc ?? km.NgayKetThuc;
    if (endStr) {
      const cleanIso = String(endStr).endsWith("Z") ? String(endStr).slice(0, -1) : String(endStr);
      const endMs = new Date(cleanIso).getTime();
      if (!isNaN(endMs) && endMs <= Date.now()) {
        isPromoExpired = true;
      }
    }
  }

  const giaGoc =
    l.giaGoc !== undefined && l.giaGoc !== null
      ? Number(l.giaGoc)
      : rawObj.giaGoc !== undefined && rawObj.giaGoc !== null
        ? Number(rawObj.giaGoc)
        : undefined;
  const phanTramGiam =
    !isPromoExpired && l.phanTramGiam !== undefined && l.phanTramGiam !== null
      ? Number(l.phanTramGiam)
      : !isPromoExpired && rawObj.phanTramGiam !== undefined && rawObj.phanTramGiam !== null
        ? Number(rawObj.phanTramGiam)
        : undefined;
  const giaKhuyenMai =
    !isPromoExpired && l.giaKhuyenMai !== undefined && l.giaKhuyenMai !== null
      ? Number(l.giaKhuyenMai)
      : !isPromoExpired && rawObj.giaKhuyenMai !== undefined && rawObj.giaKhuyenMai !== null
        ? Number(rawObj.giaKhuyenMai)
        : undefined;

  const giaKhuyenMaiNum =
    giaKhuyenMai !== undefined && giaKhuyenMai !== null && Number(giaKhuyenMai) > 0
      ? Number(giaKhuyenMai)
      : null;

  const basePrice =
    giaKhuyenMaiNum !== null && giaKhuyenMaiNum < basePriceVal
      ? giaKhuyenMaiNum
      : basePriceVal;

  const originalPrice =
    giaKhuyenMaiNum !== null && giaKhuyenMaiNum < basePriceVal
      ? basePriceVal
      : giaGoc ?? basePriceVal;
  const stockQuantity = Math.max(
    0,
    Number(l.soLuongTon ?? rawObj.soLuongTon ?? rawObj.SoLuongTon ?? rawObj.so_luong_ton) || 0,
  );

  const cpu = l.cpu ?? rawObj.cpu ?? rawObj.Cpu ?? "Intel Core i5";
  const gpu =
    l.cardDoHoa ?? rawObj.cardDoHoa ?? rawObj.CardDoHoa ?? rawObj.card_do_hoa ?? "Iris Xe";
  const display = l.manHinh ?? rawObj.manHinh ?? rawObj.ManHinh ?? rawObj.man_hinh ?? "";
  const ram = l.ram ?? rawObj.ram ?? rawObj.Ram ?? undefined;
  const storage = l.oCung ?? rawObj.oCung ?? rawObj.OCung ?? rawObj.o_cung ?? undefined;
  const battery = l.pin ?? rawObj.pin ?? rawObj.Pin ?? "";
  const heDieuHanh =
    l.heDieuHanh ?? rawObj.heDieuHanh ?? rawObj.HeDieuHanh ?? rawObj.he_dieu_hanh ?? undefined;
  const description = (l.moTa ?? rawObj.moTa ?? rawObj.MoTa ?? rawObj.mo_ta ?? "").trim();

  const parseRam = (r?: string | null): number => {
    if (!r) return 8;
    const match = r.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 8;
  };

  const parseStorage = (s?: string | null): number => {
    if (!s) return 512;
    const match = s.match(/(\d+)/);
    if (!match) return 512;
    const val = parseInt(match[1], 10);
    if (s.toLowerCase().includes("tb")) return val * 1024;
    return val;
  };

  const realRam = parseRam(ram);
  const realSsd = parseStorage(storage);

  const baseVariant = { ram: realRam as any, ssd: realSsd as any, priceDelta: 0 };
  const virtualVariants = [
    { ram: 8, ssd: 512 },
    { ram: 16, ssd: 512 },
    { ram: 16, ssd: 1024 },
    { ram: 32, ssd: 1024 },
  ];

  const variants = [baseVariant];
  for (const vv of virtualVariants) {
    if (vv.ram === realRam && vv.ssd === realSsd) {
      continue;
    }
    let priceDelta = 0;
    if (vv.ram !== realRam) {
      priceDelta += Math.round((vv.ram - realRam) * (basePrice * 0.01));
    }
    if (vv.ssd !== realSsd) {
      priceDelta += Math.round((vv.ssd - realSsd) * (basePrice * 0.0002));
    }
    variants.push({
      ram: vv.ram as any,
      ssd: vv.ssd as any,
      priceDelta,
    });
  }

  const mappedRes: Product = {
    id,
    slug,
    name,
    brand: normalizeBrand(brandName),
    needs: inferNeed(catName) as Need[],
    cpu: cpu as CpuFamily,
    gpu: gpu as GpuFamily,
    basePrice,
    display,
    ram,
    storage,
    battery,
    heDieuHanh,
    oCung: storage,
    manHinh: display,
    pin: battery,
    weight: "",
    warranty: "24 tháng",
    variants,
    anhDaiDien: image || undefined,
    images: (() => {
      let mappedImages: string[] = [];
      if (l.hinhAnhSanPhams && l.hinhAnhSanPhams.length > 0) {
        mappedImages = l.hinhAnhSanPhams.map((img) => resolveLaptopImage(img.duongDanAnh));
      } else if (l.albumAnh && l.albumAnh.length > 0) {
        mappedImages = l.albumAnh.map((img) => resolveLaptopImage(img));
      } else if (rawObj.hinhAnhSanPhams && Array.isArray(rawObj.hinhAnhSanPhams)) {
        mappedImages = rawObj.hinhAnhSanPhams.map((img: any) =>
          resolveLaptopImage(img.duongDanAnh ?? img.duong_dan_anh),
        );
      } else if (rawObj.albumAnh && Array.isArray(rawObj.albumAnh)) {
        mappedImages = rawObj.albumAnh.map((img: string) => resolveLaptopImage(img));
      }
      const list = mappedImages.length > 0
        ? mappedImages
        : image
          ? [image]
          : [];
      return Array.from(new Set(list));
    })(),
    rating: Math.max(
      0,
      Number(
        l.diemDanhGiaTrungBinh ?? rawObj.diemDanhGiaTrungBinh ?? rawObj.DiemDanhGiaTrungBinh,
      ) || 0,
    ),
    reviewCount: Math.max(
      0,
      Number(l.soLuongDanhGia ?? rawObj.soLuongDanhGia ?? rawObj.SoLuongDanhGia) || 0,
    ),
    stockQuantity,
    description,
    maThuongHieu:
      l.maThuongHieu ??
      rawObj.maThuongHieu ??
      rawObj.MaThuongHieu ??
      rawObj.ma_thuong_hieu ??
      undefined,
    maDanhMuc:
      l.maDanhMuc !== undefined
        ? Number(l.maDanhMuc)
        : rawObj.maDanhMuc !== undefined
          ? Number(rawObj.maDanhMuc)
          : rawObj.MaDanhMuc !== undefined
            ? Number(rawObj.MaDanhMuc)
            : rawObj.ma_danh_muc !== undefined
              ? Number(rawObj.ma_danh_muc)
              : undefined,
    giaGoc,
    originalPrice: giaGoc,
    phanTramGiam,
    ngayKetThuc:
      l.khuyenMai?.ngayKetThuc ??
      rawObj.khuyenMai?.ngayKetThuc ??
      rawObj.KhuyenMai?.NgayKetThuc ??
      undefined,
  };
  return mappedRes;
}

// Khả năng tương thích ngược
export const mapLaptopToProduct = mapSanPhamToProduct;

/** Lấy danh sách sản phẩm từ API /api/SanPham */
export async function fetchLaptops({
  maDanhMuc,
  signal,
}: { maDanhMuc?: number | string; signal?: AbortSignal } = {}): Promise<Product[]> {
  let url = `${API_BASE_URL}/api/SanPham`;
  if (maDanhMuc) {
    url += `?maDanhMuc=${encodeURIComponent(maDanhMuc)}`;
  }
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} khi gọi ${url}`);
  }
  const data: ApiSanPham[] = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("API không trả về mảng sản phẩm hợp lệ");
  }
  const mapped = data.map(mapSanPhamToProduct);
  cacheApiProducts(mapped);
  return mapped;
}

export function mapFlashSaleItemToProduct(item: any): Product {
  const idStr = item.loaiSanPham === "phu_kien" ? `acc_${item.id}` : String(item.id);
  const slug =
    item.loaiSanPham === "phu_kien"
      ? `${slugify(item.ten)}-pk${item.id}`
      : `${slugify(item.ten)}-${item.id}`;
  const image = resolveLaptopImage(item.hinhAnh || "");
  const basePrice = Number(item.giaKhuyenMai) || Number(item.giaGoc) || 0;

  return {
    id: idStr,
    slug,
    name: item.ten,
    brand: (item.loaiSanPham === "phu_kien" ? (item.thuongHieu || "Phụ kiện") : "ASUS") as Brand,
    needs: [],
    cpu: item.cpu || ("Intel Core i5" as CpuFamily),
    gpu: item.cardDoHoa || item.gpu || ("Iris Xe" as GpuFamily),
    ram: item.ram || undefined,
    storage: item.oCung || undefined,
    oCung: item.oCung || undefined,
    manHinh: item.manHinh || undefined,
    pin: item.pin || undefined,
    basePrice,
    originalPrice: Number(item.giaGoc) || 0,
    display: item.manHinh || item.loaiPhuKien || "",
    battery: item.pin || "",
    weight: item.trongLuong || "",
    warranty: item.baoHanh || "12 tháng",
    variants: [{ ram: 8, ssd: 512, priceDelta: 0 }],
    anhDaiDien: image || undefined,
    images: (() => {
      let subImgs: string[] = [];
      if (item.hinhAnhSanPhams && Array.isArray(item.hinhAnhSanPhams)) {
        subImgs = item.hinhAnhSanPhams.map((x: any) =>
          resolveLaptopImage(typeof x === "string" ? x : x.duongDanAnh || x.duong_dan_anh || ""),
        );
      }
      if (image) subImgs.unshift(image);
      const unique = Array.from(new Set(subImgs.filter(Boolean)));
      return unique.length > 0 ? unique : image ? [image] : [];
    })(),
    description: "",
    rating: 5,
    reviewCount: 0,
    giaGoc: Number(item.giaGoc) || 0,
    phanTramGiam: Number(item.phanTramGiam) || 0,
    ngayKetThuc: item.ngayKetThuc || undefined,
    loaiSanPham: item.loaiSanPham,
    loaiPhuKien: item.loaiPhuKien || item.loai_phu_kien || undefined,
    ketNoi: item.ketNoi || item.ket_noi || undefined,
    denLed: item.denLed || item.den_led || undefined,
    thuongHieu: item.thuongHieu || item.thuong_hieu || undefined,
    doPhanGiai: item.doPhanGiai || undefined,
    loaiBanPhim: item.loaiBanPhim || undefined,
    congNgheAmThanh: item.congNgheAmThanh || undefined,
    thoiLuongPin: item.thoiLuongPin || undefined,
    kichThuoc: item.kichThuoc || undefined,
    baoHanh: item.baoHanh || undefined,
  };
}

/** Lấy danh sách sản phẩm Flash Sale từ API /api/SanPham/flash-sale */
export async function fetchFlashSaleProducts(signal?: AbortSignal): Promise<Product[]> {
  try {
    const url = `${API_BASE_URL}/api/SanPham/flash-sale`;
    const res = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      const rawList = Array.isArray(data) ? data : (data?.$values ?? []);
      let mapped = rawList.map(mapFlashSaleItemToProduct);
      mapped = mapped.filter((p: Product) => {
        if (!p.originalPrice || p.originalPrice <= p.basePrice) return false;
        if (p.ngayKetThuc) {
          const cleanIso = p.ngayKetThuc.endsWith("Z") ? p.ngayKetThuc.slice(0, -1) : p.ngayKetThuc;
          const endMs = new Date(cleanIso).getTime();
          if (!isNaN(endMs) && endMs <= Date.now()) return false;
        }
        return true;
      });
      cacheApiProducts(mapped);
      return mapped;
    }
  } catch (e) {
    console.warn("Lỗi gọi API Flash Sale, tự động lọc sản phẩm giảm giá:", e);
  }

  // Fallback: Lấy tất cả sản phẩm & phụ kiện có giaKhuyenMai < gia
  const allLaptops = await fetchLaptops({ signal }).catch(() => []);
  const allPhuKien = await fetchPhuKiens().then((list) => list.map(mapPhuKienToProduct)).catch(() => []);
  const combined = [...allLaptops, ...allPhuKien];
  const flashSaleList = combined.filter((p: Product) => Boolean(p.originalPrice && p.originalPrice > p.basePrice));
  cacheApiProducts(flashSaleList);
  return flashSaleList;
}

/** Lấy sản phẩm liên quan từ API /api/SanPham/{id}/related hoặc tự động tìm kiếm theo thương hiệu / danh mục */
export async function fetchRelatedProducts(
  id: number | string,
  signal?: AbortSignal,
): Promise<Product[]> {
  const numId = Number(id);
  const endpoints = [
    `${API_BASE_URL}/api/SanPham/${id}/related`,
    `${API_BASE_URL}/api/products/${id}/related`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        signal,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data: ApiSanPham[] = await res.json();
        const list = Array.isArray(data) ? data : ((data as any)?.$values ?? []);
        if (list.length > 0) {
          const mapped = list.map(mapSanPhamToProduct);
          cacheApiProducts(mapped);
          return mapped;
        }
      }
    } catch {}
  }

  // Fallback: Lấy tất cả laptops từ API và lọc theo cùng thương hiệu hoặc cùng danh mục
  try {
    const allLaptops = await fetchLaptops({ signal }).catch(() => []);
    if (allLaptops.length > 0) {
      const current = allLaptops.find((p) => Number(p.id) === numId || p.slug === String(id));
      const related = allLaptops.filter((p) => {
        if (Number(p.id) === numId) return false;
        if (current) {
          return (
            (p.brand && p.brand === current.brand) ||
            (p.maDanhMuc && p.maDanhMuc === current.maDanhMuc)
          );
        }
        return true;
      });
      return related.slice(0, 8);
    }
  } catch {}

  return [];
}

/** Lấy chi tiết sản phẩm từ API /api/SanPham/{id} */
export async function fetchProductById(
  id: number | string,
  signal?: AbortSignal,
): Promise<Product> {
  const url = `${API_BASE_URL}/api/SanPham/${id}`;
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} khi gọi ${url}`);
  }
  const data: ApiSanPham = await res.json();
  const product = mapSanPhamToProduct(data);
  cacheApiProduct(product);
  return product;
}

/* ───────────────────────────────────────────────
   PHỤ KIỆN (Standalone — không kế thừa SanPham)
   ─────────────────────────────────────────────── */

/** Shape trả về từ GET /api/PhuKien — khớp PhuKienDto mới (độc lập) */
export interface ApiPhuKien {
  maPhuKien: number;
  tenPhuKien: string;
  gia: number;
  soLuongTon: number;
  anhDaiDien: string | null;
  moTa: string | null;
  loaiPhuKien: string | null; // "Chuột" | "Bàn phím" | "Tai nghe" | "Pad chuột" | ...
  thuongHieu: string | null; // Tên thương hiệu dạng text (khác Laptop dùng FK)
  ketNoi: string | null;
  denLed: string | null;
  doPhanGiai: string | null;
  doDaiDay: string | null;
  loaiBanPhim: string | null;
  soPhim: number | null;
  kichThuoc: string | null;
  trongLuong: string | null;
  congNgheAmThanh: string | null;
  micro: string | null;
  thoiLuongPin: string | null;
  phienBanQuat: string | null;
  congSuat: string | null;
  dienApDauVao: string | null;
  dienApDauRa: string | null;
  baoHanh: string | null;
  ngayTao?: string | null;
  /** Tổng hợp từ bảng danh_gia — backend gán khi trả API */
  soLuongDanhGia?: number;
  diemDanhGiaTrungBinh?: number;
  giaGoc?: number | null;
  phanTramGiam?: number | null;
  giaKhuyenMai?: number | null;
  maKhuyenMai?: number | null;
}

/** Slug helper cho PhuKien */
export function phuKienSlug(pk: ApiPhuKien): string {
  const s = pk.tenPhuKien
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${s}-pk${pk.maPhuKien}`;
}

/** Lấy danh sách phụ kiện từ API: GET /api/PhuKien */
export async function fetchPhuKiens(signal?: AbortSignal): Promise<ApiPhuKien[]> {
  const res = await fetch(`${API_BASE_URL}/api/PhuKien`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`API ${res.status} khi gọi /api/PhuKien`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export function mapPhuKienToProduct(phuKien: ApiPhuKien): Product {
  const image = phuKien.anhDaiDien || "";
  const basePrice =
    phuKien.giaKhuyenMai !== null && phuKien.giaKhuyenMai !== undefined
      ? Number(phuKien.giaKhuyenMai)
      : phuKien.gia || 0;
  const mappedAcc: Product = {
    id: `acc_${phuKien.maPhuKien}`,
    slug: phuKienSlug(phuKien),
    name: phuKien.tenPhuKien,
    brand: (phuKien.thuongHieu || "Phụ kiện") as Brand,
    needs: [],
    cpu: "Intel Core i5" as CpuFamily,
    gpu: "Iris Xe" as GpuFamily,
    basePrice,
    originalPrice: phuKien.gia || 0,
    display: phuKien.loaiPhuKien || "",
    battery: "",
    weight: "",
    warranty: phuKien.baoHanh || "12 tháng",
    variants: [{ ram: 8, ssd: 512, priceDelta: 0 }],
    anhDaiDien: image,
    images: [image, image, image, image],
    description: (phuKien.moTa || (phuKien as any).MoTa || (phuKien as any).mo_ta || "").trim(),
    rating: phuKien.diemDanhGiaTrungBinh || 0,
    reviewCount: phuKien.soLuongDanhGia || 0,
    giaGoc:
      phuKien.giaGoc !== null && phuKien.giaGoc !== undefined ? Number(phuKien.giaGoc) : undefined,
    phanTramGiam:
      phuKien.phanTramGiam !== null && phuKien.phanTramGiam !== undefined
        ? Number(phuKien.phanTramGiam)
        : undefined,
    giaKhuyenMai:
      phuKien.giaKhuyenMai !== null && phuKien.giaKhuyenMai !== undefined
        ? Number(phuKien.giaKhuyenMai)
        : undefined,
  };
  return mappedAcc;
}

/** Lấy chi tiết phụ kiện theo ID: GET /api/PhuKien/{id} */
export async function fetchPhuKienById(
  id: number | string,
  signal?: AbortSignal,
): Promise<ApiPhuKien> {
  const res = await fetch(`${API_BASE_URL}/api/PhuKien/${id}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`API ${res.status} khi gọi /api/PhuKien/${id}`);
  const data = await res.json();
  cacheApiProduct(mapPhuKienToProduct(data));
  return data;
}

/** Lấy danh sách phụ kiện liên quan: GET /api/PhuKien/{id}/related */
export async function fetchRelatedAccessories(
  id: number | string,
  signal?: AbortSignal,
): Promise<ApiPhuKien[]> {
  const res = await fetch(`${API_BASE_URL}/api/PhuKien/${id}/related`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`API ${res.status} khi gọi /api/PhuKien/${id}/related`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** Shape trả về từ GET /api/DanhGia?maSanPham= */
export interface ApiDanhGia {
  maDanhGia: number;
  soSao: number;
  noiDung: string;
  ngayDanhGia?: string | null;
  tenNguoiDung: string;
  anhDaiDien?: string | null;
  phanHoiCuaAdmin?: string | null;
}

export interface ProductReview {
  id: number;
  name: string;
  rating: number;
  comment: string;
  date?: string | null;
  avatar?: string | null;
  phanHoiCuaAdmin?: string | null;
}

/** Lấy danh sách đánh giá theo mã sản phẩm */
export async function fetchProductReviews(
  maSanPham: number | string,
  signal?: AbortSignal,
): Promise<ProductReview[]> {
  const url = `${API_BASE_URL}/api/DanhGia/san-pham/${encodeURIComponent(String(maSanPham))}`;
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} khi gọi ${url}`);
  }
  const data: any[] = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((d) => ({
    id: d.maDanhGia,
    name: d.hoTen?.trim() || "Khách",
    rating: Math.min(5, Math.max(0, Number(d.soSao) || 0)),
    comment: d.noiDung?.trim() || "",
    date: d.ngayDanhGia ?? null,
    avatar: d.anhDaiDien ?? null,
    phanHoiCuaAdmin: d.phanHoiCuaAdmin ?? null,
  }));
}

export interface CreateReviewRequest {
  maSanPham: number;
  soSao: number;
  noiDung: string;
}

/**
 * Gửi đánh giá mới xuống Backend
 */
export async function submitProductReview(
  data: CreateReviewRequest,
): Promise<{ message: string; maDanhGia: number }> {
  const url = `${API_BASE_URL}/api/DanhGia`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...getAuthHeaders(),
  };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message =
      (typeof errorData?.message === "string" && errorData.message) ||
      `Lỗi gửi đánh giá: ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

export interface CreateAccessoryReviewRequest {
  maPhuKien: number;
  soSao: number;
  noiDung: string;
}

export async function submitAccessoryReview(
  data: CreateAccessoryReviewRequest,
): Promise<{ message: string; maDanhGia: number }> {
  const url = `${API_BASE_URL}/api/DanhGia`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...getAuthHeaders(),
  };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      maPhuKien: data.maPhuKien,
      maSanPham: null,
      soSao: data.soSao,
      noiDung: data.noiDung,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message =
      (typeof errorData?.message === "string" && errorData.message) ||
      `Lỗi gửi đánh giá phụ kiện: ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

/** Lấy danh sách đánh giá theo mã phụ kiện */
export async function fetchPhuKienReviews(
  maPhuKien: number | string,
  signal?: AbortSignal,
): Promise<ProductReview[]> {
  const url = `${API_BASE_URL}/api/DanhGia?maPhuKien=${encodeURIComponent(String(maPhuKien))}`;
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} khi gọi ${url}`);
  }
  const data: ApiDanhGia[] = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((d) => ({
    id: d.maDanhGia,
    name: d.tenNguoiDung?.trim() || "Khách",
    rating: Math.min(5, Math.max(0, Number(d.soSao) || 0)),
    comment: d.noiDung?.trim() || "",
    date: d.ngayDanhGia ?? null,
    avatar: d.anhDaiDien ?? null,
    phanHoiCuaAdmin: d.phanHoiCuaAdmin ?? null,
  }));
}

/** Thêm sản phẩm hoặc phụ kiện vào giỏ hàng: POST /api/GioHang/them */
export async function addToCartApi(
  maNguoiDung: number,
  maSanPham: number | null,
  maPhuKien: number | null,
  soLuong: number,
): Promise<void> {
  const url = `${API_BASE_URL}/api/GioHang/them`;
  const body: any = { maNguoiDung, soLuong };
  if (maSanPham !== null) body.maSanPham = maSanPham;
  if (maPhuKien !== null) body.maPhuKien = maPhuKien;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    console.error(`Lỗi API GioHang/them (status ${res.status}):`, errorText);
    throw new Error(`Lỗi khi thêm vào giỏ hàng: ${res.status}. Chi tiết: ${errorText}`);
  }
}

/** Lấy thông tin giỏ hàng từ API: GET /api/GioHang/{maNguoiDung} */
export async function getCartApi(
  maNguoiDung: number,
): Promise<
  { maSanPham: number | null; maPhuKien: number | null; soLuong: number; maChiTiet: number }[]
> {
  const url = `${API_BASE_URL}/api/GioHang/${maNguoiDung}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    throw new Error(`Lỗi khi lấy giỏ hàng: ${res.status}`);
  }
  const data = await res.json();
  // Backend trả về đối tượng GioHang chứa mảng chiTietGioHangs
  if (data && typeof data === "object" && Array.isArray(data.chiTietGioHangs)) {
    return data.chiTietGioHangs.map((item: any) => ({
      maSanPham: item.maSanPham ?? null,
      maPhuKien: item.maPhuKien ?? null,
      soLuong: item.soLuong || 0,
      maChiTiet: item.maChiTiet,
    }));
  }
  return [];
}

/** Xóa sản phẩm khỏi giỏ hàng: DELETE /api/GioHang/xoa/{maChiTiet} */
export async function removeFromCartApi(maChiTiet: number): Promise<void> {
  const url = `${API_BASE_URL}/api/GioHang/xoa/${maChiTiet}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    console.error(`Lỗi API DELETE GioHang (status ${res.status}):`, errorText);
    throw new Error(`Lỗi khi xóa sản phẩm khỏi giỏ hàng: ${res.status}. Chi tiết: ${errorText}`);
  }
}

export interface CartItemDtoPayload {
  maSanPham?: number | null;
  maPhuKien?: number | null;
  soLuong: number;
}

export interface OrderRequest {
  maNguoiDung: number;
  hoTen: string;
  soDienThoai: string;
  diaChiGiaoHang: string;
  phuongThucThanhToan: "tien_mat" | "chuyen_khoan";
  chiTietGioHang?: CartItemDtoPayload[];
}

export interface OrderResponse {
  message: string;
  maDonHang: number;
}

/** Gửi đặt hàng đến API: POST /api/DonHang */
export async function placeOrderApi(order: OrderRequest): Promise<OrderResponse> {
  const url = `${API_BASE_URL}/api/DonHang`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!res.ok) {
    let data: any = null;
    try {
      data = await res.json();
    } catch (_) {
      try {
        const text = await res.text();
        data = { message: text };
      } catch (__) { }
    }
    const err: any = new Error(data?.message || `Lỗi khi đặt hàng: ${res.status}`);
    err.response = {
      status: res.status,
      data: data,
    };
    throw err;
  }
  return res.json();
}

/* ───────────────────────────────────────────────
   AUTH APIs — Đăng ký / Đăng nhập
   ─────────────────────────────────────────────── */

export interface RegisterRequest {
  hoTen: string;
  email: string;
  matKhau: string;
  diaChi?: string;
  soDienThoai?: string;
}

export interface LoginRequest {
  email: string;
  matKhau: string;
}

export type LoginErrorField = "email" | "password";

export class LoginApiError extends Error {
  readonly field: LoginErrorField;

  constructor(field: LoginErrorField, message: string) {
    super(message);
    this.name = "LoginApiError";
    this.field = field;
  }
}

function resolveLoginError(
  status: number,
  errorData: Record<string, unknown> | null,
): LoginApiError {
  const rawMessage =
    (typeof errorData?.message === "string" && errorData.message) ||
    (typeof errorData?.title === "string" && errorData.title) ||
    (typeof errorData?.error === "string" && errorData.error) ||
    "";

  const code = typeof errorData?.code === "string" ? errorData.code.toLowerCase() : "";

  // ── Ưu tiên 1: Phát hiện tài khoản bị khóa/vô hiệu hóa ──
  const isAccountLocked =
    /account_locked|account_disabled|account_banned/.test(code) ||
    /(khóa|khoa|bị khóa|bi khoa|locked|disabled|banned|vô hiệu|ngưng hoạt động|suspended)/i.test(
      rawMessage,
    );

  if (isAccountLocked) {
    // Trả về nguyên văn thông báo từ Backend, không ghi đè
    return new LoginApiError(
      "email",
      rawMessage || "Tài khoản quản trị của bạn đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ!",
    );
  }

  // ── Ưu tiên 2: Không tìm thấy tài khoản ──
  const isAccountNotFound =
    status === 404 ||
    /user_not_found|account_not_found|email_not_found/.test(code) ||
    /email.*(không tồn tại|not found|chưa đăng ký)|tài khoản.*(không tồn tại|không đúng|sai|not found)|không tìm thấy.*(tài khoản|người dùng|email|user)|user.*not found|account.*not found|chưa có tài khoản|sai tài khoản/i.test(
      rawMessage,
    );

  if (isAccountNotFound) {
    return new LoginApiError("email", "Sai tài khoản");
  }

  // ── Ưu tiên 3: Sai mật khẩu ──
  const isWrongPassword =
    /wrong_password|invalid_password|incorrect_password/.test(code) ||
    /(mật khẩu|mat khau|password).*(sai|không đúng|incorrect|invalid|wrong|chính xác)/i.test(
      rawMessage,
    ) ||
    /(sai|wrong|incorrect|invalid).*(mật khẩu|mat khau|password)/i.test(rawMessage);

  if (isWrongPassword) {
    return new LoginApiError("password", "Mật khẩu không đúng");
  }
  if (status === 401) {
    return new LoginApiError("password", "Mật khẩu không đúng");
  }

  // ── Ưu tiên 4: Lỗi chung theo status code ──
  if (status === 403) {
    // 403 mà không khớp locked → trả nguyên văn message từ Backend
    return new LoginApiError("email", rawMessage || "Bạn không có quyền truy cập!");
  }
  if (status === 400 && /email|tài khoản|account|user|người dùng/i.test(rawMessage.toLowerCase())) {
    return new LoginApiError("email", "Sai tài khoản");
  }
  if (status === 400) {
    return new LoginApiError("password", rawMessage || "Tài khoản hoặc mật khẩu không chính xác!");
  }

  throw new Error(rawMessage || `Lỗi đăng nhập: ${status}`);
}

export interface AuthResponse {
  token: string;
  user: {
    maNguoiDung: number;
    email: string;
    hoTen: string;
    soDienThoai?: string;
    diaChi?: string;
  };
  message?: string;
}

/** Đăng ký tài khoản: POST /api/auth/register */
export async function registerApi(data: RegisterRequest): Promise<AuthResponse> {
  const url = `${API_BASE_URL}/api/auth/register`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const message = errorData?.message || errorData?.title || `Lỗi đăng ký: ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

/** Đăng nhập: POST /api/auth/login */
export async function loginApi(data: LoginRequest): Promise<AuthResponse> {
  const url = `${API_BASE_URL}/api/auth/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    throw resolveLoginError(res.status, errorData);
  }
  return res.json();
}

export interface GoogleLoginRequest {
  email: string;
  name?: string;
}

/** Đăng nhập Google: POST /api/auth/googlelogin */
export async function googleLoginApi(data: GoogleLoginRequest): Promise<AuthResponse> {
  const url = `${API_BASE_URL}/api/auth/googlelogin`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    const message = (typeof errorData?.message === "string" && errorData.message) || `Lỗi đăng nhập Google: ${res.status}`;
    throw new Error(message);
  }
  return res.json();
}

/* ───────────────────────────────────────────────
   ORDER APIs — Đơn hàng của tôi
   ─────────────────────────────────────────────── */

export interface MyOrderItem {
  maChiTiet?: number;
  maSanPham?: number;
  maPhuKien?: number;
  tenSanPham?: string;
  tenPhuKien?: string;
  name?: string;
  soLuong: number;
  donGia: number;
  anhDaiDien?: string | null;
}

export interface MyOrder {
  maDonHang: number;
  ngayDat: string;
  tongTien: number;
  trangThai: string;
  diaChiGiaoHang?: string;
  phuongThucThanhToan?: string;
  chiTietDonHangs?: MyOrderItem[];
  chiTiet?: MyOrderItem[];
  items?: MyOrderItem[];
  listChiTietDonHang?: MyOrderItem[];
}

/** Lấy chi tiết 1 đơn hàng theo ID */
export async function fetchSingleOrderApi(maDonHang: number, token?: string): Promise<MyOrder | null> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : getAuthHeaders()),
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/DonHang/${maDonHang}`, { headers });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) { }
  return null;
}

/** Lấy danh sách đơn hàng của user hiện tại với nhiều endpoint dự phòng */
export async function fetchMyOrders(token?: string, userId?: number | string): Promise<MyOrder[]> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : getAuthHeaders()),
  };

  // Endpoint 1: GET /api/DonHang/cua-toi
  try {
    const res = await fetch(`${API_BASE_URL}/api/DonHang/cua-toi`, { headers });
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.$values ?? data?.donHangs ?? data?.items ?? []);
      return list;
    }
  } catch (e) { }

  // Endpoint 2: GET /api/DonHang/nguoi-dung/{userId}
  if (userId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/DonHang/nguoi-dung/${userId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.$values ?? data?.donHangs ?? []);
        return list;
      }
    } catch (e) { }

    // Endpoint 3: GET /api/DonHang/user/{userId}
    try {
      const res = await fetch(`${API_BASE_URL}/api/DonHang/user/${userId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.$values ?? []);
        return list;
      }
    } catch (e) { }
  }

  // Endpoint 4: GET /api/DonHang (lấy tất cả và tự filter theo maNguoiDung)
  try {
    const res = await fetch(`${API_BASE_URL}/api/DonHang`, { headers });
    if (res.ok) {
      const data = await res.json();
      const rawList = Array.isArray(data) ? data : (data?.$values ?? []);
      if (userId) {
        return rawList.filter((item: any) => String(item.maNguoiDung) === String(userId));
      }
      return rawList;
    }
  } catch (e) { }

  // Mặc định trả về mảng rỗng [] nếu chưa có đơn hàng nào
  return [];
}

export interface UserProfileResponse {
  maNguoiDung: number;
  email: string;
  hoTen: string;
  matKhau?: string;
  soDienThoai?: string;
  so_dien_thoai?: string;
  diaChi?: string;
  dia_chi?: string;
  anhDaiDien?: string;
  vaiTro?: string;
  trangThai?: string;
  ngayTao?: string;
}

/** Payload PUT /api/NguoiDung/{id} — khớp entity NguoiDung (.NET camelCase JSON) */
export interface UpdateProfileRequest {
  maNguoiDung: number;
  hoTen: string;
  email: string;
  matKhau?: string;
  soDienThoai?: string | null;
  diaChi?: string | null;
  anhDaiDien?: string | null;
  vaiTro?: string | null;
  trangThai?: string | null;
  ngayTao?: string | null;
}

export interface ChangePasswordRequest {
  matKhauCu: string;
  matKhauMoi: string;
}

/** Lấy thông tin chi tiết người dùng với các endpoint dự phòng */
export async function fetchUserProfile(
  id: number | string,
  token: string,
): Promise<UserProfileResponse> {
  // Thử endpoint chính thức từ Swagger: /api/NguoiDung/{id}
  try {
    const res = await fetch(`${API_BASE_URL}/api/NguoiDung/${id}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("Lỗi gọi /api/NguoiDung/{id}, thử các endpoint dự phòng khác...", e);
  }

  // Thử endpoint dự phòng 1: /api/account
  try {
    const res = await fetch(`${API_BASE_URL}/api/account`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) { }

  // Thử endpoint dự phòng 2: /api/user/profile
  try {
    const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) { }

  throw new Error("Không thể tải thông tin hồ sơ cá nhân.");
}

/** Cập nhật thông tin cá nhân: PUT /api/NguoiDung/{id} */
export async function updateUserProfileApi(
  id: number | string,
  token: string,
  data: UpdateProfileRequest,
): Promise<void> {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  // 1. Lấy thông tin hiện tại của người dùng từ backend để bảo toàn các trường quan trọng (matKhau, vaiTro, trangThai, ngayTao)
  let existingUser: any = null;
  try {
    const getRes = await fetch(`${API_BASE_URL}/api/NguoiDung/${id}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    if (getRes.ok) {
      existingUser = await getRes.json();
    }
  } catch (err) {
    console.warn("Không thể lấy thông tin chi tiết người dùng trước khi cập nhật:", err);
  }

  // 2. Tạo payload đầy đủ khớp với Entity NguoiDung trong .NET Core / MySQL
  const payload: Record<string, any> = {
    ...(existingUser || {}),
    maNguoiDung: Number(id),
    hoTen: data.hoTen,
    email: data.email,
    soDienThoai: data.soDienThoai !== undefined ? data.soDienThoai : (existingUser?.soDienThoai ?? existingUser?.so_dien_thoai ?? null),
    diaChi: data.diaChi !== undefined ? data.diaChi : (existingUser?.diaChi ?? existingUser?.dia_chi ?? null),
    anhDaiDien: data.anhDaiDien !== undefined ? data.anhDaiDien : (existingUser?.anhDaiDien ?? null),
    vaiTro: existingUser?.vaiTro ?? existingUser?.vai_tro ?? existingUser?.VaiTro ?? data.vaiTro ?? "KhachHang",
    trangThai: existingUser?.trangThai ?? existingUser?.trang_thai ?? existingUser?.TrangThai ?? data.trangThai ?? "hoat_dong",
  };

  // Nếu có cập nhật mật khẩu mới và không phải placeholder
  if (data.matKhau && data.matKhau !== "Placeholder123") {
    payload.matKhau = data.matKhau;
  } else if (existingUser && (existingUser.matKhau || existingUser.mat_khau)) {
    payload.matKhau = existingUser.matKhau || existingUser.mat_khau;
  } else if (!payload.matKhau) {
    payload.matKhau = "GoogleOAuth_Account";
  }

  // Chuẩn hóa ngày tạo nếu có
  const rawNgayTao = payload.ngayTao ?? payload.ngay_tao ?? payload.NgayTao;
  if (rawNgayTao) {
    try {
      payload.ngayTao = new Date(rawNgayTao).toISOString();
    } catch { }
  }

  // Endpoint 1: PUT /api/NguoiDung/{id}
  let lastErrorMsg = "";
  try {
    const res = await fetch(`${API_BASE_URL}/api/NguoiDung/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    if (res.ok || res.status === 204) return;
    const errData = await res.json().catch(() => null);
    lastErrorMsg = errData?.message || errData?.title || `HTTP ${res.status}`;
  } catch (e: any) {
    lastErrorMsg = e.message || "Lỗi kết nối mạng";
  }

  // Endpoint 2: POST /api/Auth/update-profile
  try {
    const res = await fetch(`${API_BASE_URL}/api/Auth/update-profile`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (res.ok || res.status === 204) return;
  } catch (e) { }

  // Endpoint 3: PUT /api/user/profile
  try {
    const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    });
    if (res.ok || res.status === 204) return;
  } catch (e) { }

  throw new Error(`Cập nhật cơ sở dữ liệu thất bại: ${lastErrorMsg || "Vui lòng kiểm tra kết nối Backend."}`);
}

/** Đổi mật khẩu: POST /api/auth/doi-mat-khau với các endpoint dự phòng */
export async function changePasswordApi(token: string, data: ChangePasswordRequest): Promise<void> {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  // Endpoint 1: POST /api/auth/doi-mat-khau
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/doi-mat-khau`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (res.ok || res.status === 204) return;
  } catch (e) { }

  // Endpoint 2: POST /api/Auth/change-password
  try {
    const res = await fetch(`${API_BASE_URL}/api/Auth/change-password`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (res.ok || res.status === 204) return;
  } catch (e) { }
}

/* ═══════════════════════════════════════════════════════════════════════
   ADMIN APIs — Quản trị hệ thống (Dashboard, Sản phẩm, Đơn hàng, Khách hàng)
   Sử dụng Axios với interceptor tự động đính kèm Bearer Token.
   ═══════════════════════════════════════════════════════════════════════ */

import axios from "axios";

/**
 * Axios instance dành riêng cho Admin API.
 * Tự động đính kèm header `Authorization: Bearer <token>` từ Zustand auth store.
 */
export const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor: Tự động gắn token vào mỗi request
adminApi.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Xử lý lỗi 401 (token hết hạn) — tự động logout
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuth.getState().logout();
    }
    return Promise.reject(error);
  },
);

/* ───────────────────────────────────────────────
   1. DASHBOARD — Thống kê tổng quan
   ─────────────────────────────────────────────── */

export interface AdminDashboardStats {
  tongDoanhThu: number;
  tongDonHang: number;
  tongKhachHang: number;
  tongSanPham: number;
  donHangMoi: number;
  doanhThuHomNay: number;
  bieuDoDoanhThu: {
    nhan: string; // Label (ngày/tháng)
    giaTri: number; // Giá trị doanh thu
  }[];
  donHangTheoTrangThai: {
    trangThai: string;
    soLuong: number;
  }[];
  revenueGrowth?: number | string;
  orderGrowth?: number | string;
  userGrowth?: number | string;
  canhBaoSapHetHang?: number;
  sapHetHang?: number;
  soLuongSapHetHang?: number;
  bieuDoThuongHieu?: {
    nhan: string;
    giaTri: number;
  }[];
  thuongHieuBanChay?: {
    name: string;
    value: number;
  }[];
  donHangGanDay?: any[];
}

/** Lấy thống kê dashboard admin: GET /api/admin/dashboard/stats */
export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const { data } = await adminApi.get<AdminDashboardStats>("/api/admin/dashboard/stats");
  return data;
}

/* ───────────────────────────────────────────────
   2. QUẢN LÝ SẢN PHẨM (Admin Products)
   ─────────────────────────────────────────────── */

export interface AdminProduct {
  maSanPham: number;
  tenSanPham: string;
  gia: number;
  soLuongTon: number;
  anhDaiDien: string | null;
  moTa: string | null;
  cpu: string | null;
  ram: string | null;
  oCung: string | null;
  cardDoHoa: string | null;
  manHinh: string | null;
  pin: string | null;
  heDieuHanh: string | null;
  maThuongHieu: string | number | null;
  maDanhMuc: number | null;
  thuongHieu?: {
    maThuongHieu: string | number;
    tenThuongHieu: string;
    logo?: string | null;
  } | null;
  danhMuc?: { maDanhMuc: number; tenDanhMuc: string } | null;
  ngayTao?: string | null;
  soLuongDanhGia?: number;
  diemDanhGiaTrungBinh?: number;
  hinhAnhSanPhams?: Array<{ maHinhAnh: number; maSanPham: number; duongDanAnh: string }> | null;
  albumAnh?: string[] | null;
  maKhuyenMai?: number | null;
}

export interface AdminProductCreateRequest {
  tenSanPham: string;
  gia: number;
  soLuongTon: number;
  anhDaiDien?: string | null;
  moTa?: string | null;
  cpu?: string | null;
  ram?: string | null;
  oCung?: string | null;
  cardDoHoa?: string | null;
  manHinh?: string | null;
  pin?: string | null;
  heDieuHanh?: string | null;
  maThuongHieu?: string | number | null;
  maDanhMuc?: number | null;
  hinhAnhSanPhams?: Array<{ maHinhAnh?: number; maSanPham?: number; duongDanAnh: string }> | null;
  maKhuyenMai?: number | null;
}

export type AdminProductUpdateRequest = AdminProductCreateRequest;

/** Lấy danh sách sản phẩm (admin): GET /api/SanPham */
export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  const { data } = await adminApi.get<AdminProduct[]>("/api/SanPham");
  return Array.isArray(data) ? data : [];
}

/** Lấy chi tiết sản phẩm (admin): GET /api/SanPham/{id} */
export async function fetchAdminProductById(id: number | string): Promise<AdminProduct> {
  const { data } = await adminApi.get<AdminProduct>(`/api/SanPham/${id}`);
  return data;
}

/** Thêm sản phẩm mới: POST /api/SanPham */
export async function createAdminProduct(
  product: AdminProductCreateRequest,
): Promise<AdminProduct> {
  const cleanImages = (product.hinhAnhSanPhams || [])
    .filter((img) => img && img.duongDanAnh && img.duongDanAnh.trim() !== "");
  const payload = {
    ...product,
    hinhAnhSanPhams: cleanImages,
  };
  const { data } = await adminApi.post<AdminProduct>("/api/SanPham", payload);
  return data;
}

/** Cập nhật sản phẩm: PUT /api/SanPham/{id} */
export async function updateAdminProduct(
  id: number | string,
  product: AdminProductUpdateRequest,
): Promise<AdminProduct> {
  const numId = Number(id);
  const cleanImages = (product.hinhAnhSanPhams || [])
    .filter((img) => img && img.duongDanAnh && img.duongDanAnh.trim() !== "");
  const payload = {
    ...product,
    maSanPham: numId,
    MaSanPham: numId,
    hinhAnhSanPhams: cleanImages,
  };
  const { data } = await adminApi.put<AdminProduct>(`/api/SanPham/${id}`, payload);
  return data;
}

export interface AdminPhuKienCreateRequest {
  tenPhuKien: string;
  gia: number;
  soLuongTon: number;
  anhDaiDien?: string | null;
  moTa?: string | null;
  loaiPhuKien: string;
  thuongHieu?: string | null;
  ketNoi?: string | null;
  denLed?: string | null;
  doPhanGiai?: string | null;
  doDaiDay?: string | null;
  loaiBanPhim?: string | null;
  soPhim?: number | null;
  kichThuoc?: string | null;
  trongLuong?: string | null;
  congNgheAmThanh?: string | null;
  micro?: string | null;
  thoiLuongPin?: string | null;
  phienBanQuat?: string | null;
  congSuat?: string | null;
  dienApDauVao?: string | null;
  dienApDauRa?: string | null;
  baoHanh?: string | null;
  hinhAnhPhu?: string[] | null;
  maKhuyenMai?: number | null;
}

export type AdminPhuKienUpdateRequest = AdminPhuKienCreateRequest;

/** Lấy danh sách phụ kiện: GET /api/PhuKien */
export async function fetchAdminPhuKiens(): Promise<any[]> {
  const { data } = await adminApi.get<any[]>("/api/PhuKien");
  return Array.isArray(data) ? data : [];
}

/** Thêm phụ kiện mới: POST /api/PhuKien */
export async function createAdminPhuKien(phuKien: AdminPhuKienCreateRequest): Promise<any> {
  const { data } = await adminApi.post("/api/PhuKien", phuKien);
  return data;
}

/** Cập nhật phụ kiện: PUT /api/PhuKien/{id} */
export async function updateAdminPhuKien(
  id: number | string,
  phuKien: AdminPhuKienUpdateRequest,
): Promise<any> {
  const numId = Number(id);
  const payload = {
    ...phuKien,
    maPhuKien: numId,
    MaPhuKien: numId,
  };
  const { data } = await adminApi.put(`/api/PhuKien/${id}`, payload);
  return data;
}

/** Lấy chi tiết đầy đủ sản phẩm (gồm laptop hoặc phụ kiện): GET /api/products/detail/{id} hoặc GET /api/PhuKien/{id} */
export async function fetchProductDetail(id: number | string, isAccessory?: boolean): Promise<any> {
  const numericId = String(id).replace(/\D+/g, "");
  const targetId = numericId || id;
  if (isAccessory) {
    // Phụ kiện: dùng public API để không cần auth
    const res = await fetch(`${API_BASE_URL}/api/PhuKien/${targetId}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = await res.json();
    if (data) {
      data.thuongHieuPhuKien = data.thuongHieu;
    }
    return data;
  }
  // Laptop: dùng public API /api/SanPham/{id} để lấy moTa
  const res = await fetch(`${API_BASE_URL}/api/SanPham/${targetId}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/** Xóa phụ kiện: DELETE /api/PhuKien/{id} */
export async function deleteAdminPhuKien(id: number | string): Promise<void> {
  await adminApi.delete(`/api/PhuKien/${id}`);
}

/** Xóa sản phẩm: DELETE /api/SanPham/{id} */
export async function deleteAdminProduct(id: number | string): Promise<void> {
  await adminApi.delete(`/api/SanPham/${id}`);
}

/* ───────────────────────────────────────────────
   3. QUẢN LÝ ĐƠN HÀNG (Admin Orders)
   ─────────────────────────────────────────────── */

export interface AdminOrder {
  maDonHang: number;
  ngayDat: string;
  tongTien: number;
  trangThai: string;
  diaChiGiaoHang: string | null;
  phuongThucThanhToan: string | null;
  hoTen: string | null;
  email: string | null;
  soDienThoai: string | null;
  maNguoiDung: number | null;
  chiTietDonHangs?: {
    maChiTiet: number;
    maSanPham: number;
    tenSanPham: string;
    soLuong: number;
    donGia: number;
    anhDaiDien?: string | null;
  }[];
}

export interface AdminUpdateOrderStatusRequest {
  trangThai: string;
}

/** Lấy danh sách đơn hàng (admin): GET /api/admin/orders */
export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  const { data } = await adminApi.get<AdminOrder[]>("/api/admin/orders");
  return Array.isArray(data) ? data : [];
}

/** Lấy chi tiết đơn hàng (admin): GET /api/admin/orders/{id} */
export async function fetchAdminOrderById(id: number | string): Promise<AdminOrder> {
  const { data } = await adminApi.get<AdminOrder>(`/api/admin/orders/${id}`);
  return data;
}

/** Cập nhật trạng thái đơn hàng: PUT /api/admin/orders/{id}/status với endpoint dự phòng */
export async function updateAdminOrderStatus(
  id: number | string,
  status: AdminUpdateOrderStatusRequest,
): Promise<void> {
  let normalizedStatus = status.trangThai;
  if (normalizedStatus === "cho_xac_nhan") normalizedStatus = "cho_xu_ly";
  if (normalizedStatus === "dang_giao") normalizedStatus = "dang_giao_hang";

  try {
    await adminApi.put(`/api/admin/orders/${id}/status`, { ...status, trangThai: normalizedStatus });
    return;
  } catch (err: any) {
    // Thử endpoint dự phòng 1: PUT /api/DonHang/{id}/status
    try {
      await adminApi.put(`/api/DonHang/${id}/status`, { ...status, trangThai: normalizedStatus });
      return;
    } catch { }

    // Thử endpoint dự phòng 2: PUT /api/DonHang/{id}
    try {
      await adminApi.put(`/api/DonHang/${id}`, { maDonHang: Number(id), trangThai: normalizedStatus });
      return;
    } catch { }

    throw err;
  }
}

/** Xóa đơn hàng (admin): DELETE /api/admin/orders/{id} */
export async function deleteAdminOrder(id: number | string): Promise<void> {
  await adminApi.delete(`/api/admin/orders/${id}`);
}

/* ───────────────────────────────────────────────
   4. QUẢN LÝ KHÁCH HÀNG (Admin Customers)
   ─────────────────────────────────────────────── */

export interface AdminCustomer {
  maNguoiDung: number;
  hoTen: string;
  email: string;
  soDienThoai: string | null;
  diaChi: string | null;
  anhDaiDien: string | null;
  vaiTro: string | null;
  trangThai: string | null;
  ngayTao: string | null;
  tongDonHang?: number;
  tongChiTieu?: number;
}

/** Mapper ánh xạ chính xác các trường MySQL (hỗ trợ camelCase, PascalCase, snake_case) sang AdminCustomer */
export function mapUserToAdminCustomer(c: any): AdminCustomer {
  if (!c) return {} as AdminCustomer;
  return {
    maNguoiDung: c.maNguoiDung ?? c.ma_nguoi_dung ?? c.id ?? c.MaNguoiDung ?? 0,
    hoTen: c.hoTen ?? c.ho_ten ?? c.HoTen ?? c.name ?? "Chưa đặt tên",
    email: c.email ?? c.Email ?? "",
    soDienThoai: c.soDienThoai ?? c.so_dien_thoai ?? c.SoDienThoai ?? c.phone ?? null,
    diaChi: c.diaChi ?? c.dia_chi ?? c.DiaChi ?? c.address ?? null,
    anhDaiDien: c.anhDaiDien ?? c.anh_dai_dien ?? c.AnhDaiDien ?? c.avatar ?? null,
    vaiTro: c.vaiTro ?? c.vai_tro ?? c.VaiTro ?? c.role ?? null,
    trangThai: c.trangThai ?? c.trang_thai ?? c.TrangThai ?? c.status ?? null,
    ngayTao: c.ngayTao ?? c.ngay_tao ?? c.NgayTao ?? c.createdAt ?? null,
    tongDonHang: c.tongDonHang ?? c.tong_don_hang ?? c.TongDonHang ?? undefined,
    tongChiTieu: c.tongChiTieu ?? c.tong_chi_tieu ?? c.TongChiTieu ?? undefined,
  };
}

/** Lấy danh sách khách hàng (admin): GET /api/NguoiDung */
export async function fetchAdminCustomers(): Promise<AdminCustomer[]> {
  const { data } = await adminApi.get<any[]>("/api/NguoiDung");
  return Array.isArray(data) ? data.map(mapUserToAdminCustomer) : [];
}

/** Lấy chi tiết khách hàng (admin): GET /api/NguoiDung/{id} */
export async function fetchAdminCustomerById(id: number | string): Promise<AdminCustomer> {
  const { data } = await adminApi.get<any>(`/api/NguoiDung/${id}`);
  return mapUserToAdminCustomer(data);
}

/** Thêm khách hàng mới (admin): POST /api/NguoiDung */
export async function createAdminCustomer(user: any): Promise<any> {
  const { data } = await adminApi.post<any>("/api/NguoiDung", user);
  return data;
}

/** Khóa/Mở khóa khách hàng: GET /api/NguoiDung/{id} -> Đảo trạng thái -> PUT /api/NguoiDung/{id} */
export async function toggleBlockAdminCustomer(
  id: number | string,
): Promise<{ trangThai: string; message: string }> {
  try {
    // 1. Lấy thông tin hiện tại của người dùng
    const { data: user } = await adminApi.get<any>(`/api/NguoiDung/${id}`);

    // 2. Xác định trạng thái hiện tại (hỗ trợ nhiều định dạng từ MySQL)
    const currentStatus = user.trangThai ?? user.trang_thai ?? user.TrangThai ?? "";
    const isCurrentlyActive =
      currentStatus === "hoat_dong" ||
      currentStatus === "Hoạt động" ||
      currentStatus.toLowerCase() === "active";

    // 3. Đảo trạng thái (Sử dụng đúng giá trị 'khoa' khớp với ENUM trong MySQL)
    const newStatus = isCurrentlyActive ? "khoa" : "hoat_dong";

    // 4. Cập nhật trạng thái trực tiếp trong object (giữ nguyên cấu trúc MySQL)
    if ("trangThai" in user) user.trangThai = newStatus;
    if ("trang_thai" in user) user.trang_thai = newStatus;
    if ("TrangThai" in user) user.TrangThai = newStatus;
    user.trangThai = newStatus; // Gán dự phòng camelCase

    // 5. Chuẩn hóa ngày tạo sang dạng ISO nếu có
    const rawNgayTao = user.ngayTao ?? user.ngay_tao ?? user.NgayTao;
    if (rawNgayTao) {
      try {
        const isoDate = new Date(rawNgayTao).toISOString();
        if ("ngayTao" in user) user.ngayTao = isoDate;
        if ("ngay_tao" in user) user.ngay_tao = isoDate;
        if ("NgayTao" in user) user.NgayTao = isoDate;
        user.ngayTao = isoDate; // Gán dự phòng camelCase
      } catch (e) {
        console.warn("Lỗi định dạng ngayTao sang ISO string:", e);
      }
    }

    // 6. Gửi toàn bộ đối tượng đầy đủ này lên Backend (giữ nguyên mật khẩu gốc nhận được từ GET)
    await adminApi.put(`/api/NguoiDung/${id}`, user);

    return {
      trangThai: newStatus,
      message: isCurrentlyActive
        ? "Đã khóa tài khoản thành công!"
        : "Đã mở khóa tài khoản thành công!",
    };
  } catch (error: any) {
    // In ra chi tiết lỗi để chẩn đoán chính xác nguyên nhân nếu backend từ chối cập nhật
    console.error("Lỗi cập nhật trạng thái khách hàng:", error);
    if (error.response?.data) {
      console.error("Chi tiết lỗi phản hồi từ Backend .NET Core:", error.response.data);
    }
    throw error;
  }
}

/* ───────────────────────────────────────────────
   5. QUẢN LÝ KHUYẾN MÃI (Admin Promotions)
   ─────────────────────────────────────────────── */

export interface AdminPromotion {
  id?: number | string;
  maGiamGia?: string;
  code?: string;
  loaiGiamGia?: string; // "Phần trăm" hoặc "Tiền mặt" / "percentage" hoặc "fixed"
  type?: string;
  giaTriGiam?: number | null;
  discount?: number | null;
  ngayBatDau?: string | null;
  ngayHetHan?: string | null;
  ngayKetThuc?: string | null;
  expireDate?: string | null;
  trangThai?: string;
  status?: string;
}

/** Helper: Chuyển đổi Date sang định dạng ISO giờ địa phương (YYYY-MM-DDTHH:mm:ss) */
export function toLocalIso(d?: Date | string | null): string {
  const date = d ? (typeof d === "string" ? new Date(d) : d) : new Date();
  if (isNaN(date.getTime())) return new Date().toISOString().slice(0, 19);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const sec = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${sec}`;
}

/** Thêm khuyến mãi mới: POST /api/KhuyenMai hoặc POST /api/admin/promotions */
export async function createAdminPromotion(
  promo: any,
): Promise<AdminPromotion> {
  const codeClean = (promo.code || promo.maGiamGia || promo.tenKhuyenMai || "KM")
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  const discountVal = Number(promo.phanTramGiam ?? promo.giaTriGiam ?? promo.discount) || 10;

  const startDateStr = toLocalIso(promo.ngayBatDau);
  const endDateStr = toLocalIso(promo.ngayKetThuc || new Date(Date.now() + 86400000));

  const payload = {
    // CamelCase (chuẩn JS/JSON)
    code: codeClean,
    maGiamGia: codeClean,
    tenKhuyenMai: `Khuyến mãi ${codeClean}`,
    name: `Khuyến mãi ${codeClean}`,
    loaiGiamGia: "Phần trăm",
    type: "percentage",
    giaTriGiam: discountVal,
    discount: discountVal,
    phanTramGiam: discountVal,
    ngayBatDau: startDateStr,
    ngayKetThuc: endDateStr,
    ngayHetHan: endDateStr,
    trangThai: "hoat_dong",
    status: "hoat_dong",

    // PascalCase (chuẩn C# EF Core / ASP.NET Controller)
    Code: codeClean,
    MaGiamGia: codeClean,
    TenKhuyenMai: `Khuyến mãi ${codeClean}`,
    LoaiGiamGia: "Phần trăm",
    Type: "percentage",
    PhanTramGiam: discountVal,
    GiaTriGiam: discountVal,
    Discount: discountVal,
    NgayBatDau: startDateStr,
    NgayKetThuc: endDateStr,
    NgayHetHan: endDateStr,
    TrangThai: "hoat_dong",
    Status: "hoat_dong",
  };

  // Try POST /api/KhuyenMai first
  try {
    const { data } = await adminApi.post<any>("/api/KhuyenMai", payload);
    return data;
  } catch (err1: any) {
    console.warn("POST /api/KhuyenMai thất bại, thử POST /api/admin/promotions:", err1?.response?.data || err1?.message);
    try {
      const { data } = await adminApi.post<AdminPromotion>("/api/admin/promotions", payload);
      return data;
    } catch (err2: any) {
      console.error("Cả 2 API tạo khuyến mãi đều thất bại:", err2?.response?.data || err2?.message);
      throw err2;
    }
  }
}

/** Lấy danh sách khuyến mãi: GET /api/admin/promotions hoặc GET /api/KhuyenMai */
export async function fetchAdminPromotions(): Promise<AdminPromotion[]> {
  try {
    const { data } = await adminApi.get<AdminPromotion[]>("/api/admin/promotions");
    if (Array.isArray(data) && data.length > 0) return data;
  } catch (err) {
    console.warn("Lỗi khi tải từ /api/admin/promotions, thử fallback sang /api/KhuyenMai:", err);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/KhuyenMai`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data: any[] = await res.json();
      if (Array.isArray(data)) {
        return data.map((p) => ({
          id: p.maKhuyenMai,
          maGiamGia: p.tenKhuyenMai,
          code: p.tenKhuyenMai,
          loaiGiamGia: "Phần trăm",
          type: "percentage",
          giaTriGiam: p.phanTramGiam,
          discount: p.phanTramGiam,
          ngayBatDau: p.ngayBatDau,
          ngayKetThuc: p.ngayKetThuc,
          ngayHetHan: p.ngayKetThuc,
          expireDate: p.ngayKetThuc,
          trangThai: p.trangThai,
          status: p.trangThai,
        }));
      }
    }
  } catch (err2) {
    console.warn("Lỗi khi fallback tải khuyến mãi từ /api/KhuyenMai:", err2);
  }

  return [];
}

/** Xóa khuyến mãi: DELETE /api/admin/promotions/{id} hoặc DELETE /api/KhuyenMai/{id} */
export async function deleteAdminPromotion(id: number | string): Promise<void> {
  try {
    await adminApi.delete(`/api/admin/promotions/${id}`);
  } catch {
    await fetch(`${API_BASE_URL}/api/KhuyenMai/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeaders() },
    });
  }
}

/** Cập nhật khuyến mãi: PUT /api/KhuyenMai/{id} hoặc PUT /api/admin/promotions/{id} */
export async function updateAdminPromotion(
  id: number | string,
  promo: any,
): Promise<AdminPromotion> {
  const numId = Number(id);
  const codeClean = (promo.code || promo.maGiamGia || promo.tenKhuyenMai || "KM")
    .toString()
    .trim();

  const discountVal = Number(promo.phanTramGiam ?? promo.giaTriGiam ?? promo.discount) || 10;

  const startDateIso = toLocalIso(promo.ngayBatDau);
  const endDateIso = toLocalIso(promo.ngayKetThuc || new Date(Date.now() + 86400000));

  const payload = {
    maKhuyenMai: numId,
    MaKhuyenMai: numId,
    code: codeClean,
    maGiamGia: codeClean,
    tenKhuyenMai: codeClean,
    TenKhuyenMai: codeClean,
    loaiGiamGia: promo.loaiGiamGia || "Phần trăm",
    type: promo.type || "percentage",
    giaTriGiam: discountVal,
    discount: discountVal,
    phanTramGiam: discountVal,
    PhanTramGiam: discountVal,
    ngayBatDau: startDateIso,
    NgayBatDau: startDateIso,
    ngayKetThuc: endDateIso,
    NgayKetThuc: endDateIso,
    ngayHetHan: endDateIso,
    trangThai: promo.trangThai || "hoat_dong",
    TrangThai: promo.trangThai || "hoat_dong",
    status: promo.trangThai || "hoat_dong",
  };

  try {
    const { data } = await adminApi.put<any>(`/api/admin/promotions/${id}`, payload);
    return data;
  } catch (err1: any) {
    try {
      const { data } = await adminApi.put<any>(`/api/KhuyenMai/${id}`, payload);
      return data;
    } catch (err2: any) {
      console.error("Cả 2 API cập nhật khuyến mãi đều thất bại:", err2);
      throw err2;
    }
  }
}

/** Lấy danh sách sản phẩm đang flash sale: GET /api/SanPham/flash-sale */
export interface FlashSaleAdminItem {
  id: number;
  ten: string;
  hinhAnh: string | null;
  giaGoc: number;
  giaKhuyenMai: number;
  phanTramGiam: number;
  loaiSanPham: string;
  ngayKetThuc: string | null;
}
export async function fetchAdminFlashSaleProducts(): Promise<FlashSaleAdminItem[]> {
  const { data } = await adminApi.get<FlashSaleAdminItem[]>("/api/SanPham/flash-sale");
  return Array.isArray(data) ? data : [];
}

/** Gán / gỡ flash sale cho sản phẩm: PUT /api/SanPham/{id} với maKhuyenMai */
export async function assignFlashSaleToProduct(
  productId: number,
  maKhuyenMai: number | null,
  currentProduct: AdminProductUpdateRequest,
): Promise<any> {
  const numId = Number(productId);
  const payload = {
    ...currentProduct,
    maSanPham: numId,
    MaSanPham: numId,
    maKhuyenMai,
    MaKhuyenMai: maKhuyenMai,
  };
  const { data } = await adminApi.put(`/api/SanPham/${productId}`, payload);
  return data;
}

/* ───────────────────────────────────────────────
   6. QUẢN LÝ THƯƠNG HIỆU & DANH MỤC (Brands & Categories)
   ─────────────────────────────────────────────── */

export interface ThuongHieuItem {
  maThuongHieu: string;
  tenThuongHieu: string;
  logo?: string | null;
  moTa?: string | null;
}

export interface DanhMucItem {
  maDanhMuc: number | string;
  tenDanhMuc: string;
  moTa?: string | null;
}

export function mapRawToThuongHieu(raw: any): ThuongHieuItem {
  return {
    maThuongHieu: String(raw?.maThuongHieu ?? raw?.MaThuongHieu ?? raw?.ma_thuong_hieu ?? ""),
    tenThuongHieu: String(raw?.tenThuongHieu ?? raw?.TenThuongHieu ?? raw?.ten_thuong_hieu ?? ""),
    logo: raw?.logo ?? raw?.Logo ?? raw?.logo_url ?? null,
    moTa: raw?.moTa ?? raw?.MoTa ?? raw?.mo_ta ?? null,
  };
}

export function mapRawToDanhMuc(raw: any): DanhMucItem {
  const rawId = raw?.maDanhMuc ?? raw?.MaDanhMuc ?? raw?.ma_danh_muc ?? 0;
  return {
    maDanhMuc: typeof rawId === "number" ? rawId : String(rawId),
    tenDanhMuc: String(raw?.tenDanhMuc ?? raw?.TenDanhMuc ?? raw?.ten_danh_muc ?? ""),
    moTa: raw?.moTa ?? raw?.MoTa ?? raw?.mo_ta ?? null,
  };
}

/** Lấy danh sách thương hiệu: GET /api/ThuongHieu */
export async function fetchThuongHieu(): Promise<ThuongHieuItem[]> {
  const { data } = await adminApi.get<any>("/api/ThuongHieu");
  const rawList = Array.isArray(data) ? data : (data?.$values ?? []);
  return rawList.map(mapRawToThuongHieu);
}

/** Lấy danh sách danh mục sản phẩm: GET /api/DanhMuc */
export async function fetchDanhMuc(): Promise<DanhMucItem[]> {
  const { data } = await adminApi.get<any>("/api/DanhMuc");
  const rawList = Array.isArray(data) ? data : (data?.$values ?? []);
  return rawList.map(mapRawToDanhMuc);
}

/** Thêm danh mục mới: POST /api/DanhMuc */
export async function createCategoryApi(payload: { tenDanhMuc: string; moTa?: string }): Promise<DanhMucItem> {
  const { data } = await adminApi.post<any>("/api/DanhMuc", payload);
  return mapRawToDanhMuc(data);
}

/** Cập nhật danh mục: PUT /api/DanhMuc/{id} */
export async function updateCategoryApi(id: number | string, payload: { tenDanhMuc: string; moTa?: string }): Promise<void> {
  await adminApi.put(`/api/DanhMuc/${id}`, payload);
}

/** Xóa danh mục: DELETE /api/DanhMuc/{id} */
export async function deleteCategoryApi(id: number | string): Promise<void> {
  await adminApi.delete(`/api/DanhMuc/${id}`);
}

export interface ApiKhuyenMai {
  maKhuyenMai: number;
  tenKhuyenMai: string;
  phanTramGiam?: number | null;
  ngayBatDau?: string | null;
  ngayHetHan?: string | null; // mappings
  ngayKetThuc?: string | null;
  trangThai?: string | null;
}

export async function fetchKhuyenMais(): Promise<ApiKhuyenMai[]> {
  const { data } = await adminApi.get<ApiKhuyenMai[]>("/api/KhuyenMai");
  return Array.isArray(data) ? data : [];
}

/** Lấy danh sách tất cả các loại phụ kiện duy nhất từ DB: GET /api/PhuKien/types */
export async function fetchAccessoryTypes(): Promise<string[]> {
  const { data } = await adminApi.get<string[]>("/api/PhuKien/types");
  return Array.isArray(data) ? data : [];
}

export interface AdminReview {
  maDanhGia: number;
  soSao: number;
  noiDung: string;
  ngayDanhGia: string;
  trangThai: string;
  phanHoiCuaAdmin: string | null;
  maNguoiDung: number;
  hoTenNguoiDung: string;
  emailNguoiDung: string;
  anhDaiDienNguoiDung: string | null;
  maSanPham?: number | null;
  tenSanPham?: string | null;
  maPhuKien?: number | null;
  tenPhuKien?: string | null;
  tenItem?: string | null;
}

/** Lấy tất cả đánh giá cho admin: GET /api/DanhGia/admin */
export async function fetchAdminReviews(): Promise<AdminReview[]> {
  const { data } = await adminApi.get<AdminReview[]>("/api/DanhGia/admin");
  return Array.isArray(data) ? data : [];
}

/** Cập nhật đánh giá (admin): PUT /api/DanhGia/admin/{id} */
export async function updateAdminReview(
  id: number,
  payload: { trangThai?: string; phanHoiCuaAdmin?: string | null },
): Promise<any> {
  const { data } = await adminApi.put(`/api/DanhGia/admin/${id}`, payload);
  return data;
}

/** Xóa đánh giá vĩnh viễn (admin): DELETE /api/DanhGia/admin/{id} */
export async function deleteAdminReview(id: number): Promise<any> {
  const { data } = await adminApi.delete(`/api/DanhGia/admin/${id}`);
  return data;
}

/* ───────────────────────────────────────────────
   7. THANH TOÁN (VietQR)
   ─────────────────────────────────────────────── */

export interface VietQRInfoResponse {
  maDonHang: number;
  tongTien: number;
  bankId: string;
  accountNo: string;
  accountName: string;
  noiDung: string;
  qrUrl: string;
  trangThai: string;
}

/** Lấy thông tin VietQR ngân hàng cho đơn hàng */
export async function getVietQRInfoApi(maDonHang: number): Promise<VietQRInfoResponse> {
  const res = await fetch(`${API_BASE_URL}/api/ThanhToan/vietqr/${maDonHang}`, {
    headers: { Accept: "application/json", ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Lỗi khi lấy mã VietQR: ${res.status}`);
  return res.json();
}

/** Kiểm tra trạng thái đơn hàng / thanh toán */
export async function getPaymentStatusApi(maDonHang: number): Promise<{ maDonHang: number; trangThai: string; isPaid: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/ThanhToan/trang-thai/${maDonHang}`, {
    headers: { Accept: "application/json", ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Lỗi kiểm tra trạng thái thanh toán: ${res.status}`);
  return res.json();
}

/** Xác nhận đã thanh toán thành công */
export async function confirmPaymentApi(maDonHang: number): Promise<{ success: boolean; message: string; maDonHang: number }> {
  const res = await fetch(`${API_BASE_URL}/api/ThanhToan/xac-nhan-thanh-toan/${maDonHang}`, {
    method: "POST",
    headers: { Accept: "application/json", ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error(`Lỗi xác nhận thanh toán: ${res.status}`);
  return res.json();
}

/** Tải file ảnh sản phẩm lên thư mục backend / upload */
export async function uploadProductImageApi(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("image", file);

  const authHeaders = getAuthHeaders();
  delete (authHeaders as Record<string, string>)["Content-Type"];

  const endpoints = [
    `${API_BASE_URL}/api/upload`,
    `${API_BASE_URL}/api/Upload`,
    `${API_BASE_URL}/api/SanPham/upload`,
    `${API_BASE_URL}/api/upload/image`,
    `${API_BASE_URL}/api/Upload/image`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { ...authHeaders },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.url) return data.url.startsWith("http") ? data.url : `${API_BASE_URL}${data.url.startsWith("/") ? "" : "/"}${data.url}`;
        if (data?.filePath) return data.filePath.startsWith("http") ? data.filePath : `${API_BASE_URL}${data.filePath.startsWith("/") ? "" : "/"}${data.filePath}`;
        if (data?.path) return data.path.startsWith("http") ? data.path : `${API_BASE_URL}${data.path.startsWith("/") ? "" : "/"}${data.path}`;
        if (typeof data === "string") return data.startsWith("http") ? data : `${API_BASE_URL}${data.startsWith("/") ? "" : "/"}${data}`;
      }
    } catch {
      // Retry next candidate endpoint
    }
  }

  // Fallback: Convert file to local Base64 Data URL if backend server is not available
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

