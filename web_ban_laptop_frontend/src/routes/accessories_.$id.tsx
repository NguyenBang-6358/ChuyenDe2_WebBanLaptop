import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Star,
  ShieldCheck,
  Truck,
  CreditCard,
  ShoppingCart,
  Loader2,
  Award,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  GitCompareArrows,
} from "lucide-react";
import {
  fetchPhuKienById,
  fetchPhuKienReviews,
  fetchRelatedAccessories,
  submitAccessoryReview,
  type ApiPhuKien,
} from "@/lib/laptop-api";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { AccessoryCard } from "@/components/AccessoryCard";
import { requireAuthForAddToCart, requireAuthForBuyNow } from "@/lib/require-auth-shopping";
import { formatVND, formatVNDAmount } from "@/lib/format";
import { ProductImage } from "@/components/ProductImage";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { addToCartApi } from "@/lib/laptop-api";
import { useCart } from "@/lib/cart-store";
import { getSpecsForCategory } from "@/components/AccessoryCard";

export const Route = createFileRoute("/accessories_/$id")({
  loader: async ({ params }) => {
    const numericId = String(params.id).replace(/\D+/g, "");
    const targetId = numericId || params.id;
    try {
      const product = await fetchPhuKienById(targetId);
      if (product) return { product };
    } catch (err) {
      console.warn(`Lỗi khi gọi API chi tiết phụ kiện cho id ${params.id}:`, err);
    }
    throw notFound();
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
        { title: `${loaderData.product.tenPhuKien} — Laptop Center` },
        { name: "description", content: loaderData.product.moTa || "" },
      ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="px-4 py-20 text-center">
      <h2 className="text-2xl font-bold">Không tìm thấy phụ kiện</h2>
      <Link to="/accessories" className="mt-4 inline-block text-primary hover:underline">
        Quay lại danh sách
      </Link>
    </div>
  ),
  component: AccessoryDetail,
});

function formatSpecValue(val?: string | null) {
  if (!val || val.trim() === "") return "Đang cập nhật";
  return val.trim();
}

function AccessoryDetail() {
  const { product } = Route.useLoaderData();
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { isLoggedIn, user } = useAuth();

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
      await submitAccessoryReview({
        maPhuKien: Number(product.maPhuKien),
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

  const unitPrice =
    product.giaKhuyenMai !== null && product.giaKhuyenMai !== undefined
      ? Number(product.giaKhuyenMai)
      : Number(product.gia) || 0;
  const originalUnitPrice = Number(product.gia) || 0;
  const totalPrice = unitPrice * qty;
  const inStock = Number(product.soLuongTon) || 0;

  const {
    data: reviews = [],
    isLoading: reviewsLoading,
    isError: reviewsError,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ["phukien-reviews", product.maPhuKien],
    queryFn: ({ signal }) => fetchPhuKienReviews(product.maPhuKien, signal),
    staleTime: 60_000,
    retry: 1,
  });

  const {
    data: relatedAccessories = [],
    isLoading: relatedLoading,
    isError: relatedError,
  } = useQuery({
    queryKey: ["related-accessories", product.maPhuKien],
    queryFn: ({ signal }) => fetchRelatedAccessories(product.maPhuKien, signal),
    staleTime: 120_000,
    retry: 1,
  });

  const onAdd = async () => {
    if (!requireAuthForAddToCart(navigate)) return;
    if (!user) return;
    try {
      await addToCartApi(user.maNguoiDung, null, product.maPhuKien, qty);
      await useCart.getState().syncFromBackend();
      toast.success("Đã thêm vào giỏ hàng");
    } catch (err: any) {
      toast.error(`Không thể thêm vào giỏ hàng! Chi tiết: ${err.message}`);
    }
  };

  const onBuyNow = async () => {
    if (!requireAuthForBuyNow(navigate)) return;
    if (!user) return;
    try {
      await addToCartApi(user.maNguoiDung, null, product.maPhuKien, qty);
      await useCart.getState().syncFromBackend();
      navigate({ to: "/cart" });
    } catch (err: any) {
      toast.error(`Không thể thêm vào giỏ hàng! Chi tiết: ${err.message}`);
    }
  };

  const totalReviews = product.soLuongDanhGia ?? 0;
  const avgRating = product.diemDanhGiaTrungBinh ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-20 text-gray-900 dark:text-gray-100">
      {/* Breadcrumb chuẩn DATN */}
      <nav className="mb-4 text-xs text-slate-500 flex items-center gap-1.5">
        <Link to="/" className="hover:text-red-600 transition">
          Trang chủ
        </Link>
        <span className="text-slate-400 font-light">&gt;</span>
        <Link to="/accessories" className="hover:text-red-600 transition">
          Phụ kiện
        </Link>
        <span className="text-slate-400 font-light">&gt;</span>
        <span className="text-red-600 font-medium truncate max-w-xs">{product.tenPhuKien}</span>
      </nav>

      {/* Product Title Top Left chuẩn DATN */}
      <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">
        {product.tenPhuKien}
      </h1>

      {/* Main 2-Column Grid (Left: Gallery (~7 cols), Right: Config + Offers (~5 cols)) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
        {/* LEFT COLUMN: Gallery & Technical Specs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Large Image Preview Box */}
          <div className="relative aspect-[4/3] w-full bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 flex items-center justify-center group shadow-sm p-6">
            <img
              src={selectedImage || product.anhDaiDien || ""}
              alt={product.tenPhuKien}
              className="max-h-full max-w-full object-contain object-center mix-blend-multiply transition-all duration-300"
            />
          </div>

          {/* Thumbnail Strip Gallery */}
          <div className="flex items-center gap-2.5 overflow-x-auto py-1">
            {[product.anhDaiDien].filter(Boolean).map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(img || null)}
                className={`w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl border-2 bg-white dark:bg-slate-800 transition cursor-pointer overflow-hidden p-1 flex items-center justify-center ${(selectedImage || product.anhDaiDien) === img
                    ? "border-red-600 ring-2 ring-red-600/20"
                    : "border-gray-200 dark:border-slate-700 hover:border-gray-400"
                  }`}
              >
                <img
                  src={img!}
                  alt="Thumbnail"
                  className="max-h-full max-w-full object-contain object-center mix-blend-multiply"
                />
              </button>
            ))}
          </div>

          {/* THÔNG SỐ KỸ THUẬT Table chuẩn DATN */}
          <div className="mt-8 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
            <div className="bg-red-600 text-white py-2.5 px-4 text-center font-extrabold text-sm uppercase tracking-wide">
              THÔNG SỐ KỸ THUẬT
            </div>
            <div className="divide-y divide-gray-200 dark:divide-slate-700 text-xs sm:text-sm">
              {(() => {
                const categorySpecs = getSpecsForCategory(product.loaiPhuKien, product);
                const specRows = [
                  ["Tên sản phẩm", product.tenPhuKien],
                  ["Loại phụ kiện", formatSpecValue(product.loaiPhuKien)],
                  ["Thương hiệu", formatSpecValue(product.thuongHieu)],
                  ...categorySpecs.map((s) => [s.label, s.value]),
                  ["Bảo hành", formatSpecValue(product.baoHanh)],
                ];
                return specRows.map(([label, value], idx) => (
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
                ));
              })()}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Brand, Rating, Price, Offers, Buy Buttons */}
        <div className="lg:col-span-5 space-y-5">
          {/* Brand + Rating */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-red-600 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-md border border-red-200 dark:border-red-900">
              THƯƠNG HIỆU: {product.thuongHieu || "CHÍNH HÃNG"}
            </span>
            <div className="flex items-center gap-1 text-xs">
              <Star
                className={`size-4 ${reviews.length > 0 || (product.diemDanhGiaTrungBinh && product.diemDanhGiaTrungBinh > 0)
                    ? "fill-amber-400 text-amber-400"
                    : "fill-none text-gray-300"
                  }`}
              />
              <span className="font-bold text-gray-800 dark:text-gray-200">
                {reviews.length > 0
                  ? (reviews.reduce((s: number, r: any) => s + (r.rating || 5), 0) / reviews.length).toFixed(1)
                  : product.diemDanhGiaTrungBinh && product.diemDanhGiaTrungBinh > 0
                    ? product.diemDanhGiaTrungBinh.toFixed(1)
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
              {product.phanTramGiam && product.phanTramGiam > 0 ? (
                <span className="text-sm font-medium text-slate-400 line-through">
                  {formatVNDAmount(originalUnitPrice * qty)}đ
                </span>
              ) : null}
            </div>

            {product.phanTramGiam && product.phanTramGiam > 0 ? (
              <span className="rounded-full bg-red-600 px-3 py-0.5 text-xs font-bold text-white shadow-sm">
                -{product.phanTramGiam}%
              </span>
            ) : null}
          </div>

          {/* DATN Box: ƯU ĐÃI ĐẶC QUYỀN (Phụ kiện) */}
          <div className="border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-slate-800/40 shadow-xs">
            <div className="bg-red-600 text-white py-2 px-4 text-xs font-bold uppercase tracking-wider">
              Ưu đãi đặc quyền
            </div>
            <div className="p-3.5 space-y-2 text-xs text-gray-700 dark:text-gray-200">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>Cam kết phụ kiện <strong className="font-semibold underline">chính hãng 100%</strong>, bảo hành 1 đổi 1.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>Giảm <strong className="text-red-600">10%</strong> cho học sinh, sinh viên khi mua kèm Laptop.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>Miễn phí dịch vụ kiểm tra & hỗ trợ kỹ thuật tận tâm.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <span>Ưu đãi giảm thêm <strong className="text-red-600 font-semibold">5%</strong> khi thanh toán qua mã QR / Chuyển khoản.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  5
                </span>
                <span>Giao hàng hỏa tốc trong 2h tại khu vực nội thành.</span>
              </div>
            </div>
          </div>

          {/* DATN Box: Bộ sản phẩm gồm & Bảo hành */}
          <div className="bg-slate-100/80 dark:bg-slate-800 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <Truck className="w-4 h-4 text-red-600 shrink-0" />
              <span><strong>Bộ sản phẩm gồm:</strong> Hộp sản phẩm, {product.tenPhuKien}, Sách hướng dẫn</span>
            </div>
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
              <span><strong>Bảo hành:</strong> {product.baoHanh || "12 tháng"} chính hãng</span>
            </div>
          </div>

          {/* Action Buttons chuẩn DATN */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={onBuyNow}
              disabled={inStock === 0}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-base sm:text-lg rounded-xl uppercase shadow-md shadow-red-600/20 hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              MUA NGAY
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onAdd}
                disabled={inStock === 0}
                className="py-3 border-2 border-red-600 text-red-600 font-bold text-xs rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="size-4" /> THÊM VÀO GIỎ
              </button>
              <button
                type="button"
                onClick={() => toast.info("Tính năng so sánh phụ kiện sắp ra mắt!")}
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
          const desc = product.moTa && typeof product.moTa === "string" ? product.moTa.trim() : "";
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
                {(reviews.reduce((s: number, r: any) => s + (r.rating || 5), 0) / reviews.length).toFixed(1)} / 5.0
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
                      ? (reviews.reduce((s: number, r: any) => s + (r.rating || 5), 0) / reviews.length).toFixed(1)
                      : "0.0"}
                  </div>
                  <div className="flex gap-0.5 mt-1 justify-center">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const avg = reviews.length > 0
                        ? reviews.reduce((s: number, r: any) => s + (r.rating || 5), 0) / reviews.length
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
                      : "Hãy là người đầu tiên chia sẻ cảm nhận về phụ kiện này"}
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
                    placeholder="Mời bạn chia sẻ cảm nhận về phụ kiện (ví dụ: dùng bền, chất lượng tốt, giá rẻ)..."
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
                    Chưa có nhận xét nào cho phụ kiện này.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Hãy là người đầu tiên chia sẻ cảm nhận sử dụng sản phẩm!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {reviews.map((r: any) => (
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

      {/* Phụ kiện liên quan — carousel ngang */}
      {(relatedLoading || relatedAccessories.length > 0) && (
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
            <RelatedAccessoriesCarousel
              accessories={relatedAccessories}
              isLoading={relatedLoading}
              titleId="related-products-heading"
            />
          )}
        </section>
      )}
    </div>
  );
}

function RelatedAccessoriesCarousel({
  accessories,
  isLoading,
  titleId = "related-accessories-heading",
}: {
  accessories: ApiPhuKien[];
  isLoading?: boolean;
  titleId?: string;
}) {
  if (isLoading) {
    return (
      <div>
        <RelatedSectionHeader titleId={titleId} />
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Đang tải sản phẩm liên quan…
        </div>
      </div>
    );
  }

  if (accessories.length === 0) return null;

  const showNav = accessories.length > 1;
  const navBtnClass =
    "top-1/2 z-20 size-11 -translate-y-1/2 rounded-full border-0 bg-gray-400/25 text-gray-700 shadow-sm backdrop-blur-[2px] hover:bg-gray-400/40 disabled:pointer-events-none disabled:opacity-0";

  return (
    <div>
      <RelatedSectionHeader titleId={titleId} />

      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
            containScroll: "trimSnaps",
          }}
          className="w-full"
        >
          {showNav && (
            <>
              <CarouselPrevious
                className={`${navBtnClass} left-1 md:left-2`}
                aria-label="Xem sản phẩm trước"
              >
                <ChevronLeft className="size-6" strokeWidth={2.5} />
              </CarouselPrevious>
              <CarouselNext
                className={`${navBtnClass} right-1 md:right-2`}
                aria-label="Xem sản phẩm tiếp theo"
              >
                <ChevronRight className="size-6" strokeWidth={2.5} />
              </CarouselNext>
            </>
          )}

          <CarouselContent className="-ml-4 py-1">
            {accessories.map((item) => (
              <CarouselItem
                key={item.maPhuKien}
                className="basis-[92%] pl-4 sm:basis-1/2 md:basis-[45%] lg:basis-1/4"
              >
                <AccessoryCard accessory={item} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
}

function RelatedSectionHeader({ titleId }: { titleId: string }) {
  return (
    <header className="mb-6">
      <h2 id={titleId} className="text-lg font-bold tracking-wide text-gray-900 md:text-xl">
        SẢN PHẨM LIÊN QUAN
      </h2>
      <div className="mt-2.5 h-px w-full rounded-full bg-black dark:bg-white" aria-hidden />
    </header>
  );
}
