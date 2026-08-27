import { useEffect, useMemo, useState, useRef, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Zap,
  Briefcase,
  Palette,
  GraduationCap,
  Feather,
  ShieldCheck,
  Truck,
  CreditCard,
  Headphones,
  Mouse,
  Keyboard,
  Loader2,
  AlertTriangle,
  PackageOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Cpu,
  HardDrive,
  Server,
  Monitor,
  Laptop,
  Tag,
  Award,
  Sparkles,
} from "lucide-react";
import { accessoryCategories, accessories, accessoryGradient } from "@/lib/accessories";
import { variantPrice, type Need, type Product } from "@/lib/products";
import {
  fetchLaptops,
  fetchPhuKiens,
  phuKienSlug,
  API_BASE_URL,
  fetchFlashSaleProducts,
  isPromoExpiredCheck,
} from "@/lib/laptop-api";
import { formatVND } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";
import { AccessoryCard } from "@/components/AccessoryCard";

import { ProductImage } from "@/components/ProductImage";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Laptop Center — Hệ thống bán lẻ laptop chính hãng" },
      {
        name: "description",
        content:
          "Khám phá hàng trăm mẫu laptop từ MacBook, ASUS ROG, Lenovo Legion, Dell XPS với giá tốt và bảo hành chính hãng.",
      },
    ],
  }),
  component: Home,
});

const needCategories: Array<{
  key: Need;
  icon: typeof Zap;
  desc: string;
  seed: string;
  gradient: string;
}> = [
    {
      key: "Văn phòng",
      icon: Briefcase,
      desc: "Pin trâu, mỏng nhẹ",
      seed: "/images/categories/office.webp",
      gradient: "from-sky-100 to-blue-50",
    },
    {
      key: "Đồ họa",
      icon: Palette,
      desc: "Màn OLED 2.8K+",
      seed: "/images/categories/design.png",
      gradient: "from-emerald-100 to-teal-50",
    },
    {
      key: "Gaming",
      icon: Zap,
      desc: "RTX 40 series",
      seed: "/images/categories/gaming.png",
      gradient: "from-indigo-200 to-purple-100",
    },
    {
      key: "Mỏng nhẹ",
      icon: Feather,
      desc: "< 1.3kg",
      seed: "/images/categories/ultrabook.webp",
      gradient: "from-violet-100 to-purple-50",
    },
    {
      key: "Sinh viên",
      icon: GraduationCap,
      desc: "Giá hợp lý",
      seed: "/images/categories/student.jpg",
      gradient: "from-blue-100 to-indigo-50",
    },
  ];

function productNumericId(p: Product): number {
  const n = parseInt(p.id, 10);
  return Number.isFinite(n) ? n : 0;
}

function HomeLaptopsState({
  isLoading,
  isError,
  error,
  isEmpty,
  emptyMessage,
  variant = "default",
  refetch,
  isFetching,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isEmpty: boolean;
  emptyMessage?: string;
  variant?: "default" | "on-dark";
  refetch: () => void;
  isFetching: boolean;
  children: ReactNode;
}) {
  const emptyBoxClass =
    variant === "on-dark"
      ? "border-secondary-foreground/20 text-secondary-foreground/70"
      : "border-foreground/10 text-muted-foreground";
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-foreground/5 bg-card p-4">
            <div className="mb-3 aspect-[4/3] w-full rounded-xl bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="mt-2 h-5 w-1/2 rounded bg-muted" />
          </div>
        ))}
        <div className="col-span-full flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Đang tải sản phẩm từ API…
        </div>
      </div>
    );
  }
  if (isError) {
    if (variant === "on-dark") {
      return (
        <div className="rounded-2xl border border-white/40 bg-white/95 backdrop-blur-md p-8 text-center shadow-xl text-slate-900">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-red-100 border border-red-200">
            <AlertTriangle className="size-6 text-red-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Hệ thống đang bảo trì</h3>
          <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto font-medium">
            Hệ thống đang trong quá trình nâng cấp hoặc bảo trì định kỳ. Vui lòng quay lại sau ít phút!
          </p>
          <Button
            className="mt-5 bg-red-600 hover:bg-red-700 text-white font-bold shadow-md px-6"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Thử lại
          </Button>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-xs">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50">
          <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Hệ thống đang bảo trì</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Hệ thống đang trong quá trình nâng cấp hoặc bảo trì định kỳ. Vui lòng quay lại sau ít phút!
        </p>
        <Button className="mt-5 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-xs" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Thử lại
        </Button>
      </div>
    );
  }
  if (isEmpty) {
    return (
      <div className={`rounded-2xl border border-dashed py-12 text-center ${emptyBoxClass}`}>
        <PackageOpen
          className={`mx-auto size-10 opacity-40 ${variant === "on-dark" ? "text-secondary-foreground" : "text-muted-foreground"}`}
        />
        <p className={`mt-2 text-sm ${variant === "on-dark" ? "text-slate-300" : "text-muted-foreground"}`}>
          {emptyMessage ?? "Chưa có sản phẩm trong hệ thống."}
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

function useCountdown(targetMs: number | null) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (targetMs === null) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [targetMs]);
  const remaining = now == null || targetMs === null ? 0 : Math.max(0, targetMs - now);
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  return { h, m, s, ready: now != null && targetMs !== null };
}

function Home() {
  // SSR guard — only render client-side DOM interactions after mount
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [isFlashSaleLoading, setIsFlashSaleLoading] = useState(true);
  const [isFlashSaleError, setIsFlashSaleError] = useState(false);
  const [flashSaleError, setFlashSaleError] = useState<Error | null>(null);

  const fetchFlashSale = () => {
    setIsFlashSaleLoading(true);
    setIsFlashSaleError(false);
    fetchFlashSaleProducts()
      .then((data) => {
        setFlashSaleProducts(data);
        setIsFlashSaleLoading(false);
      })
      .catch((err) => {
        setIsFlashSaleError(true);
        setFlashSaleError(err);
        setIsFlashSaleLoading(false);
      });
  };

  useEffect(() => {
    fetchFlashSale();
  }, []);

  // Grid Pagination state — lưu vào sessionStorage để giữ nguyên khi quay lại
  const [visibleLaptopCount, _setVisibleLaptopCount] = useState(() => {
    const saved = sessionStorage.getItem("home_visibleLaptopCount");
    return saved ? parseInt(saved, 10) || 10 : 10;
  });
  const setVisibleLaptopCount = (valOrFn: number | ((prev: number) => number)) => {
    _setVisibleLaptopCount((prev) => {
      const next = typeof valOrFn === "function" ? valOrFn(prev) : valOrFn;
      sessionStorage.setItem("home_visibleLaptopCount", String(next));
      return next;
    });
  };

  const [visibleAccCount, _setVisibleAccCount] = useState(() => {
    const saved = sessionStorage.getItem("home_visibleAccCount");
    return saved ? parseInt(saved, 10) || 10 : 10;
  });
  const setVisibleAccCount = (valOrFn: number | ((prev: number) => number)) => {
    _setVisibleAccCount((prev) => {
      const next = typeof valOrFn === "function" ? valOrFn(prev) : valOrFn;
      sessionStorage.setItem("home_visibleAccCount", String(next));
      return next;
    });
  };



  const accessoryRef = useRef<HTMLDivElement>(null);
  const [showLeftAcc, setShowLeftAcc] = useState(false);
  const [showRightAcc, setShowRightAcc] = useState(true);

  const flashSaleRef = useRef<HTMLDivElement>(null);
  const [showLeftFlash, setShowLeftFlash] = useState(false);
  const [showRightFlash, setShowRightFlash] = useState(false);

  const activeFlashSaleProducts = useMemo(() => {
    return flashSaleProducts.filter((p) => {
      if (!p.originalPrice || p.originalPrice <= p.basePrice) return false;
      if (p.ngayKetThuc) {
        if (isPromoExpiredCheck(p.ngayKetThuc)) return false;
      }
      return true;
    });
  }, [flashSaleProducts]);

  useEffect(() => {
    if (activeFlashSaleProducts.length > 5) {
      setShowRightFlash(true);
    } else {
      setShowLeftFlash(false);
      setShowRightFlash(false);
    }
  }, [activeFlashSaleProducts]);

  const handleScrollFlash = (e: React.UIEvent<HTMLDivElement>) => {
    if (activeFlashSaleProducts.length <= 5) return;
    const target = e.currentTarget;
    const scrollLeftVal = target.scrollLeft;
    const maxScroll = target.scrollWidth - target.clientWidth;
    setShowLeftFlash(scrollLeftVal > 5);
    setShowRightFlash(scrollLeftVal < maxScroll - 5);
  };

  const scrollLeftFlash = () => {
    if (flashSaleRef.current) {
      flashSaleRef.current.scrollLeft -= flashSaleRef.current.clientWidth * 0.8;
    }
  };

  const scrollRightFlash = () => {
    if (flashSaleRef.current) {
      flashSaleRef.current.scrollLeft += flashSaleRef.current.clientWidth * 0.8;
    }
  };

  const handleScrollAcc = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollLeftVal = target.scrollLeft;
    const maxScroll = target.scrollWidth - target.clientWidth;
    setShowLeftAcc(scrollLeftVal > 5);
    setShowRightAcc(scrollLeftVal < maxScroll - 5);
  };

  const scrollLeftAcc = () => {
    if (accessoryRef.current) {
      accessoryRef.current.scrollLeft -= accessoryRef.current.clientWidth * 0.8;
    }
  };

  const scrollRightAcc = () => {
    if (accessoryRef.current) {
      accessoryRef.current.scrollLeft += accessoryRef.current.clientWidth * 0.8;
    }
  };

  const flashSaleEndTime = useMemo(() => {
    const activeEndTimes = activeFlashSaleProducts
      .map((p) => p.ngayKetThuc)
      .filter((d): d is string => Boolean(d))
      .map((d) => {
        const cleanIso = d.endsWith("Z") ? d.slice(0, -1) : d;
        return new Date(cleanIso).getTime();
      })
      .filter((t) => !isNaN(t) && t > Date.now());

    if (activeEndTimes.length === 0) return null;
    const minTime = Math.min(...activeEndTimes);
    return minTime;
  }, [activeFlashSaleProducts]);

  const { h, m, s, ready } = useCountdown(flashSaleEndTime);

  const isExpired = ready && h === 0 && m === 0 && s === 0;

  useEffect(() => {
    if (isExpired && flashSaleEndTime) {
      fetchFlashSale();
      refetch();
    }
  }, [isExpired, flashSaleEndTime]);

  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["laptops"],
    queryFn: ({ signal }) => fetchLaptops({ signal }),
    staleTime: 60_000,
    retry: 1,
  });

  const targetSlug = useMemo(() => {
    const match = products.find(
      (p) => p.name.toLowerCase().includes("rog strix") || p.name.toLowerCase().includes("scar"),
    );
    if (match) return match.slug;
    return "asus-rog-strix-scar-18";
  }, [products]);

  // Fetch phụ kiện song song — gộp vào danh sách "Sản phẩm nổi bật"
  const { data: phuKienList = [] } = useQuery({
    queryKey: ["phuKiens-home"],
    queryFn: ({ signal }) => fetchPhuKiens(signal),
    staleTime: 60_000,
    retry: 1,
  });

  // Khôi phục vị trí cuộn mượt mà: ẩn trang → scroll → fade in
  const hasRestoredScroll = useRef(false);
  const [scrollReady, setScrollReady] = useState(() => {
    // Nếu không có vị trí đã lưu thì hiện luôn, không cần ẩn
    const saved = sessionStorage.getItem("scroll_pos_/");
    return !saved || saved === "0";
  });

  useEffect(() => {
    if (isLoading || hasRestoredScroll.current) return;
    hasRestoredScroll.current = true;

    const savedY = sessionStorage.getItem("scroll_pos_/");
    if (savedY !== null) {
      const y = parseInt(savedY, 10);
      if (!isNaN(y) && y > 0) {
        // Scroll ngay lập tức (trang đang ẩn nên user không thấy jump)
        window.scrollTo(0, y);
        requestAnimationFrame(() => {
          window.scrollTo(0, y);
          // Đợi layout ổn định rồi mới hiện trang
          setTimeout(() => {
            window.scrollTo(0, y);
            setScrollReady(true);
          }, 50);
        });
        return;
      }
    }
    setScrollReady(true);
  }, [isLoading]);

  // Gộp laptop + phụ kiện thành mảng chung cho "Sản phẩm nổi bật"
  const mergedProducts = useMemo(() => {
    const laptops = products.map((p) => ({ ...p, isPhuKien: false as const }));
    const accs = phuKienList.map((pk) => ({
      id: `pk-${pk.maPhuKien}`,
      slug: phuKienSlug(pk),
      name: pk.tenPhuKien,
      brand: (pk.thuongHieu || "Chính hãng") as any,
      needs: [pk.loaiPhuKien || "Phụ kiện"] as any,
      basePrice: Number(pk.gia) || 0,
      display: "",
      battery: "",
      variants: [{ ram: 0 as any, ssd: 0 as any, priceDelta: 0 }],
      images: pk.anhDaiDien ? [pk.anhDaiDien] : [],
      anhDaiDien: pk.anhDaiDien || undefined,
      cpu: "" as any,
      gpu: "" as any,
      weight: "",
      warranty: pk.baoHanh || "12 tháng",
      stockQuantity: Number(pk.soLuongTon) || 0,
      description: pk.moTa || "",
      rating: 0,
      reviewCount: 0,
      isPhuKien: true as const,
      phuKienId: pk.maPhuKien,
    }));
    return [...laptops, ...accs] as any[];
  }, [products, phuKienList]);

  // flashSale list is loaded directly from API via useEffect

  // "Mới về" — ưu tiên sản phẩm có badge Mới, rồi sắp xếp ID giảm dần, gộp cả phụ kiện
  const newArrivals = useMemo(() => {
    const tagged = mergedProducts.filter((p) => p.badge === "Mới");
    if (tagged.length > 0) return tagged.slice(0, 50);
    return [...mergedProducts]
      .sort((a, b) => productNumericId(b) - productNumericId(a))
      .slice(0, 50);
  }, [mergedProducts]);

  // "Laptop nổi bật" — lọc CHỈ LAPTOP, ưu tiên đưa sản phẩm GIẢM GIÁ lên vị trí đầu tiên
  const bestSellers = useMemo(() => {
    const onlyLaptops = mergedProducts.filter(
      (p) => !p.isPhuKien && !p.id.startsWith("acc_"),
    );

    const saleLaptops = onlyLaptops.filter(
      (p) =>
        Boolean(p.originalPrice && p.originalPrice > p.basePrice) ||
        Boolean(p.isSale),
    );

    const regularLaptops = onlyLaptops.filter(
      (p) => !saleLaptops.some((s) => s.id === p.id),
    );

    return [...saleLaptops, ...regularLaptops];
  }, [mergedProducts]);

  const sortedPhuKienList = useMemo(() => {
    const saleAccs = phuKienList.filter(
      (pk) =>
        (pk.giaKhuyenMai && Number(pk.giaKhuyenMai) < Number(pk.gia)) ||
        (pk.phanTramGiam && pk.phanTramGiam > 0),
    );

    const regularAccs = phuKienList.filter(
      (pk) => !saleAccs.some((s) => s.maPhuKien === pk.maPhuKien),
    );

    return [...saleAccs, ...regularAccs];
  }, [phuKienList]);

  return (
    <div
      style={{
        opacity: scrollReady ? 1 : 0,
        transition: "opacity 150ms ease-in",
      }}
    >
      <section className="px-4 pt-8 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl bg-[#09080e] border border-zinc-800/40 p-6 md:py-10 md:px-12 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            {/* Ambient Glowing Backgrounds */}
            <div className="absolute top-1/4 left-10 w-72 h-72 rounded-full bg-red-600/10 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
            <div className="absolute top-10 right-10 w-80 h-80 rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-xl flex-1">
              <span className="mb-4 inline-block text-[11px] font-semibold uppercase tracking-[0.2em] text-red-500">
                Mới ra mắt
              </span>
              <h1 className="text-balance text-4xl font-bold leading-tight md:text-5xl bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
                ASUS ROG Strix SCAR 18
              </h1>
              <p className="mt-5 max-w-[45ch] text-pretty text-base text-zinc-300 md:text-lg">
                Sở hữu bộ vi xử lý Intel Core i9-14900HX thế hệ mới, RTX 4090 16GB GDDR6, màn hình
                18&quot; QHD+ 240Hz với công nghệ ROG Nebula. Định nghĩa lại tiêu chuẩn laptop
                gaming cao cấp.
              </p>

              {/* Spec badges */}
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  {
                    text: "Core i9-14900HX",
                    bg: "bg-red-500/5",
                    border: "border-red-500/20",
                    textCol: "text-red-400",
                  },
                  {
                    text: "RTX 4090",
                    bg: "bg-purple-500/5",
                    border: "border-purple-500/20",
                    textCol: "text-purple-400",
                  },
                  {
                    text: '18" QHD+ 240Hz',
                    bg: "bg-blue-500/5",
                    border: "border-blue-500/20",
                    textCol: "text-blue-400",
                  },
                  {
                    text: "DDR5 32GB",
                    bg: "bg-pink-500/5",
                    border: "border-pink-500/20",
                    textCol: "text-pink-400",
                  },
                ].map((spec) => (
                  <span
                    key={spec.text}
                    className={`rounded-full border ${spec.border} ${spec.bg} ${spec.textCol} px-3 py-1 text-xs font-medium`}
                  >
                    {spec.text}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/products/$slug" params={{ slug: targetSlug }}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full border-red-500/30 bg-transparent text-white hover:bg-gradient-to-r hover:from-red-600 hover:to-purple-600 hover:border-transparent hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300 cursor-pointer"
                  >
                    Khám phá
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative z-10 w-full md:w-1/2 flex justify-center md:justify-end">
              <img
                src="/images/categories/image_banner.png"
                alt="ASUS ROG Strix SCAR 18"
                className="max-h-[220px] md:max-h-[320px] w-auto object-contain drop-shadow-[0_10px_30px_rgba(168,85,247,0.25)] transition-all duration-500 hover:scale-[1.08] hover:drop-shadow-[0_15px_40px_rgba(168,85,247,0.45)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories - CellphoneS Style */}
      <section className="px-4 py-16 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                Chọn theo nhu cầu
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Tìm chiếc laptop phù hợp nhất với bạn
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {needCategories.map(({ key, icon: Icon, desc, seed, gradient }) => (
              <Link
                key={key}
                to="/products"
                search={{ need: key }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                {/* Laptop Image Area with gradient background */}
                <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-white p-3">
                  <img
                    src={seed}
                    alt={key}
                    loading="lazy"
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Label */}
                <div className="flex w-full items-center gap-2 border-t border-gray-50 px-3.5 py-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors duration-200 group-hover:bg-primary/10 group-hover:text-primary">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-800 transition-colors duration-200 group-hover:text-primary md:text-sm">
                      {key}
                    </div>
                    <div className="truncate text-[10px] text-gray-400 md:text-xs">{desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sale Section — Ẩn hoàn toàn khi không có sản phẩm giảm giá thực tế (Chuẩn DATN) */}
      {activeFlashSaleProducts.length === 0 ? null : (
        <section className="px-4 pb-16 md:px-6">
          <div className="mx-auto max-w-7xl rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-6 md:p-10 text-white shadow-2xl border border-red-500/30">
            {/* Header & Countdown Timer & Golden Flash Sale Badge */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/20 pb-6">
              {/* Left: Countdown Timer */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-white font-black text-xl md:text-2xl tracking-tight">
                  Ưu đãi kết thúc sau:
                </span>

                <div className="flex items-center gap-2">
                  {[
                    { v: h, l: "GIỜ" },
                    { v: m, l: "PHÚT" },
                    { v: s, l: "GIÂY" },
                  ].map((c, i) => (
                    <div key={c.l} className="flex items-center gap-2">
                      <div className="bg-[#111] text-white px-3.5 py-2 rounded-xl text-center shadow-md border border-white/20 min-w-[56px]">
                        <div className="text-xl sm:text-2xl font-black font-mono leading-none text-yellow-300">
                          {ready ? String(c.v).padStart(2, "0") : "00"}
                        </div>
                        <div className="text-[9px] text-gray-400 font-bold tracking-wider uppercase mt-1">
                          {c.l}
                        </div>
                      </div>
                      {i < 2 && <span className="text-white font-bold text-xl leading-none">:</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Golden Flash Sale Graphic Badge Header */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 px-4 py-2 rounded-xl font-black text-sm sm:text-base tracking-wider uppercase shadow-lg border border-yellow-200 self-start md:self-auto">
                <Zap className="size-5 fill-red-600 text-red-600 animate-pulse" />
                <span>FLASH SALE — LIMITED TIME OFFER</span>
                <Zap className="size-5 fill-red-600 text-red-600 animate-pulse" />
              </div>
            </div>

            <HomeLaptopsState
              isLoading={isFlashSaleLoading}
              isError={isFlashSaleError}
              error={flashSaleError}
              isEmpty={false}
              emptyMessage="Chưa có sản phẩm Flash Sale."
              variant="on-dark"
              refetch={fetchFlashSale}
              isFetching={isFlashSaleLoading}
            >
              {/* Slider sản phẩm Flash Sale — Chuẩn DATN */}
              {(() => {
                const hasMoreThan5 = activeFlashSaleProducts.length > 5;
                return (
                  <div className="relative px-2 md:px-6 group/slider">
                    {/* Nút Trái (Chỉ hiện khi > 5 sản phẩm) */}
                    {isMounted && hasMoreThan5 && showLeftFlash && (
                      <button
                        type="button"
                        onClick={scrollLeftFlash}
                        className="absolute -left-2 md:-left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white text-slate-900 shadow-2xl hover:bg-yellow-400 hover:text-red-700 transition duration-200 border border-slate-200 flex items-center justify-center cursor-pointer active:scale-95"
                        aria-label="Xem sản phẩm trước"
                      >
                        <ChevronLeft className="size-6 -ml-0.5" />
                      </button>
                    )}

                    {/* Container: Grid (khi <= 5 sản phẩm) hoặc Flex Slider (khi > 5 sản phẩm) */}
                    <div
                      ref={flashSaleRef}
                      onScroll={handleScrollFlash}
                      className={
                        hasMoreThan5
                          ? "flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none scroll-smooth"
                          : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pb-4 pt-1"
                      }
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      {activeFlashSaleProducts.map((p) => {
                        const discount = p.originalPrice
                          ? Math.round((1 - p.basePrice / p.originalPrice) * 100)
                          : 0;

                        const isAccessoryItem = p.loaiSanPham === "phu_kien" || p.id.startsWith("acc_");
                        const rawNumericId = p.id.replace("acc_", "");

                        const cardClassName = hasMoreThan5
                          ? "snap-start w-[calc(100%-16px)] sm:w-[calc(50%-12px)] md:w-[calc(33.333%-12px)] lg:w-[calc(20%-12.8px)] shrink-0 bg-white dark:bg-slate-900 rounded-lg shadow-none hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group relative border border-white/80 dark:border-slate-800 text-left block cursor-pointer"
                          : "w-full h-full bg-white dark:bg-slate-900 rounded-lg shadow-none hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group relative border border-white/80 dark:border-slate-800 text-left block cursor-pointer";

                        const cardContent = (
                          <>
                            {/* Container Ảnh & Badges */}
                            <div className="relative aspect-square w-full bg-white dark:bg-slate-900 p-2.5 flex items-center justify-center overflow-hidden">
                              <ProductImage
                                seed={p.anhDaiDien || p.images[0]}
                                label={p.name}
                                className="flex h-full w-full items-center justify-center"
                                iconClassName="size-12"
                                imgClassName="max-h-full max-w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
                              />
                              {/* Badges Overlay */}
                              <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                                {discount > 0 && (
                                  <span className="inline-flex items-center justify-center min-w-[50px] px-3.5 py-1 rounded-full bg-[#c8181e] text-white text-xs font-bold shadow-xs">
                                    -{discount}%
                                  </span>
                                )}
                                {p.badge && p.badge !== "Flash Sale" && (
                                  <span className="inline-flex items-center justify-center min-w-[50px] px-3.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase shadow-xs">
                                    {p.badge}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Chi tiết sản phẩm */}
                            <div className="p-4 flex flex-col justify-between flex-1">
                              <div>
                                {/* Tiêu đề sản phẩm */}
                                <div className="h-10 flex items-start">
                                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-red-600 transition-colors">
                                    {p.name}
                                  </h3>
                                </div>

                                {/* Giá & Giảm giá */}
                                <div className="mt-2 flex flex-col justify-end">
                                  {p.originalPrice && p.originalPrice > variantPrice(p, 0) && (
                                    <div className="flex items-center gap-1.5 text-xs mb-0.5">
                                      <span className="text-slate-400 line-through font-medium">
                                        {formatVND(p.originalPrice)}
                                      </span>
                                      {discount > 0 && (
                                        <span className="text-red-600 font-bold bg-red-50 dark:bg-red-950/40 px-1.5 py-0.2 rounded text-[10px]">
                                          -{discount}%
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <div className="text-base sm:text-lg font-black text-red-600 leading-tight">
                                    {formatVND(variantPrice(p, 0))}
                                  </div>
                                </div>

                                {/* Thông số kỹ thuật Icon List (Chuẩn DATN) */}
                                {!isAccessoryItem ? (
                                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                                    <div className="flex items-center gap-2 truncate" title={p.cpu}>
                                      <Cpu className="size-3.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{p.cpu || "Intel Core i5"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 truncate" title={p.oCung || "SSD 512GB"}>
                                      <HardDrive className="size-3.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{p.oCung || "SSD 512GB NVMe"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 truncate" title={p.ram || "RAM 16GB"}>
                                      <Server className="size-3.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{p.ram || "16GB DDR5"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 truncate" title={(p as any).cardDoHoa || p.gpu || "Intel Iris Xe"}>
                                      <Monitor className="size-3.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{(p as any).cardDoHoa || p.gpu || "Intel Graphics"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 truncate" title={p.manHinh || "15.6 inch"}>
                                      <Laptop className="size-3.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{p.manHinh || "15.6 inch FHD"}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                                    <div className="flex items-center gap-2 truncate" title={p.loaiPhuKien || "Loại phụ kiện"}>
                                      <Tag className="size-3.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{p.loaiPhuKien || (p.name.includes("Chuột") ? "Chuột máy tính" : p.name.includes("Tai nghe") ? "Tai nghe Gaming" : p.name.includes("Bàn phím") ? "Bàn phím cơ" : "Phụ kiện")}</span>
                                    </div>
                                    <div className="flex items-center gap-2 truncate" title={p.ketNoi || "Kết nối"}>
                                      <Zap className="size-3.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{p.ketNoi || "Kết nối Bluetooth / USB"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 truncate" title={p.thuongHieu || (p.brand as string) || "Thương hiệu"}>
                                      <Award className="size-3.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{p.thuongHieu || ((p.brand as string) !== "Phụ kiện" ? p.brand : null) || "Thương hiệu chính hãng"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 truncate" title={p.denLed || (p as any).doPhanGiai || (p as any).congNgheAmThanh || "Tính năng"}>
                                      <Sparkles className="size-3.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{p.denLed || (p as any).doPhanGiai || (p as any).congNgheAmThanh || "Thiết kế hiện đại"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 truncate" title={p.warranty || "Bảo hành"}>
                                      <ShieldCheck className="size-3.5 text-slate-400 shrink-0" />
                                      <span className="truncate">{p.warranty ? `Bảo hành ${p.warranty}` : "Bảo hành 12 tháng"}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        );

                        if (isAccessoryItem) {
                          return (
                            <Link
                              key={p.id}
                              to="/accessories/$id"
                              params={{ id: rawNumericId }}
                              className={cardClassName}
                            >
                              {cardContent}
                            </Link>
                          );
                        }

                        return (
                          <Link
                            key={p.id}
                            to="/products/$slug"
                            params={{ slug: p.slug }}
                            className={cardClassName}
                          >
                            {cardContent}
                          </Link>
                        );
                      })}
                    </div>

                    {/* Nút Phải (Chỉ hiện khi > 5 sản phẩm) */}
                    {isMounted && hasMoreThan5 && showRightFlash && (
                      <button
                        type="button"
                        onClick={scrollRightFlash}
                        className="absolute -right-2 md:-right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white text-slate-900 shadow-2xl hover:bg-yellow-400 hover:text-red-700 transition duration-200 border border-slate-200 flex items-center justify-center cursor-pointer active:scale-95"
                        aria-label="Xem sản phẩm tiếp theo"
                      >
                        <ChevronRight className="size-6 -mr-0.5" />
                      </button>
                    )}
                  </div>
                );
              })()}
            </HomeLaptopsState>
          </div>
        </section>
      )}

      {/* Laptop nổi bật */}
      <section className="px-4 pb-16 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center my-6 px-4 md:px-12">
            <div className="flex-grow border-t-2 border-gray-300"></div>
            <span className="mx-4 text-xl md:text-2xl font-bold text-gray-800 uppercase">
              Laptop nổi bật
            </span>
            <div className="flex-grow border-t-2 border-gray-300"></div>
          </div>

          <HomeLaptopsState
            isLoading={isLoading}
            isError={isError}
            error={error as Error | null}
            isEmpty={!isLoading && !isError && bestSellers.length === 0}
            refetch={refetch}
            isFetching={isFetching}
          >
            {/* 5 Sản phẩm / Hàng (Chuẩn DATN) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
              {bestSellers.slice(0, visibleLaptopCount).map((p) => {
                const pk = p as any;
                return pk.isPhuKien ? (
                  <Link
                    key={p.id}
                    to="/accessories/$id"
                    params={{ id: String((p as any).phuKienId) }}
                    className="group block rounded-2xl border border-foreground/5 bg-card p-4 hover:border-primary/30 transition-colors shadow-xs hover:shadow-md"
                  >
                    <div className="aspect-[4/3] w-full rounded-xl bg-muted/50 mb-3 flex items-center justify-center overflow-hidden">
                      {p.anhDaiDien ? (
                        <img
                          src={p.anhDaiDien}
                          alt={p.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-3xl opacity-30">🖱️</span>
                      )}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                      {p.brand} · Phụ kiện
                    </div>
                    <h3 className="text-sm font-semibold leading-tight line-clamp-2">
                      {p.name}
                    </h3>
                    <div className="mt-2 text-base font-bold text-primary">
                      {formatVND(p.basePrice)}
                    </div>
                  </Link>
                ) : (
                  <ProductCard key={p.id} product={p} />
                );
              })}
            </div>

            {/* Nút Xem Thêm / Thu Gọn: Chỉ hiện Thu gọn khi đã xổ hết toàn bộ sản phẩm */}
            <div className="mt-10 flex justify-center">
              {bestSellers.length > visibleLaptopCount ? (
                <button
                  type="button"
                  onClick={() => setVisibleLaptopCount((prev) => prev + 10)}
                  className="group flex items-center gap-2 rounded-full px-8 py-3 font-bold text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-red-600 hover:text-white hover:border-red-600 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-95"
                >
                  <span>Xem thêm ({bestSellers.length - visibleLaptopCount} sản phẩm)</span>
                  <ChevronDown className="size-4 transition-transform group-hover:translate-y-0.5" />
                </button>
              ) : visibleLaptopCount > 10 ? (
                <button
                  type="button"
                  onClick={() => setVisibleLaptopCount(10)}
                  className="group flex items-center gap-2 rounded-full px-8 py-3 font-bold text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-700 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-95"
                >
                  <span>Thu gọn</span>
                  <ChevronUp className="size-4 transition-transform group-hover:-translate-y-0.5" />
                </button>
              ) : null}
            </div>
          </HomeLaptopsState>
        </div>
      </section>

      {/* Accessories */}
      <section className="px-4 pb-16 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center my-6 px-4 md:px-12">
            <div className="flex-grow border-t-2 border-gray-300"></div>
            <span className="mx-4 text-xl md:text-2xl font-bold text-gray-800 uppercase">
              Phụ kiện nổi bật
            </span>
            <div className="flex-grow border-t-2 border-gray-300"></div>
          </div>

          <HomeLaptopsState
            isLoading={isLoading}
            isError={isError}
            error={error as Error | null}
            isEmpty={!isLoading && !isError && sortedPhuKienList.length === 0}
            refetch={refetch}
            isFetching={isFetching}
          >
            {/* 5 Phụ kiện / Hàng (Chuẩn DATN) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
              {sortedPhuKienList.slice(0, visibleAccCount).map((pk) => (
                <AccessoryCard key={pk.maPhuKien} accessory={pk} />
              ))}
            </div>

            {/* Nút Xem Thêm / Thu Gọn: Chỉ hiện Thu gọn khi đã xổ hết toàn bộ phụ kiện */}
            <div className="mt-10 flex justify-center">
              {sortedPhuKienList.length > visibleAccCount ? (
                <button
                  type="button"
                  onClick={() => setVisibleAccCount((prev) => prev + 10)}
                  className="group flex items-center gap-2 rounded-full px-8 py-3 font-bold text-sm text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-red-600 hover:text-white hover:border-red-600 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-95"
                >
                  <span>Xem thêm ({sortedPhuKienList.length - visibleAccCount} phụ kiện)</span>
                  <ChevronDown className="size-4 transition-transform group-hover:translate-y-0.5" />
                </button>
              ) : visibleAccCount > 10 ? (
                <button
                  type="button"
                  onClick={() => setVisibleAccCount(10)}
                  className="group flex items-center gap-2 rounded-full px-8 py-3 font-bold text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-700 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-95"
                >
                  <span>Thu gọn</span>
                  <ChevronUp className="size-4 transition-transform group-hover:-translate-y-0.5" />
                </button>
              ) : null}
            </div>
          </HomeLaptopsState>
        </div>
      </section>
    </div>
  );
}
