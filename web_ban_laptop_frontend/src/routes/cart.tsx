import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Trash2, Loader2, LogIn, CheckCircle2, ShieldCheck, ShoppingCart } from "lucide-react";
import { useCart, computeDetailed, computeTotalPrice } from "@/lib/cart-store";
import { placeOrderApi, getCartApi, addToCartApi } from "@/lib/laptop-api";
import { useAuth } from "@/lib/auth-store";
import { formatVND, formatVNDAmount } from "@/lib/format";
import { ProductImage } from "@/components/ProductImage";
import { PaymentModal } from "@/components/PaymentModal";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Thanh toán — Laptop Center" },
      { name: "description", content: "Xem lại giỏ hàng và tiến hành đặt hàng." },
    ],
  }),
  component: CartPage,
});

type PaymentMethodType = "tien_mat" | "chuyen_khoan";

const PAYMENT_METHODS_DATA: {
  id: PaymentMethodType;
  name: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  detailText: string;
}[] = [
  {
    id: "tien_mat",
    name: "Thanh toán khi nhận hàng (COD)",
    icon: "💵",
    badge: "Phổ biến",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    description: "Thanh toán bằng tiền mặt trực tiếp cho nhân viên giao hàng khi nhận máy.",
    detailText: "Bạn được quyền kiểm tra hàng trước khi thanh toán tiền mặt cho shipper.",
  },
  {
    id: "chuyen_khoan",
    name: "Chuyển khoản Ngân hàng / Quét mã VietQR",
    icon: "🏦",
    badge: "Tiện lợi nhanh chóng",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    description: "Tự động tạo mã QR VietQR (MBBank, Vietcombank, Techcombank, BIDV...).",
    detailText: "Hệ thống tự động xác nhận tiền về trong 3 giây sau khi bạn quét mã QR.",
  },
];

function CartPage() {
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const updateQty = useCart((s) => s.updateQty);
  const remove = useCart((s) => s.remove);
  const clearCart = useCart((s) => s.clear);
  const user = useAuth((s) => s.user);
  const isLoggedIn = useAuth((s) => s.isLoggedIn);

  const detailed = useMemo(() => computeDetailed(items), [items]);
  const calculateTotal = () => computeTotalPrice(items);

  // Form states
  const [fullname, setFullname] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState(user?.soDienThoai || "");
  const [differentAddress, setDifferentAddress] = useState(false);
  const [note, setNote] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "shipping">("shipping");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("tien_mat");

  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State cho Modal thanh toán QR
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdOrderInfo, setCreatedOrderInfo] = useState<{ maDonHang: number; tongTien: number } | null>(null);

  useEffect(() => {
    if (user?.soDienThoai && !phone) {
      setPhone(user.soDienThoai);
    }
  }, [user]);

  const handleUpdateCart = () => {
    toast.success("Đã cập nhật giỏ hàng thành công!");
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoggedIn || !user?.maNguoiDung) {
      toast.error("Vui lòng đăng nhập tài khoản trước khi thực hiện đặt hàng!");
      navigate({ to: "/account", search: { mode: "login" } });
      return;
    }

    if (!fullname.trim() || !phone.trim()) {
      toast.error("Vui lòng nhập Họ tên và Số điện thoại nhận hàng!");
      return;
    }

    const cleanPhone = phone.trim();
    if (!/^(0|\+84)[0-9]{9,10}$/.test(cleanPhone)) {
      toast.error("Số điện thoại không hợp lệ (phải từ 10 số)!");
      return;
    }

    if (deliveryMethod === "shipping" && !address.trim()) {
      toast.error("Vui lòng nhập Địa chỉ giao hàng chi tiết!");
      return;
    }

    if (paymentMethod === "chuyen_khoan") {
      setShowPaymentModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await executeSaveOrder();
      setOrderSuccess(true);
      clearCart();
      toast.success("Đặt hàng thành công!");
    } catch (err: any) {
      console.error("Lỗi khi tạo đơn hàng:", err);
      toast.error(err.message || "Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeSaveOrder = async (): Promise<number | void> => {
    if (!user) return;
    const cleanPhone = phone.trim();

    // Đảm bảo giỏ hàng trên backend DB được nạp đầy đủ trước khi đặt hàng
    const currentBackendItems = await getCartApi(user.maNguoiDung).catch(() => []);
    if (!currentBackendItems || currentBackendItems.length === 0) {
      for (const item of items) {
        const isAccessory = item.productId.startsWith("acc_");
        const rawId = isAccessory ? Number(item.productId.replace("acc_", "")) : Number(item.productId);
        if (!isNaN(rawId)) {
          const maSanPham = isAccessory ? null : rawId;
          const maPhuKien = isAccessory ? rawId : null;
          await addToCartApi(user.maNguoiDung, maSanPham, maPhuKien, item.quantity).catch((err: any) => {
            console.error("Lỗi nạp sản phẩm lên backend trước khi đặt hàng:", err);
          });
        }
      }
    }

    const fullAddressString = deliveryMethod === "pickup"
      ? "Giữ hàng tại cửa hàng: 617 Đường 3 tháng 2, Phường 8, Quận 10, TP. Hồ Chí Minh"
      : [address.trim(), city.trim()].filter(Boolean).join(", ");

    const chiTietGioHangPayload = items.map((item) => {
      const isAccessory = item.productId.startsWith("acc_");
      const rawId = isAccessory ? Number(item.productId.replace("acc_", "")) : Number(item.productId);
      return {
        maSanPham: isAccessory ? null : rawId,
        maPhuKien: isAccessory ? rawId : null,
        soLuong: item.quantity,
      };
    });

    const res = await placeOrderApi({
      maNguoiDung: user.maNguoiDung,
      hoTen: fullname.trim(),
      soDienThoai: cleanPhone,
      diaChiGiaoHang: fullAddressString,
      phuongThucThanhToan: paymentMethod,
      chiTietGioHang: chiTietGioHangPayload,
    });

    return res.maDonHang;
  };

  // 1. TRẠNG THÁI ĐẶT HÀNG THÀNH CÔNG (Order Success Screen)
  if (orderSuccess) {
    return (
      <div className="bg-[#f2f2f2] dark:bg-slate-900 min-h-screen py-16 px-4">
        <div className="max-w-lg mx-auto bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto font-bold text-2xl">
            ✓
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Cảm ơn bạn đã đặt hàng!</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Đơn hàng của bạn đã được ghi nhận thành công trên hệ thống Laptop Center. Nhân viên hỗ trợ sẽ sớm liên hệ qua số điện thoại <strong className="text-red-600">{phone}</strong> để xác nhận và giao hàng.
          </p>
          <div className="pt-4">
            <Link
              to="/products"
              className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm px-6 py-3 rounded-xl inline-block transition shadow-md shadow-red-600/20"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. TRẠNG THÁI GIỎ HÀNG TRỐNG (Empty Cart Screen)
  if (detailed.length === 0) {
    return (
      <div className="bg-[#f2f2f2] dark:bg-slate-900 min-h-screen py-16 px-4">
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-xl p-8 text-center shadow-sm border border-gray-200 dark:border-slate-700 space-y-4">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            🛒
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100">
            Giỏ hàng của bạn đang trống
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Chưa có sản phẩm nào trong giỏ hàng. Hãy chọn mua các sản phẩm laptop yêu thích tại Laptop Center!
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-lg transition inline-block shadow-sm"
            >
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. TRANG THANH TOÁN / GIỎ HÀNG CHÍNH CHUẨN DATN (100% Identical to DATN CartPage)
  return (
    <div className="bg-[#f2f2f2] dark:bg-slate-900 min-h-screen py-8 px-4 text-gray-900 dark:text-gray-100">
      {/* Centered Main Box matching DATN Layout */}
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-slate-700 space-y-8">
        
        {/* Main Title matching DATN Image 1 */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 pb-3 border-b border-gray-200 dark:border-slate-700">
          Thanh toán
        </h1>

        {/* Warning Alert if not logged in */}
        {!isLoggedIn && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>Bạn chưa đăng nhập. Vui lòng đăng nhập tài khoản để hoàn tất đặt hàng.</span>
            </div>
            <Link
              to="/account"
              search={{ mode: "login" }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition shrink-0 shadow-xs"
            >
              <LogIn className="w-4 h-4" /> Đăng nhập ngay
            </Link>
          </div>
        )}

        {/* CART PRODUCTS LIST BOX matching DATN Image 1 */}
        <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
          {/* Table Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 text-xs font-bold text-gray-800 dark:text-gray-200">
            <span>Sản phẩm</span>
            <span>Số lượng</span>
          </div>

          {/* Items Rows */}
          <div className="divide-y divide-gray-200 dark:divide-slate-800">
            {detailed.map((d) => {
              const isAccessory = d.product.id.startsWith("acc_");
              const accId = isAccessory ? d.product.id.replace("acc_", "") : "";
              const v = d.product.variants[d.item.variantIndex];

              return (
                <div
                  key={
                    d.item.cartDetailId !== undefined
                      ? `${d.product.id}-${d.item.variantIndex}-${d.item.cartDetailId}`
                      : `${d.product.id}-${d.item.variantIndex}`
                  }
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Delete Icon */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 p-1 transition cursor-pointer shrink-0"
                          title="Xóa khỏi giỏ hàng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xóa sản phẩm khỏi giỏ hàng?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bạn có chắc chắn muốn bỏ <strong>"{d.product.name}"</strong> khỏi giỏ hàng?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Hủy</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white font-bold"
                            onClick={() => {
                              remove(d.item.productId, d.item.variantIndex);
                              toast.success("Đã xóa khỏi giỏ hàng");
                            }}
                          >
                            Xóa sản phẩm
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Thumbnail Image */}
                    <div className="w-14 h-14 shrink-0 bg-slate-50 dark:bg-slate-800 rounded p-1 border border-gray-100 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                      <ProductImage
                        seed={d.product.anhDaiDien || (d.product.images && d.product.images[0])}
                        label={d.product.name}
                        className="w-full h-full flex items-center justify-center"
                        iconClassName="size-8 text-gray-400"
                        imgClassName="max-h-full max-w-full object-contain mix-blend-multiply"
                      />
                    </div>

                    {/* Title & Price */}
                    <div className="min-w-0 flex-1">
                      {isAccessory ? (
                        <Link
                          to="/accessories/$id"
                          params={{ id: accId }}
                          className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 hover:text-red-600 transition line-clamp-1"
                        >
                          {d.product.name}
                        </Link>
                      ) : (
                        <Link
                          to="/products/$slug"
                          params={{ slug: d.product.slug }}
                          className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 hover:text-red-600 transition line-clamp-1"
                        >
                          {d.product.name}
                        </Link>
                      )}
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {isAccessory
                          ? d.product.display || "Phụ kiện chính hãng"
                          : `RAM ${v.ram}GB • SSD ${v.ssd >= 1024 ? `${v.ssd / 1024}TB` : `${v.ssd}GB`}`}
                      </p>
                      <div className="text-xs font-bold text-red-600 mt-0.5">
                        {formatVND(d.unitPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="inline-flex items-center rounded border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQty(d.item.productId, d.item.variantIndex, Math.max(1, d.item.quantity - 1))}
                      className="px-2.5 py-1 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-xs font-bold tabular-nums">
                      {d.item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(d.item.productId, d.item.variantIndex, d.item.quantity + 1)}
                      className="px-2.5 py-1 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Bar matching DATN */}
          <div className="p-4 flex items-center justify-between bg-gray-50 dark:bg-slate-800/60 border-t border-gray-200 dark:border-slate-700">
            <span className="text-xs sm:text-sm font-extrabold uppercase text-gray-800 dark:text-gray-200">
              Tổng tiền thanh toán
            </span>
            <span className="text-base sm:text-lg font-extrabold text-red-600">
              {formatVND(calculateTotal())}
            </span>
          </div>

          {/* Bottom Buttons Row matching DATN Image 1 */}
          <div className="p-4 flex items-center justify-end gap-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
            <Link
              to="/products"
              className="border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded px-4 py-2 text-xs font-bold transition flex items-center gap-1"
            >
              ← Xem sản phẩm khác
            </Link>
            <button
              type="button"
              onClick={handleUpdateCart}
              className="bg-red-600 hover:bg-red-700 text-white rounded px-5 py-2 text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Cập nhật
            </button>
          </div>
        </div>

        {/* FORM ORDER SECTION matching DATN */}
        <form onSubmit={handleOrderSubmit} className="space-y-8">
          
          {/* SECTION 1: NHẬP THÔNG TIN KHÁCH HÀNG */}
          <div className="space-y-4">
            <h2 className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-200 dark:border-slate-700">
              NHẬP THÔNG TIN KHÁCH HÀNG
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Họ và tên"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-slate-700 rounded-md outline-none focus:border-red-600 dark:bg-slate-900 dark:text-gray-100 bg-white placeholder:text-gray-400"
              />

              <input
                type="text"
                placeholder="Địa chỉ giao hàng chi tiết"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-slate-700 rounded-md outline-none focus:border-red-600 dark:bg-slate-900 dark:text-gray-100 bg-white placeholder:text-gray-400"
              />

              <input
                type="text"
                placeholder="Tỉnh / Thành phố"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-slate-700 rounded-md outline-none focus:border-red-600 dark:bg-slate-900 dark:text-gray-100 bg-white placeholder:text-gray-400"
              />

              <input
                type="text"
                maxLength={10}
                placeholder="Số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-slate-700 rounded-md outline-none focus:border-red-600 dark:bg-slate-900 dark:text-gray-100 bg-white placeholder:text-gray-400"
              />

              {/* Checkbox địa chỉ khác */}
              <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={differentAddress}
                  onChange={(e) => setDifferentAddress(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-600"
                />
                <span>Giao hàng tới địa chỉ khác?</span>
              </label>

              {/* Note Textarea */}
              <textarea
                rows={4}
                placeholder="Ghi chú đơn hàng: Quà tặng, Thông tin xuất VAT, v.v..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 dark:border-slate-700 rounded-md outline-none focus:border-red-600 dark:bg-slate-900 dark:text-gray-100 bg-white placeholder:text-gray-400 resize-y"
              />
            </div>
          </div>

          {/* SECTION 2: CHỌN CÁCH NHẬN HÀNG */}
          <div className="space-y-4">
            <h2 className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-gray-900 dark:text-gray-100 pb-2 border-b border-gray-200 dark:border-slate-700">
              CHỌN CÁCH NHẬN HÀNG
            </h2>

            {/* Radio choices */}
            <div className="space-y-2 text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-semibold">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  value="pickup"
                  checked={deliveryMethod === "pickup"}
                  onChange={() => setDeliveryMethod("pickup")}
                  className="text-red-600 focus:ring-red-600 cursor-pointer"
                />
                <span>Giữ hàng tại cửa hàng</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  value="shipping"
                  checked={deliveryMethod === "shipping"}
                  onChange={() => setDeliveryMethod("shipping")}
                  className="text-red-600 focus:ring-red-600 cursor-pointer"
                />
                <span>Giao hàng tận nơi</span>
              </label>
            </div>
          </div>

          {/* SECTION 3: CHỌN PHƯƠNG THỨC THANH TOÁN */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span>CHỌN PHƯƠNG THỨC THANH TOÁN</span>
              </h2>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Thanh toán an toàn 100%
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {PAYMENT_METHODS_DATA.map((method) => {
                const isSelected = paymentMethod === method.id;
                return (
                  <div
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`relative border rounded-xl p-4 cursor-pointer transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? "border-red-600 bg-red-50/50 dark:bg-red-950/20 shadow-xs"
                        : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="pt-0.5">
                        <input
                          type="radio"
                          name="payment_method"
                          value={method.id}
                          checked={isSelected}
                          onChange={() => setPaymentMethod(method.id)}
                          className="w-4 h-4 text-red-600 focus:ring-red-600 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg">{method.icon}</span>
                          <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">
                            {method.name}
                          </span>
                          {method.badge && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${method.badgeColor}`}>
                              {method.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {method.description}
                        </p>

                        {isSelected && (
                          <div className="mt-2 pt-2 border-t border-gray-200/80 dark:border-slate-700/80 text-xs text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-slate-800/60 p-2.5 rounded-lg italic">
                            💡 {method.detailText}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="hidden sm:block text-red-600 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Big Primary Order Button */}
          <div className="pt-4 text-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white font-black text-sm sm:text-base tracking-wider uppercase py-3.5 px-12 sm:px-16 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang xử lý đơn hàng...</span>
                </>
              ) : (
                <span>ĐẶT HÀNG</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal Thanh toán QR (MBBank / VietQR) */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          tongTien={calculateTotal()}
          transferContent={phone.trim() ? `TT${phone.trim().slice(-6)}` : "LAPTOPCENTER"}
          onConfirmBankTransfer={async () => {
            const maDon = await executeSaveOrder();
            return maDon;
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setOrderSuccess(true);
            clearCart();
          }}
        />
      )}
    </div>
  );
}
