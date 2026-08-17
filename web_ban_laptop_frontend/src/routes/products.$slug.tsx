import { useState, type ReactNode } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Star,
  Award,
  ShieldCheck,
  Truck,
  CreditCard,
  GitCompareArrows,
  ShoppingCart,
  Check,
  X,
  Loader2,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getProductBySlug, getProductById, variantPrice, variantOriginalPrice, type Product } from "@/lib/products";
import {
  fetchProductById,
  fetchPhuKienById,
  mapPhuKienToProduct,
  fetchProductReviews,
  fetchRelatedProducts,
  fetchProductDetail,
  submitProductReview,
} from "@/lib/laptop-api";
import { RelatedProductsCarousel } from "@/components/RelatedProductsCarousel";
import { useCart } from "@/lib/cart-store";
import { requireAuthForAddToCart, requireAuthForBuyNow } from "@/lib/require-auth-shopping";
import { formatVND, formatVNDAmount } from "@/lib/format";
import { ProductImage } from "@/components/ProductImage";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }) => {
    const slug = params.slug;

    // 1. Nếu slug chứa -pk hoặc pk hoặc acc_ (phụ kiện)
    if (slug.includes("-pk") || slug.includes("acc_") || /^pk/i.test(slug)) {
      const pkId = (slug.match(/(?:pk|acc_?)(\d+)/i) || slug.match(/(\d+)/))?.[1];
      if (pkId) {
        try {
          const pkData = await fetchPhuKienById(pkId);
          if (pkData) return { product: mapPhuKienToProduct(pkData) };
        } catch (err) {
          console.warn(`Lỗi khi gọi API chi tiết phụ kiện cho slug ${slug}:`, err);
        }
      }
    }

    // 2. Trích xuất ID số từ bất kỳ slug nào
    const numericMatch = slug.match(/-(\d+)$/) || slug.match(/(\d+)/);
    const productId = numericMatch ? numericMatch[1] : null;

    if (productId) {
      try {
        const product = await fetchProductById(productId);
        if (product) return { product };
      } catch (err) {
        console.warn(`Lỗi khi gọi API chi tiết sản phẩm cho slug ${slug}:`, err);
      }
    }

    // 3. Fallback lấy theo slug tĩnh trong mock data
    const product = getProductBySlug(slug);
    if (product) return { product };

    throw notFound();
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
        { title: `${loaderData.product.name} — Laptop Center` },
        { name: "description", content: loaderData.product.description },
        { property: "og:title", content: loaderData.product.name },
        { property: "og:description", content: loaderData.product.description },
      ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="px-4 py-20 text-center">
      <h2 className="text-2xl font-bold">Không tìm thấy sản phẩm</h2>
      <Link to="/products" className="mt-4 inline-block text-primary hover:underline">
        Quay lại danh sách
      </Link>
    </div>
  ),
  component: ProductDetail,
});

function formatSpecValue(value?: string | null, fallback = "Đang cập nhật"): string {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function getFormattedRam(selectedRam: number, baseRamStr?: string | null): string {
  const baseStr = baseRamStr?.trim();
  if (!baseStr) {
    return `${selectedRam}GB DDR5`;
  }

  const ramReg = /^(\d+)\s*GB/i;
  const match = baseStr.match(ramReg);
  if (match) {
    const originalGb = parseInt(match[1], 10);
    if (originalGb === selectedRam) {
      return baseStr;
    }

    let rest = baseStr.slice(match[0].length).trim();

    let channelDetail = "";
    if (selectedRam === 8) {
      channelDetail = " (1x8GB)";
    } else if (selectedRam === 16) {
      channelDetail = " (2x8GB)";
    } else if (selectedRam === 32) {
      channelDetail = " (2x16GB)";
    } else if (selectedRam === 64) {
      channelDetail = " (2x32GB)";
    }

    // Xóa chi tiết kênh cũ nếu có ở ngay sau dung lượng
    rest = rest.replace(/^\s*\([^)]*\)/g, "").trim();

    return `${selectedRam}GB${channelDetail} ${rest}`.trim();
  }

  return `${selectedRam}GB ${baseStr}`;
}

function getFormattedSsd(selectedSsd: number, baseSsdStr?: string | null): string {
  const baseStr = baseSsdStr?.trim();
  const selectedSsdText = selectedSsd >= 1024 ? `${selectedSsd / 1024}TB` : `${selectedSsd}GB`;

  if (!baseStr) {
    return `${selectedSsdText} SSD M.2 PCIe Gen 4.0`;
  }

  const ssdReg = /^(\d+)\s*(GB|TB)/i;
  const match = baseStr.match(ssdReg);
  if (match) {
    const originalVal = parseInt(match[1], 10);
    const originalUnit = match[2].toUpperCase();
    const originalSsd = originalUnit === "TB" ? originalVal * 1024 : originalVal;

    if (originalSsd === selectedSsd) {
      return baseStr;
    }

    const rest = baseStr.slice(match[0].length).trim();
    return `${selectedSsdText} ${rest}`.trim();
  }

  return `${selectedSsdText} ${baseStr}`;
}

function ConfigOptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative min-w-[4.5rem] rounded-md border px-5 py-2.5 text-sm font-semibold transition-all ${active
        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
        }`}
    >
      {active && (
        <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-blue-600 text-white shadow">
          <Check className="size-2.5" strokeWidth={3} aria-hidden />
        </span>
      )}
      {children}
    </button>
  );
}

function ProductDetail() {
  const data = Route.useLoaderData() as { product: Product };
  const product = data.product;
  const navigate = useNavigate();
  const [variantIndex, setVariantIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const { isLoggedIn } = useAuth();
  const [userRating, setUserRating] = useState(5);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để đánh giá");
      return;
    }
    if (!commentContent.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitProductReview({
        maSanPham: Number(product.id),
        soSao: userRating,
        noiDung: commentContent.trim(),
      });
      toast.success("Đã gửi đánh giá thành công!");
      setCommentContent("");
      setUserRating(5);
      setShowReviewForm(false);
      refetchReviews();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Gửi đánh giá thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const add = useCart((s) => s.add);
  const toggleCompare = useCart((s) => s.toggleCompare);
  const compareIds = useCart((s) => s.compareIds);
  const inCompare = compareIds.includes(product.id);

  const unitPrice = variantPrice(product, variantIndex);
  const totalPrice = unitPrice * qty;
  const currentVariant = product.variants[variantIndex];

  const isAcc = product.maDanhMuc !== undefined && product.maDanhMuc > 7;

  const { data: detail } = useQuery({
    queryKey: ["product-detail", product.id, isAcc],
    queryFn: () => fetchProductDetail(product.id, isAcc),
    enabled: !!product.id,
  });

  // 2 State mới ở tầng Frontend để theo dõi cấu hình đang được người dùng nhấn chọn:
  // - selectedRam: mặc định ban đầu lấy từ product.ram của database.
  // - selectedSsd: mặc định ban đầu lấy từ product.oCung (hoặc trường tương đương) của database.
  const [selectedRam, setSelectedRam] = useState<string>(
    product.ram ?? `${currentVariant?.ram ?? 8}GB`,
  );
  const [selectedSsd, setSelectedSsd] = useState<string>(
    product.oCung ?? product.storage ?? `${currentVariant?.ssd ?? 512}GB`,
  );

  const {
    data: reviews = [],
    isLoading: reviewsLoading,
    isError: reviewsError,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ["product-reviews", product.id],
    queryFn: ({ signal }) => fetchProductReviews(product.id, signal),
    staleTime: 60_000,
    retry: 1,
  });

  const productIdNum = Number(product.id);
  const canFetchRelated = true;

  const {
    data: relatedProducts = [],
    isLoading: relatedLoading,
    isError: relatedError,
  } = useQuery({
    queryKey: ["related-products", product.id, product.brand],
    queryFn: ({ signal }) => fetchRelatedProducts(productIdNum || product.id, signal),
    enabled: !!product.id,
    staleTime: 120_000,
    retry: 1,
  });

  // Group variants by RAM and SSD
  const ramOptions = [...new Set(product.variants.map((v) => v.ram))].sort((a, b) => a - b);
  const ssdOptions = [...new Set(product.variants.map((v) => v.ssd))].sort((a, b) => a - b);

  const selectRam = (ram: number) => {
    // try to keep same SSD if available
    const idx =
      product.variants.findIndex((v) => v.ram === ram && v.ssd === currentVariant.ssd) ??
      product.variants.findIndex((v) => v.ram === ram);
    if (idx >= 0) {
      setVariantIndex(idx);
      setSelectedRam(getFormattedRam(ram, product.ram));
    }
  };
  const selectSsd = (ssd: number) => {
    const idx =
      product.variants.findIndex((v) => v.ssd === ssd && v.ram === currentVariant.ram) ??
      product.variants.findIndex((v) => v.ssd === ssd);
    if (idx >= 0) {
      setVariantIndex(idx);
      setSelectedSsd(getFormattedSsd(ssd, product.oCung ?? product.storage));
    }
  };

  const onAdd = () => {
    if (!requireAuthForAddToCart(navigate)) return;
    add(product.id, variantIndex, qty);
    toast.success("Đã thêm vào giỏ hàng");
  };

  const onBuyNow = () => {
    if (!requireAuthForBuyNow(navigate)) return;
    add(product.id, variantIndex, qty);
    navigate({ to: "/cart" });
  };

  const onCompare = () => {
    if (!inCompare && compareIds.length >= 3) {
      toast.error("Tối đa 3 sản phẩm");
      return;
    }
    toggleCompare(product.id);
    toast.success(inCompare ? "Đã bỏ khỏi so sánh" : "Đã thêm vào so sánh");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-20 text-gray-900 dark:text-gray-100">
      {/* Breadcrumb chuẩn DATN */}
      <nav className="mb-4 text-xs text-slate-500 flex items-center gap-1.5">
        <Link to="/" className="hover:text-red-600 transition">
          Trang chủ
        </Link>
        <span className="text-slate-400 font-light">&gt;</span>
        <Link to="/products" className="hover:text-red-600 transition">
          Sản phẩm
        </Link>
        <span className="text-slate-400 font-light">&gt;</span>
        <span className="text-red-600 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Product Title Top Left chuẩn DATN */}
      <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">
        {product.name}
      </h1>

      {/* Main 2-Column Grid (Left: Gallery (~7 cols), Right: Config + Offers (~5 cols)) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
        {/* LEFT COLUMN: Gallery */}
        <div className="lg:col-span-7 space-y-6">
          {(() => {
            const allImages = Array.from(
              new Set(
                (isAcc
                  ? [product.anhDaiDien || (product.images && product.images[0])].filter(Boolean)
                  : (product.images && product.images.length > 0
                    ? product.images
                    : [product.anhDaiDien]
                  ).filter(Boolean)
                ) as string[]
              )
            );
            const currentImg = selectedImage || product.anhDaiDien || allImages[0] || "";
            const currentIdx = allImages.findIndex((img) => img === currentImg);
            const safeIdx = currentIdx >= 0 ? currentIdx : 0;

            const handlePrev = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (allImages.length <= 1) return;
              const prevIdx = (safeIdx - 1 + allImages.length) % allImages.length;
              setSelectedImage(allImages[prevIdx]);
            };

            const handleNext = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (allImages.length <= 1) return;
              const nextIdx = (safeIdx + 1) % allImages.length;
              setSelectedImage(allImages[nextIdx]);
            };

            return (
              <>
                {/* Main Large Image Preview Box */}
                <div className="relative aspect-[4/3] w-full bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 flex items-center justify-center group shadow-sm p-4">
                  <ProductImage
                    seed={currentImg}
                    label={product.name}
                    className="w-full h-full flex items-center justify-center"
                    iconClassName="size-32 text-gray-400"
                    imgClassName="max-h-full max-w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Nút lướt ảnh Trái / Phải chuẩn giống ảnh mẫu của người dùng */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center shadow-lg backdrop-blur-xs transition-all duration-200 z-10 cursor-pointer"
                        aria-label="Ảnh trước"
                      >
                        <ChevronLeft className="size-6" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center shadow-lg backdrop-blur-xs transition-all duration-200 z-10 cursor-pointer"
                        aria-label="Ảnh tiếp theo"
                      >
                        <ChevronRight className="size-6" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip Gallery (Hình ảnh các góc máy khác nhau — Tràn viền sắc nét) */}
                <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl border-2 overflow-hidden transition cursor-pointer flex items-center justify-center ${currentImg === img
                          ? "border-red-600 ring-2 ring-red-600/30"
                          : "border-gray-200 dark:border-slate-700 hover:border-gray-400 opacity-80 hover:opacity-100"
                        }`}
                    >
                      <ProductImage
                        seed={img}
                        label={product.name}
                        className="w-full h-full flex items-center justify-center"
                        iconClassName="size-6 text-gray-400"
                        imgClassName="w-full h-full object-cover object-center"
                      />
                    </button>
                  ))}
                </div>
              </>
            );
          })()}

          {/* THÔNG SỐ KỸ THUẬT Table chuẩn DATN */}
          <div className="mt-8 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
            {/* Table Header Banner */}
            <div className="bg-red-600 text-white py-2.5 px-4 text-center font-extrabold text-sm uppercase tracking-wide">
              THÔNG SỐ KỸ THUẬT
            </div>

            {/* Table Content */}
            <div className="divide-y divide-gray-200 dark:divide-slate-700 text-xs sm:text-sm">
              {(isAcc
                ? [
                  ["Mã sản phẩm / Model", product.name],
                  ["Loại phụ kiện", formatSpecValue(detail?.loaiPhuKien)],
                  ["Thương hiệu", formatSpecValue(detail?.thuongHieuPhuKien || product.brand)],
                  ["Thông số kỹ thuật", formatSpecValue(detail?.thongSoKyThuat)],
                  ["Bảo hành", formatSpecValue(detail?.baoHanh || product.warranty)],
                ]
                : [
                  ["Mã sản phẩm / Model", product.name],
                  ["Bộ vi xử lý / CPU", formatSpecValue(product.cpu)],
                  ["Bộ nhớ trong / RAM", formatSpecValue(product.ram)],
                  ["Ổ cứng / SSD", formatSpecValue(product.oCung ?? product.storage)],
                  ["Màn hình / LCD", formatSpecValue(product.manHinh ?? product.display)],
                  ["Card đồ họa / VGA", formatSpecValue(product.gpu)],
                  ["Dung lượng Pin", formatSpecValue(product.pin ?? product.battery)],
                  ["Hệ điều hành", formatSpecValue(product.heDieuHanh)],
                ]
              ).map(([label, value], idx) => (
                <div
                  key={label}
                  className={`grid grid-cols-12 p-3 sm:p-3.5 transition-colors ${idx % 2 === 0
                    ? "bg-gray-50/80 dark:bg-slate-900/60"
                    : "bg-white dark:bg-slate-800"
                    }`}
                >
                  <div className="col-span-4 sm:col-span-3 font-bold text-gray-800 dark:text-gray-200">
                    {label}
                  </div>
                  <div className="col-span-8 sm:col-span-9 text-gray-700 dark:text-gray-300 font-medium leading-relaxed whitespace-pre-line">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Price, Config Variants, Ưu Đãi Đặc Quyền, Buy Buttons */}
        <div className="lg:col-span-5 space-y-5">
          {/* Brand + Rating */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-red-600 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-md border border-red-200 dark:border-red-900">
              Thương hiệu: {product.brand}
            </span>
            <div className="flex items-center gap-1 text-xs">
              <Star
                className={`size-4 ${reviews.length > 0 || (product.rating && product.rating > 0)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-none text-gray-300"
                  }`}
              />
              <span className="font-bold text-gray-800 dark:text-gray-200">
                {reviews.length > 0
                  ? (reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1)
                  : product.rating && product.rating > 0
                    ? product.rating.toFixed(1)
                    : "Chưa có"}
              </span>
              <span className="text-gray-400">({reviews.length} đánh giá)</span>
            </div>
          </div>

          {/* Price Block chuẩn DATN */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-red-600 tracking-tight">
                {formatVNDAmount(totalPrice)}đ
              </span>
              {(product.phanTramGiam && product.phanTramGiam > 0) || (product.originalPrice || product.basePrice) > unitPrice ? (
                <span className="text-sm font-medium text-slate-400 line-through">
                  {formatVNDAmount(variantOriginalPrice(product, variantIndex) * qty)}đ
                </span>
              ) : null}
            </div>

            {product.phanTramGiam && product.phanTramGiam > 0 ? (
              <span className="rounded-full bg-red-600 px-3 py-0.5 text-xs font-bold text-white shadow-sm">
                -{product.phanTramGiam}%
              </span>
            ) : null}
          </div>

          {/* Ưu đãi đặc quyền Box chuẩn DATN */}
          <div className="border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-slate-800/40 shadow-xs">
            <div className="bg-red-600 text-white py-2 px-4 text-xs font-bold uppercase tracking-wider">
              Ưu đãi đặc quyền
            </div>
            <div className="p-3.5 space-y-2 text-xs text-gray-700 dark:text-gray-200">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>Hàng xách tay đạt <strong className="font-semibold underline">tiêu chuẩn ĐỘ BỀN 5 sao</strong> tại Hoa Kỳ.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>Giảm <strong className="text-red-600">190,000đ</strong> cho học sinh, sinh viên khi mang thẻ.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>Tặng học sinh, sinh viên Gói setup ứng dụng 12 tháng.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <span>Ưu đãi giảm 10% giá <strong className="text-red-600 font-semibold">phụ kiện</strong> chính hãng.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  5
                </span>
                <span>Miễn phí 100% phí Dịch vụ nâng cấp.</span>
              </div>
            </div>
          </div>

          {/* Bộ sản phẩm gồm & Bảo hành Info Box chuẩn DATN */}
          <div className="bg-slate-100/80 dark:bg-slate-800 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <Truck className="w-4 h-4 text-red-600 shrink-0" />
              <span><strong>Bộ sản phẩm gồm:</strong> Dây nguồn, Thùng máy, Sạc Laptop</span>
            </div>
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
              <span><strong>Bảo hành:</strong> {product.warranty || "12 tháng theo tiêu chuẩn nhà sản xuất"}</span>
            </div>
          </div>

          {/* Action Buttons chuẩn DATN */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={onBuyNow}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-base sm:text-lg rounded-xl uppercase shadow-md shadow-red-600/20 hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center tracking-wider"
            >
              MUA NGAY
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onAdd}
                className="py-3 border-2 border-red-600 text-red-600 font-bold text-xs rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShoppingCart className="size-4" /> THÊM VÀO GIỎ
              </button>
              <button
                type="button"
                onClick={onCompare}
                className="py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <GitCompareArrows className="size-4" /> SO SÁNH
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section bên dưới: Mô tả (nếu có) + Đánh giá */}
      <div className="mt-12 space-y-12">
        {/* Mô tả sản phẩm (chỉ hiển thị khi có dữ liệu từ database) */}
        {(() => {
          const desc = (product.description && product.description.trim()) || (detail?.moTa && String(detail.moTa).trim()) || "";
          return desc ? (
            <div className="border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
              <div className="bg-slate-100 dark:bg-slate-700/60 py-3 px-5 font-extrabold text-sm text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-200 dark:border-slate-700">
                Mô Tả Sản Phẩm
              </div>
              <div className="p-5 sm:p-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-line font-normal text-justify">
                {desc}
              </div>
            </div>
          ) : null;
        })()}

        {/* Đánh giá sản phẩm - Thiết kế hiện đại gọn gàng chuẩn e-commerce */}
        <div className="border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
          {/* Header Banner */}
          <div className="bg-slate-100 dark:bg-slate-700/60 py-3 px-5 font-extrabold text-sm text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <span>ĐÁNH GIÁ SẢN PHẨM ({reviews.length})</span>
            {reviews.length > 0 && (
              <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                {(reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1)} / 5.0
              </span>
            )}
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Top Score Box & Write Review Trigger */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                    {reviews.length > 0
                      ? (reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1)
                      : "0.0"}
                  </div>
                  <div className="flex gap-0.5 mt-1 justify-center">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const avg = reviews.length > 0
                        ? reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length
                        : 0;
                      return (
                        <Star
                          key={i}
                          className={`size-3.5 ${i < Math.round(avg)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-none text-gray-300"
                            }`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">
                    {reviews.length} nhận xét
                  </p>
                </div>

                <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {reviews.length > 0 ? "Khách hàng hài lòng" : "Chưa có nhận xét nào"}
                  </p>
                  <p className="mt-0.5 text-[11px]">
                    {reviews.length > 0
                      ? "Đánh giá từ khách hàng đã trải nghiệm sản phẩm"
                      : "Hãy là người đầu tiên chia sẻ cảm nhận về sản phẩm này"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isLoggedIn) {
                    toast.error("Vui lòng đăng nhập để đánh giá");
                    return;
                  }
                  setShowReviewForm((prev) => !prev);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                {showReviewForm ? "Đóng form đánh giá" : "✍️ Viết đánh giá ngay"}
              </button>
            </div>

            {/* Form viết đánh giá (Ẩn/Hiện mượt mà) */}
            {showReviewForm && (
              <form
                onSubmit={handleReviewSubmit}
                className="p-4 sm:p-5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/20 space-y-4 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="text-xs font-bold uppercase text-gray-800 dark:text-gray-200">
                    Đánh giá của bạn:
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          className="focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                        >
                          <Star
                            className={`size-6 ${star <= userRating
                              ? "fill-amber-400 text-amber-400"
                              : "fill-none text-gray-300"
                              }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-red-600 min-w-[70px]">
                      {userRating === 5 && "Rất tốt ⭐⭐⭐⭐⭐"}
                      {userRating === 4 && "Hài lòng ⭐⭐⭐⭐"}
                      {userRating === 3 && "Bình thường ⭐⭐⭐"}
                      {userRating === 2 && "Không thích ⭐⭐"}
                      {userRating === 1 && "Rất tệ ⭐"}
                    </span>
                  </div>
                </div>

                <div>
                  <textarea
                    rows={3}
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Mời bạn chia sẻ cảm nhận về sản phẩm (ví dụ: máy chạy mượt, mỏng nhẹ, thiết kế đẹp)..."
                    className="w-full text-xs sm:text-sm p-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600/30 focus:border-red-600 transition-all placeholder:text-gray-400"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      "GỬI ĐÁNH GIÁ"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Danh sách các bài đánh giá */}
            <div className="space-y-3">
              {reviewsLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
                  <Loader2 className="size-4 animate-spin text-red-600" />
                  Đang tải danh sách đánh giá…
                </div>
              ) : reviewsError ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  Không tải được danh sách đánh giá.
                </p>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
                  <Star className="size-8 mx-auto text-slate-300 fill-none mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Chưa có nhận xét nào cho sản phẩm này.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hãy là người đầu tiên chia sẻ cảm nhận sử dụng sản phẩm!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          {r.avatar && r.avatar.trim() !== "" ? (
                            <img
                              src={r.avatar}
                              alt={r.name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center text-xs">
                              {r.name ? r.name.charAt(0).toUpperCase() : "U"}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                              <span>{r.name}</span>
                              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-semibold">
                                ✓ Đã mua hàng
                              </span>
                            </div>
                            <div className="flex gap-0.5 mt-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`size-3 ${i < r.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-none text-gray-300"
                                    }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {r.date && (
                          <span className="text-[10px] text-gray-400">
                            {new Date(r.date).toLocaleDateString("vi-VN")}
                          </span>
                        )}
                      </div>

                      {r.comment && (
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed pl-10">
                          {r.comment}
                        </p>
                      )}

                      {r.phanHoiCuaAdmin && (
                        <div className="ml-10 p-3 bg-red-50/60 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg text-xs space-y-1">
                          <div className="font-bold text-red-600 flex items-center gap-1.5">
                            <ShieldCheck className="size-3.5" /> Quản trị viên phản hồi:
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {r.phanHoiCuaAdmin}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sản phẩm liên quan — carousel ngang */}
      {canFetchRelated && (relatedLoading || relatedProducts.length > 0) && (
        <section className="mt-16 pt-4" aria-labelledby="related-products-heading">
          {relatedError ? (
            <>
              <h2
                id="related-products-heading"
                className="text-lg font-bold text-gray-900 md:text-xl"
              >
                SẢN PHẨM LIÊN QUAN
              </h2>
              <div className="mt-2.5 mb-6 h-px w-full rounded-full bg-black dark:bg-white" aria-hidden />
              <p className="text-sm text-muted-foreground">Không tải được sản phẩm liên quan.</p>
            </>
          ) : (
            <RelatedProductsCarousel
              products={relatedProducts}
              isLoading={relatedLoading}
              titleId="related-products-heading"
            />
          )}
        </section>
      )}    </div>
  );
}
