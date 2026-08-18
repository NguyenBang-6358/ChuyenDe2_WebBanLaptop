import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Laptop,
  Zap,
  Briefcase,
  GraduationCap,
  Feather,
  Palette,
  Trash2,
  ChevronDown,
  Sparkles,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useCart, computeDetailed, computeTotalItems, computeTotalPrice } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-store";
import { fetchLaptops, fetchPhuKiens, fetchDanhMuc, phuKienSlug } from "@/lib/laptop-api";

import { brands, needs as needsList, products as allProductsList } from "@/lib/products";
import { accessories as allAccessoriesList } from "@/lib/accessories";
import { formatVND } from "@/lib/format";
import { getAppSettings, type AppSettings } from "@/lib/settings-store";
import { ProductImage } from "./ProductImage";
import { Button } from "./ui/button";

const needIcons: Record<string, typeof Zap> = {
  Gaming: Zap,
  "Văn phòng": Briefcase,
  "Đồ họa": Palette,
  "Sinh viên": GraduationCap,
  "Mỏng nhẹ": Feather,
};

export function Header() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isLoggedIn, user: authUser, logout } = useAuth();
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.remove);
  const clearCart = useCart((s) => s.clear);
  const cartItems = isLoggedIn ? items : [];
  const totalItems = useMemo(() => computeTotalItems(cartItems), [cartItems]);
  const totalPrice = useMemo(() => computeTotalPrice(cartItems), [cartItems]);
  const detailed = useMemo(() => computeDetailed(cartItems), [cartItems]);
  const syncFromBackend = useCart((s) => s.syncFromBackend);

  const [settings, setSettings] = useState<AppSettings>(getAppSettings);

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setSettings(getAppSettings());
    };
    window.addEventListener("app_settings_updated", handleSettingsUpdate);
    return () => window.removeEventListener("app_settings_updated", handleSettingsUpdate);
  }, []);

  const isAdminUser = useMemo(() => {
    if (!isLoggedIn || !authUser) return false;
    const role = (authUser as any).vaiTro || (authUser as any).role || "";
    const roleStr = String(role).toLowerCase();
    const emailStr = String(authUser.email || "").toLowerCase();
    return roleStr === "quan_tri" || roleStr.includes("admin") || emailStr.includes("admin");
  }, [isLoggedIn, authUser]);

  useEffect(() => {
    if (!isLoggedIn) {
      clearCart();
      return;
    }
    syncFromBackend(authUser?.maNguoiDung).catch((err) => {
      console.error("Lỗi tự động đồng bộ giỏ hàng từ backend:", err);
    });
  }, [isLoggedIn, authUser?.maNguoiDung, syncFromBackend, clearCart]);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const cartHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCartTotalRef = useRef(totalItems);
  const megaRef = useRef<HTMLDivElement>(null);
  const [cartBadgeAnimating, setCartBadgeAnimating] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
    setMiniCartOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  // Click outside to close "Danh mục" mega menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [apiProducts, setApiProducts] = useState<any[]>([]);
  const [apiAccessories, setApiAccessories] = useState<any[]>([]);
  const [apiCategories, setApiCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchLaptops()
      .then((prods) => {
        if (prods && prods.length > 0) {
          setApiProducts(prods);
        }
      })
      .catch(() => {});

    fetchPhuKiens()
      .then((accs) => {
        if (accs && accs.length > 0) {
          setApiAccessories(accs);
        }
      })
      .catch(() => {});

    fetchDanhMuc()
      .then((cats) => {
        if (cats && cats.length > 0) {
          const names = cats.map((c) => c.tenDanhMuc.replace(/^Laptop\s*/i, "").trim()).filter(Boolean);
          setApiCategories(Array.from(new Set(names)));
        }
      })
      .catch(() => {});
  }, []);

  const displayNeedsList = useMemo(() => {
    return apiCategories.length > 0 ? apiCategories : needsList;
  }, [apiCategories]);

  // Filter products & accessories live for smart search
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const searchWords = q.split(/\s+/).filter(Boolean);
    const activeProducts = apiProducts.length > 0 ? apiProducts : allProductsList;

    const laptops = activeProducts.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand || "",
      subtitle: `${p.brand || ""} · ${p.cpu || ""} · ${p.gpu || ""}`,
      price: p.basePrice,
      originalPrice: p.originalPrice,
      type: "laptop" as const,
      category: Array.isArray(p.needs) ? p.needs.join(" ") : "",
      cpu: p.cpu || "",
      gpu: p.gpu || "",
      imageSeed: p.anhDaiDien || (p.images && p.images[0]) || p.slug,
    }));

    const accs = apiAccessories.length > 0
      ? apiAccessories.map((pk) => ({
          id: String(pk.maPhuKien),
          slug: phuKienSlug(pk),
          name: pk.tenPhuKien || "",
          brand: pk.thuongHieu || "Phụ kiện",
          subtitle: `Phụ kiện · ${pk.loaiPhuKien || "Chính hãng"}`,
          price: Number(pk.giaKhuyenMai ?? pk.gia ?? 0),
          originalPrice: Number(pk.gia ?? 0),
          type: "accessory" as const,
          category: pk.loaiPhuKien || "Phụ kiện",
          cpu: "",
          gpu: "",
          imageSeed: pk.anhDaiDien || "",
        }))
      : allAccessoriesList.map((a) => ({
          id: a.id,
          slug: a.id,
          name: a.name,
          brand: a.brand,
          subtitle: `Phụ kiện · ${a.category}`,
          price: a.price,
          originalPrice: a.originalPrice,
          type: "accessory" as const,
          category: a.category,
          cpu: "",
          gpu: "",
          imageSeed: a.seed,
        }));

    const combined = [...laptops, ...accs];

    return combined
      .filter((item) => {
        if (selectedCategory) {
          const catLower = selectedCategory.toLowerCase();
          if (catLower === "phu_kien") {
            if (item.type !== "accessory") return false;
          } else {
            const itemCategoryText = `${item.brand} ${item.category}`.toLowerCase();
            if (!itemCategoryText.includes(catLower)) return false;
          }
        }

        const searchableText = `${item.name} ${item.brand} ${item.subtitle} ${item.category} ${item.cpu} ${item.gpu}`.toLowerCase();
        return searchWords.every((word) => searchableText.includes(word));
      })
      .slice(0, 8);
  }, [query, selectedCategory, apiProducts, apiAccessories]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    setIsSearchOpen(false);
    navigate({
      to: "/products",
      search: (prev: any) => ({
        ...prev,
        q: q || undefined,
        brand: brands.includes(selectedCategory as any) ? (selectedCategory as any) : undefined,
        need: needsList.includes(selectedCategory as any) ? (selectedCategory as any) : undefined,
      }),
    });
  };

  const onCartEnter = () => {
    if (totalItems === 0) return;
    if (cartHoverTimer.current) clearTimeout(cartHoverTimer.current);
    setMiniCartOpen(true);
  };
  const onCartLeave = () => {
    cartHoverTimer.current = setTimeout(() => setMiniCartOpen(false), 150);
  };

  useEffect(() => {
    if (totalItems === 0) setMiniCartOpen(false);
  }, [totalItems]);

  useEffect(() => {
    if (totalItems > prevCartTotalRef.current) {
      setCartBadgeAnimating(true);
      const timer = setTimeout(() => setCartBadgeAnimating(false), 450);
      prevCartTotalRef.current = totalItems;
      return () => clearTimeout(timer);
    }
    prevCartTotalRef.current = totalItems;
  }, [totalItems]);

  return (
    <>
      <div className="hidden bg-secondary text-secondary-foreground md:block">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-[11px] md:px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3 text-primary" />
            <span>Miễn phí giao hàng toàn quốc · Trả góp 0% · Bảo hành 24 tháng</span>
          </div>
          <div className="flex items-center gap-4 text-secondary-foreground/70">
            <span>Hotline: {settings.hotline}</span>
          </div>
        </div>
      </div>
      <header className="sticky top-0 z-50 border-b border-foreground/5 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-foreground group">
              <img
                src="/images/categories/logo-laptop.png"
                alt="Laptop Center Logo"
                className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <span>
                Laptop<span className="text-primary"> Center</span>
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              <div className="relative" ref={megaRef}>
                <button
                  onClick={() => setMegaOpen((v) => !v)}
                  aria-expanded={megaOpen}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition-all ${
                    megaOpen
                      ? "bg-red-600 text-white font-semibold shadow-sm shadow-red-600/10"
                      : "font-medium text-slate-700 dark:text-slate-200 hover:bg-muted hover:text-red-600"
                  }`}
                >
                  <Menu className="size-4" />
                  Danh mục
                  <ChevronDown
                    className={`size-3.5 transition-transform ${megaOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {megaOpen && (
                  <div className="absolute left-0 top-full z-50 pt-3">
                    <div className="grid w-[680px] grid-cols-[1fr_1fr_1.1fr] gap-6 rounded-2xl border border-foreground/5 bg-popover p-6 text-left shadow-2xl ring-1 ring-foreground/5">
                      <div>
                        <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Thương hiệu
                        </h4>
                        <ul className="space-y-1">
                          {brands.map((b) => (
                            <li key={b}>
                              <Link
                                to="/products"
                                search={{ brand: b }}
                                onClick={() => setMegaOpen(false)}
                                className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-primary"
                              >
                                <Laptop className="size-4 text-muted-foreground" /> {b}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          Nhu cầu
                        </h4>
                        <ul className="space-y-1">
                          {displayNeedsList.map((n) => {
                            const Icon = needIcons[n] ?? Laptop;
                            return (
                              <li key={n}>
                                <Link
                                  to="/products"
                                  search={{ need: n }}
                                  onClick={() => setMegaOpen(false)}
                                  className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-primary"
                                >
                                  <Icon className="size-4 text-muted-foreground" /> {n}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <Link
                        to="/products"
                        search={{ sort: "new" }}
                        onClick={() => setMegaOpen(false)}
                        className="group relative flex flex-col items-center justify-center text-center overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-950 to-neutral-900 p-5 transition-all duration-300 hover:border-white/10 hover:shadow-xl hover:shadow-black/30"
                        style={{ minHeight: "185px" }}
                      >
                        <div
                          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 transition-opacity duration-500 group-hover:opacity-30"
                          style={{
                            background: "radial-gradient(circle, #34d399 0%, transparent 65%)",
                          }}
                        />

                        <div className="relative z-10 flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                            <Sparkles className="size-2.5" /> Mới 2026
                          </span>
                          <h4 className="text-white text-lg font-bold tracking-wide mb-2 mt-3">
                            Bộ sưu tập 2026
                          </h4>
                          <p className="text-neutral-400 text-xs leading-relaxed max-w-[180px]">
                            Laptop thế hệ mới hiệu năng vượt trội, thiết kế tinh tế — ưu đãi đến 15%.
                          </p>
                        </div>

                        <button className="mt-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs px-4 py-2 rounded-xl transition-all duration-300 backdrop-blur-sm w-fit relative z-10">
                          Khám phá ngay
                        </button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              <Link
                to="/products"
                activeProps={{
                  className: "bg-red-600 text-white font-semibold shadow-sm shadow-red-600/10",
                }}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-muted hover:text-red-600"
              >
                Sản phẩm
              </Link>
              <Link
                to="/accessories"
                activeProps={{
                  className: "bg-red-600 text-white font-semibold shadow-sm shadow-red-600/10",
                }}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-muted hover:text-red-600"
              >
                Phụ kiện
              </Link>
              <Link
                to="/compare"
                activeProps={{
                  className: "bg-red-600 text-white font-semibold shadow-sm shadow-red-600/10",
                }}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-muted hover:text-red-600"
              >
                So sánh
              </Link>
            </nav>
          </div>

          {/* DATN Smart Search Bar Container */}
          <div ref={searchRef} className="relative hidden h-10 flex-1 max-w-md items-center rounded-full bg-muted/80 ring-1 ring-foreground/10 transition-all focus-within:ring-2 focus-within:ring-red-600/40 focus-within:bg-background md:flex z-50">
            <form onSubmit={onSearch} className="flex items-center w-full h-full px-3">
              {/* Live Search Input */}
              <input
                value={query}
                onFocus={() => {
                  if (query.trim()) setIsSearchOpen(true);
                }}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                type="text"
                placeholder="Tìm kiếm sản phẩm theo tên, cấu hình, hãng..."
                className="w-full bg-transparent text-xs sm:text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />

              <button
                type="submit"
                className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors shrink-0 cursor-pointer"
                title="Tìm kiếm"
              >
                <Search className="size-4" />
              </button>
            </form>

            {/* Instant Search Results Floating Dropdown Popup */}
            {isSearchOpen && query.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover rounded-2xl shadow-2xl border border-foreground/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/10">
                {searchResults.length > 0 ? (
                  <div className="divide-y divide-foreground/5 max-h-[380px] overflow-y-auto">
                    <div className="px-3.5 py-2 bg-muted/50 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                      <span>Gợi ý sản phẩm ({searchResults.length})</span>
                      <span className="text-[10px] text-red-600 font-bold bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
                        Kết quả tức thì
                      </span>
                    </div>
                    {searchResults.map((item) => (
                      <Link
                        key={item.id}
                        to={item.type === "laptop" ? "/products/$slug" : "/accessories/$id"}
                        params={(item.type === "laptop" ? { slug: item.slug } : { id: item.id }) as any}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setQuery("");
                        }}
                        className="p-3 flex items-center gap-3 hover:bg-muted/70 transition cursor-pointer group"
                      >
                        <div className="w-11 h-11 rounded-lg bg-white dark:bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center">
                          {item.type === "laptop" ? (
                            <ProductImage
                              seed={item.imageSeed}
                              label={item.name}
                              className="w-full h-full"
                              iconClassName="size-5 text-white/90"
                              imgClassName="w-full h-full object-contain p-0.5"
                            />
                          ) : (
                            <>
                              {item.imageSeed ? (
                                <img
                                  src={item.imageSeed}
                                  alt={item.name}
                                  className="w-full h-full object-contain p-1"
                                />
                              ) : (
                                <span className="text-base opacity-40">🖱️</span>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-foreground group-hover:text-red-600 transition line-clamp-1">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                            {item.subtitle}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-extrabold text-red-600">
                              {formatVND(item.price)}
                            </span>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className="text-[10px] text-muted-foreground line-through">
                                {formatVND(item.originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}

                    <button
                      type="button"
                      onClick={(e) => {
                        setIsSearchOpen(false);
                        onSearch(e);
                      }}
                      className="w-full text-center py-2.5 text-xs font-bold text-red-600 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-950/40 transition cursor-pointer border-t border-foreground/5"
                    >
                      Xem tất cả kết quả cho "{query}" →
                    </button>
                  </div>
                ) : (
                  <div className="p-5 text-center text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">Không tìm thấy sản phẩm phù hợp</p>
                    <p className="text-[11px] opacity-80">Thử tìm kiếm với từ khóa khác như "Asus", "RTX", "i7", "Gaming"...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {isLoggedIn ? (
              <div className="hidden items-center gap-1 md:flex">
                <Link
                  to={isAdminUser ? "/admin" : "/account"}
                  className="flex items-center gap-2 rounded-full px-3 py-2 transition-colors hover:bg-muted"
                  aria-label={isAdminUser ? "Trang quản trị Admin" : "Tài khoản"}
                  title={isAdminUser ? "Trang quản trị Admin" : "Trang cá nhân"}
                >
                  <div className="relative">
                    <User className="size-4 text-slate-700 dark:text-slate-200" />
                    <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                  </div>
                  {authUser && (
                    <span className="hidden text-xs font-semibold lg:block text-slate-800 dark:text-slate-200">
                      {authUser.hoTen?.split(" ").pop() || "Admin"}
                    </span>
                  )}
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    toast.success("Đã đăng xuất thành công!");
                    navigate({ to: "/" });
                  }}
                  className="flex size-9 items-center justify-center rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
                  title="Đăng xuất"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-1.5 rounded-full px-2 py-2 text-xs font-medium md:flex">
                <Link
                  to="/register"
                  className="text-slate-700 transition-colors hover:text-red-600 dark:text-slate-200"
                >
                  Đăng ký
                </Link>
                <span className="text-muted-foreground/40">|</span>
                <Link
                  to="/login"
                  className="text-slate-700 transition-colors hover:text-red-600 dark:text-slate-200"
                >
                  Đăng nhập
                </Link>
              </div>
            )}

            <div className="relative" onMouseEnter={onCartEnter} onMouseLeave={onCartLeave}>
              <Link
                to="/cart"
                className="relative flex size-10 items-center justify-center rounded-full transition-colors hover:bg-muted"
                aria-label="Giỏ hàng"
              >
                <ShoppingCart className="size-5" />
                {totalItems > 0 && (
                  <span
                    className={`absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[#dc2626] text-[10px] font-bold text-white transition-all duration-300 ${
                      cartBadgeAnimating ? "scale-125 bg-emerald-500" : "scale-100"
                    }`}
                  >
                    {totalItems}
                  </span>
                )}
              </Link>
              {miniCartOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-xl border border-foreground/5 bg-popover p-4 shadow-xl">
                  <div className="mb-3 flex items-center justify-between border-b border-foreground/5 pb-2">
                    <span className="text-xs font-semibold">Giỏ hàng ({totalItems})</span>
                    <Link
                      to="/cart"
                      className="text-xs text-primary hover:underline"
                      onClick={() => setMiniCartOpen(false)}
                    >
                      Xem tất cả
                    </Link>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-3">
                    {detailed.map((d) => {
                      const v = d.product.variants[d.item.variantIndex];
                      return (
                        <div key={d.product.id + d.item.variantIndex} className="flex gap-3">
                          <ProductImage
                            seed={d.product.anhDaiDien || d.product.images[0]}
                            label={d.product.name}
                            className="size-14 shrink-0 rounded-lg"
                            iconClassName="size-6"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-semibold">{d.product.name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {d.product.id.startsWith("acc_")
                                ? d.product.display || "Phụ kiện"
                                : `${v.ram}GB · ${v.ssd}GB`}{" "}
                              · x{d.item.quantity}
                            </div>
                            <div className="text-xs text-[#dc2626] font-semibold">
                              {formatVND(d.lineTotal)}
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(d.product.id, d.item.variantIndex)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label="Xóa"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 border-t border-foreground/5 pt-3">
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tổng</span>
                      <span className="text-[#dc2626] font-bold">{formatVND(totalPrice)}</span>
                    </div>
                    <Link to="/cart">
                      <Button className="w-full" size="sm">
                        Xem giỏ hàng
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-muted md:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Search & Menu */}
        {mobileOpen && (
          <div className="border-t border-foreground/5 bg-background md:hidden">
            <div className="mx-auto max-w-7xl space-y-4 px-4 py-4">
              <form
                onSubmit={onSearch}
                className="flex h-10 items-center rounded-full bg-muted px-3"
              >
                <Search className="size-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  placeholder="Tìm kiếm sản phẩm theo tên, cấu hình..."
                  className="ml-2 w-full bg-transparent text-sm outline-none"
                />
              </form>
              <nav className="space-y-1">
                <Link
                  to="/products"
                  activeProps={{
                    className: "bg-red-600 text-white font-semibold shadow-sm shadow-red-600/10",
                  }}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-muted hover:text-red-600"
                >
                  Sản phẩm
                </Link>
                <Link
                  to="/accessories"
                  activeProps={{
                    className: "bg-red-600 text-white font-semibold shadow-sm shadow-red-600/10",
                  }}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-muted hover:text-red-600"
                >
                  Phụ kiện
                </Link>
                <Link
                  to="/compare"
                  activeProps={{
                    className: "bg-red-600 text-white font-semibold shadow-sm shadow-red-600/10",
                  }}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-muted hover:text-red-600"
                >
                  So sánh
                </Link>
                {isLoggedIn ? (
                  <div className="flex items-center justify-between px-3 py-2">
                    <Link
                      to={isAdminUser ? "/admin" : "/account"}
                      className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-red-600"
                    >
                      {isAdminUser ? "Kênh quản trị (Admin)" : `Tài khoản: ${authUser?.hoTen || ""}`}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        toast.success("Đã đăng xuất thành công!");
                        navigate({ to: "/" });
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                    >
                      <LogOut className="size-3.5" /> Đăng xuất
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium">
                    <Link
                      to="/register"
                      className="text-slate-700 transition-colors hover:text-emerald-500 dark:text-slate-200"
                    >
                      Đăng ký
                    </Link>
                    <span className="text-muted-foreground/40">|</span>
                    <Link
                      to="/login"
                      className="text-slate-700 transition-colors hover:text-emerald-500 dark:text-slate-200"
                    >
                      Đăng nhập
                    </Link>
                  </div>
                )}
              </nav>
              <div>
                <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Thương hiệu
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {brands.map((b) => (
                    <Link
                      key={b}
                      to="/products"
                      search={{ brand: b }}
                      className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
                    >
                      {b}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
