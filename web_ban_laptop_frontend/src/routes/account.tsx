import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  Loader2,
  ShoppingBag,
  Phone,
  Save,
  CheckCircle,
  MapPin,
  ChevronDown,
  ChevronUp,
  Eye,
  Package,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";
import { useCart } from "@/lib/cart-store";
import {
  loginApi,
  registerApi,
  fetchMyOrders,
  fetchSingleOrderApi,
  fetchLaptops,
  fetchPhuKiens,
  updateUserProfileApi,
  changePasswordApi,
  API_BASE_URL,
  type MyOrder,
} from "@/lib/laptop-api";
import { formatVND } from "@/lib/format";

const accountSearchSchema = z.object({
  mode: fallback(z.enum(["login", "register", "forgot"]), "login").default("login"),
});

export const Route = createFileRoute("/account")({
  validateSearch: zodValidator(accountSearchSchema),
  head: () => ({ meta: [{ title: "Tài khoản cá nhân — Laptop Center" }] }),
  component: AccountPage,
});

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
      {children}
      <span className="text-red-500"> *</span>
    </Label>
  );
}

function AccountPage() {
  const { isLoggedIn, user, token, login, logout, updateUser } = useAuth();
  const clearCart = useCart((s) => s.clear);
  const navigate = useNavigate();
  const { mode: searchMode } = Route.useSearch();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [diaChi, setDiaChi] = useState("");
  const [soDienThoai, setSoDienThoai] = useState("");
  const [showPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Tab State
  const [activeTab, setActiveTab] = useState<"orders" | "profile">("profile");

  // Đơn hàng thật từ API
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  // Form Thông Tin Cá Nhân & Mật Khẩu (Chuẩn DATN)
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Maps để tra cứu chi tiết tên/ảnh sản phẩm & phụ kiện theo ID
  const [laptopMap, setLaptopMap] = useState<Map<string, any>>(new Map());
  const [phuKienMap, setPhuKienMap] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    fetchLaptops()
      .then((prods) => {
        const map = new Map<string, any>();
        prods.forEach((p: any) => {
          map.set(String(p.id), p);
          if (p.maSanPham) map.set(String(p.maSanPham), p);
        });
        setLaptopMap(map);
      })
      .catch(() => {});

    fetchPhuKiens()
      .then((accs) => {
        const map = new Map<string, any>();
        accs.forEach((pk: any) => {
          map.set(String(pk.maPhuKien), pk);
          map.set(`pk-${pk.maPhuKien}`, pk);
        });
        setPhuKienMap(map);
      })
      .catch(() => {});
  }, []);

  const isAdminUser = Boolean(
    isLoggedIn &&
      user &&
      (String((user as any).vaiTro || (user as any).role || "").toLowerCase().includes("admin") ||
        user.email.toLowerCase().includes("admin"))
  );

  useEffect(() => {
    if (!isLoggedIn) {
      setMode(searchMode);
    } else if (user) {
      setProfileName(user.hoTen || "");
      setProfilePhone(user.soDienThoai || "");
      setProfileAddress(user.diaChi || "");

      // Tải đơn hàng bằng token và userId (có nhiều endpoint dự phòng)
      if (token) {
        setOrdersLoading(true);
        fetchMyOrders(token, user.maNguoiDung)
          .then((res) => {
            setOrders(res);
            setOrdersError("");
          })
          .catch(() => {
            setOrders([]);
            setOrdersError("");
          })
          .finally(() => setOrdersLoading(false));
      }
    }
  }, [searchMode, isLoggedIn, user, token]);

  const switchAuthMode = (next: "login" | "register" | "forgot") => {
    setMode(next);
    setApiError("");
    if (next !== "forgot") {
      navigate({ to: "/account", search: { mode: next } });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;

    const cleanPhone = profilePhone.trim();
    if (cleanPhone && cleanPhone.length !== 10) {
      toast.error("Số điện thoại phải có đúng 10 chữ số.");
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        toast.error("Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới.");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Mật khẩu mới và Nhập lại mật khẩu không trùng khớp.");
        return;
      }
    }

    setSavingProfile(true);
    try {
      // 1. Cập nhật thông tin cá nhân (bao gồm mật khẩu mới nếu có nhập)
      await updateUserProfileApi(user.maNguoiDung, token, {
        maNguoiDung: user.maNguoiDung,
        hoTen: profileName.trim(),
        email: user.email,
        matKhau: newPassword ? newPassword : (currentPassword || undefined),
        soDienThoai: cleanPhone,
        diaChi: profileAddress.trim(),
      });

      // 2. Đổi mật khẩu qua endpoint đổi mật khẩu nếu có nhập
      if (newPassword && currentPassword) {
        await changePasswordApi(token, {
          matKhauCu: currentPassword,
          matKhauMoi: newPassword,
        }).catch(() => { });
      }

      updateUser({
        hoTen: profileName.trim(),
        soDienThoai: cleanPhone,
        diaChi: profileAddress.trim(),
      });

      toast.success("Cập nhật thông tin cá nhân & mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const submitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await loginApi({ email: email.trim(), matKhau: password });
        login(res.token, res.user);
        toast.success(`Đăng nhập thành công! Xin chào ${res.user.hoTen}`);
        navigate({ to: "/" });
      } else if (mode === "register") {
        await registerApi({
          hoTen: hoTen.trim(),
          email: email.trim(),
          matKhau: password,
          soDienThoai: soDienThoai.trim(),
          diaChi: diaChi.trim(),
        });
        toast.success("Đăng ký thành công! Hãy đăng nhập vào tài khoản.");
        switchAuthMode("login");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // NẾU CHƯA ĐĂNG NHẬP
  if (!isLoggedIn || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {mode === "login" ? "Đăng Nhập" : mode === "register" ? "Tạo Tài Khoản" : "Quên Mật Khẩu"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === "login"
                ? "Truy cập tài khoản để trải nghiệm mua sắm"
                : "Tạo tài khoản tích điểm và mua sắm dễ dàng"}
            </p>
          </div>

          {apiError && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
              {apiError}
            </div>
          )}

          <form onSubmit={submitAuth} className="space-y-4">
            {mode === "register" && (
              <div>
                <RequiredLabel>Họ và tên</RequiredLabel>
                <input
                  type="text"
                  required
                  value={hoTen}
                  onChange={(e) => setHoTen(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:border-red-600"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            )}

            <div>
              <RequiredLabel>Email</RequiredLabel>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:border-red-600"
                placeholder="yourname@gmail.com"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <RequiredLabel>Mật khẩu</RequiredLabel>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border rounded-xl outline-none focus:border-red-600"
                  placeholder="••••••••"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Xác nhận</span>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // TRANG TÀI KHOẢN CÁ NHÂN CHUẨN 100% DATN (Header Banner + Horizontal Tabs + Profile/Orders)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
      
      {/* Breadcrumbs chuẩn DATN */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
        <Link to="/" className="hover:text-red-600 transition">
          Trang chủ
        </Link>
        <span className="text-slate-400 font-light">&gt;</span>
        <span className="text-red-600 font-semibold">Tài khoản cá nhân</span>
      </div>

      {/* Main Profile Header Banner chuẩn DATN */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-slate-800 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-black text-2xl uppercase shadow-inner border border-red-200 shrink-0">
            {user.hoTen ? user.hoTen.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 justify-center sm:justify-start">
              {user.hoTen || user.email.split("@")[0]}
              {isAdminUser && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full uppercase">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{user.email}</p>
            {user.soDienThoai && (
              <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                SĐT: {user.soDienThoai}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdminUser && (
            <Link
              to="/admin"
              className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" /> Kênh Quản Trị (Admin)
            </Link>
          )}

          <button
            onClick={() => {
              logout();
              clearCart();
              toast.success("Đã đăng xuất tài khoản!");
              navigate({ to: "/" });
            }}
            className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            Đăng xuất tài khoản
          </button>
        </div>
      </div>

      {/* Navigation Tabs chuẩn DATN */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 mb-8 gap-4 sm:gap-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab("profile")}
          className={`pb-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "profile"
              ? "border-red-600 text-red-600"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <User className="w-4 h-4" /> Thông tin cá nhân & Bảo mật
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === "orders"
              ? "border-red-600 text-red-600"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Lịch Sử Đơn Hàng ({orders.length})
        </button>
      </div>

      {/* TAB CONTENT 1: CẬP NHẬT THÔNG TIN & MẬT KHẨU chuẩn DATN */}
      {activeTab === "profile" && (
        <div className="max-w-2xl bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-6 pb-3 border-b border-slate-100 dark:border-slate-700">
            Thông tin cá nhân & Bảo mật
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-5 text-xs">
            {/* Email (Disabled Readonly) */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Địa chỉ Email (Không thể thay đổi)
              </label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Họ và tên */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Nhập họ tên của bạn..."
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-600 text-slate-900 dark:text-slate-100 transition"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Số điện thoại (Đúng 10 chữ số)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="0987654321"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-600 text-slate-900 dark:text-slate-100 transition font-mono"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Địa chỉ giao hàng */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Địa chỉ nhận hàng mặc định
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-600 text-slate-900 dark:text-slate-100 transition"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-700 my-6" />

            {/* Đổi mật khẩu */}
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Đổi mật khẩu (Để trống nếu không muốn đổi)
            </h3>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-600 text-slate-900 dark:text-slate-100 transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-600 text-slate-900 dark:text-slate-100 transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Nhập lại mật khẩu mới
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-600 text-slate-900 dark:text-slate-100 transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md shadow-red-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu Thay Đổi Thông Tin</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT 2: QUẢN LÝ ĐƠN HÀNG chuẩn DATN */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {ordersLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="size-5 animate-spin text-red-600" />
              <span className="text-sm">Đang tải lịch sử đơn hàng...</span>
            </div>
          ) : ordersError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              {ordersError}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex size-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                <ShoppingBag className="size-9 text-slate-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Bạn chưa có đơn hàng nào.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                  Khám phá ngay các dòng sản phẩm laptop & phụ kiện chính hãng tại Laptop Center.
                </p>
              </div>
              <Link to="/">
                <Button
                  size="sm"
                  className="mt-2 px-6 font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md shadow-red-600/20 transition-all"
                >
                  Tiếp tục mua sắm
                </Button>
              </Link>
            </div>
          ) : (
            orders.map((o) => (
              <OrderCardWithDetails
                key={o.maDonHang}
                order={o}
                token={token || undefined}
                userAddress={user.diaChi || undefined}
                laptopMap={laptopMap}
                phuKienMap={phuKienMap}
              />
            ))
          )}
        </div>
      )}

    </div>
  );
}

function getOrderItems(orderObj: any): any[] {
  if (!orderObj) return [];
  const list =
    orderObj.chiTietDonHangs ||
    orderObj.ChiTietDonHangs ||
    orderObj.chiTiet ||
    orderObj.ChiTiet ||
    orderObj.items ||
    orderObj.Items ||
    orderObj.listChiTietDonHang ||
    orderObj.ListChiTietDonHang ||
    orderObj.chiTietGioHang ||
    orderObj.ChiTietGioHang ||
    [];

  if (Array.isArray(list)) return list;
  if (list && typeof list === "object" && Array.isArray(list.$values)) return list.$values;
  return [];
}

function getItemName(item: any, laptopMap: Map<string, any>, phuKienMap: Map<string, any>): string {
  const directName =
    item.tenSanPham ||
    item.TenSanPham ||
    item.tenPhuKien ||
    item.TenPhuKien ||
    item.ten_san_pham ||
    item.name ||
    item.Name ||
    item.ten ||
    item.Ten;
  if (directName && directName !== "Sản phẩm") return directName;

  const nestedName =
    item.sanPham?.tenSanPham ||
    item.sanPham?.TenSanPham ||
    item.SanPham?.TenSanPham ||
    item.SanPham?.tenSanPham ||
    item.phuKien?.tenPhuKien ||
    item.phuKien?.TenPhuKien ||
    item.PhuKien?.TenPhuKien ||
    item.PhuKien?.tenPhuKien;
  if (nestedName) return nestedName;

  const maSp = item.maSanPham || item.MaSanPham || item.ma_san_pham || item.productId;
  if (maSp) {
    const foundSp = laptopMap.get(String(maSp));
    if (foundSp) return foundSp.name;
  }

  const maPk = item.maPhuKien || item.MaPhuKien || item.ma_phu_kien || item.accessoryId;
  if (maPk) {
    const foundPk = phuKienMap.get(String(maPk));
    if (foundPk) return foundPk.tenPhuKien || foundPk.name;
  }

  return "Sản phẩm chính hãng";
}

function getItemPrice(item: any, orderTotal: number, totalItemsInOrder: number): number {
  const p =
    item.donGia ??
    item.DonGia ??
    item.gia ??
    item.Gia ??
    item.don_gia ??
    item.price ??
    item.Price ??
    item.giaBan ??
    item.GiaBan;
  const numP = Number(p);
  if (Number.isFinite(numP) && numP > 0) return numP;

  if (orderTotal > 0 && totalItemsInOrder > 0) {
    return Math.round(orderTotal / totalItemsInOrder);
  }
  return 0;
}

function getItemImage(item: any, laptopMap: Map<string, any>, phuKienMap: Map<string, any>): string | undefined {
  const img =
    item.anhDaiDien ||
    item.AnhDaiDien ||
    item.anh_dai_dien ||
    item.hinhAnh ||
    item.HinhAnh ||
    item.image ||
    item.Image;
  if (img) {
    return img.startsWith("http") || img.startsWith("/") ? img : `${API_BASE_URL}${img}`;
  }

  const nestedImg =
    item.sanPham?.anhDaiDien ||
    item.sanPham?.AnhDaiDien ||
    item.SanPham?.AnhDaiDien ||
    item.phuKien?.anhDaiDien ||
    item.phuKien?.AnhDaiDien ||
    item.PhuKien?.AnhDaiDien;
  if (nestedImg) {
    return nestedImg.startsWith("http") || nestedImg.startsWith("/")
      ? nestedImg
      : `${API_BASE_URL}${nestedImg}`;
  }

  const maSp = item.maSanPham || item.MaSanPham || item.ma_san_pham || item.productId;
  if (maSp) {
    const foundSp = laptopMap.get(String(maSp));
    if (foundSp) {
      const spImg = foundSp.anhDaiDien || (foundSp.images && foundSp.images[0]);
      if (spImg) return spImg.startsWith("http") || spImg.startsWith("/") ? spImg : `${API_BASE_URL}${spImg}`;
    }
  }

  const maPk = item.maPhuKien || item.MaPhuKien || item.ma_phu_kien || item.accessoryId;
  if (maPk) {
    const foundPk = phuKienMap.get(String(maPk));
    if (foundPk && foundPk.anhDaiDien) {
      const pkImg = foundPk.anhDaiDien;
      return pkImg.startsWith("http") || pkImg.startsWith("/") ? pkImg : `${API_BASE_URL}${pkImg}`;
    }
  }

  return undefined;
}

function OrderCardWithDetails({
  order,
  token,
  userAddress,
  laptopMap,
  phuKienMap,
}: {
  order: MyOrder;
  token?: string;
  userAddress?: string;
  laptopMap: Map<string, any>;
  phuKienMap: Map<string, any>;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [detailOrder, setDetailOrder] = useState<MyOrder | null>(order);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const rawItems = getOrderItems(detailOrder);

  useEffect(() => {
    // Check if any item lacks proper name or price
    const needsFetch =
      rawItems.length === 0 ||
      rawItems.some((item) => {
        const name = getItemName(item, laptopMap, phuKienMap);
        const price = getItemPrice(item, order.tongTien, rawItems.length);
        return name === "Sản phẩm chính hãng" || price === 0;
      });

    if (needsFetch && !loadingDetail) {
      setLoadingDetail(true);
      fetchSingleOrderApi(order.maDonHang, token)
        .then((res) => {
          if (res) setDetailOrder(res);
          setLoadingDetail(false);
        })
        .catch(() => setLoadingDetail(false));
    }
  }, [order.maDonHang, token, laptopMap, phuKienMap]);

  const toggleExpand = async () => {
    if (!isExpanded && rawItems.length === 0 && !loadingDetail) {
      setLoadingDetail(true);
      const res = await fetchSingleOrderApi(order.maDonHang, token);
      if (res) setDetailOrder(res);
      setLoadingDetail(false);
    }
    setIsExpanded((v) => !v);
  };

  const statusText = order.trangThai || "Hoàn thành";

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
      {/* Order Top Header */}
      <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-black text-sm text-slate-900 dark:text-slate-100">
            Mã đơn hàng: <span className="text-red-600">LC-{String(order.maDonHang).padStart(4, "0")}</span>
          </span>
          <span className="text-xs text-slate-400">
            • {new Date(order.ngayDat).toLocaleDateString("vi-VN")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/80 font-bold px-3 py-1 rounded-full text-xs border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" /> {statusText}
          </span>
        </div>
      </div>

      {/* Order Summary Line */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <p className="flex items-center gap-1.5">
            <MapPin className="size-3.5 text-slate-400 shrink-0" />
            <span><strong>Địa chỉ giao hàng:</strong> {order.diaChiGiaoHang || userAddress || "Đã xác nhận"}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <CreditCard className="size-3.5 text-slate-400 shrink-0" />
            <span><strong>Hình thức thanh toán:</strong> {order.phuongThucThanhToan || "Thanh toán khi nhận hàng / Chuyển khoản"}</span>
          </p>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Tổng thanh toán:</span>
            <span className="text-lg font-extrabold text-red-600">
              {formatVND(order.tongTien)}
            </span>
          </div>
          <button
            type="button"
            onClick={toggleExpand}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition duration-150 cursor-pointer active:scale-95"
          >
            <Eye className="size-3.5" />
            <span>{isExpanded ? "Thu gọn chi tiết" : "Xem chi tiết sản phẩm"}</span>
            {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Product List Details Table */}
      {isExpanded && (
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Package className="size-4 text-red-600" />
            <span>Danh sách sản phẩm trong đơn hàng ({rawItems.length || 1})</span>
          </div>

          {loadingDetail ? (
            <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Loader2 className="size-4 animate-spin text-red-600" />
              <span>Đang lấy chi tiết sản phẩm...</span>
            </div>
          ) : rawItems.length > 0 ? (
            <div className="space-y-2.5">
              {rawItems.map((item, idx) => {
                const name = getItemName(item, laptopMap, phuKienMap);
                const qty = item.soLuong || item.SoLuong || 1;
                const price = getItemPrice(item, order.tongTien, rawItems.length);
                const imgSrc = getItemImage(item, laptopMap, phuKienMap);

                return (
                  <div
                    key={item.maChiTiet || item.MaChiTiet || idx}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-12 rounded-lg bg-slate-100 dark:bg-slate-700 p-1 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600 overflow-hidden">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={name}
                            className="max-h-full max-w-full object-contain"
                            onError={(e: any) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-xl opacity-40">💻</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {name}
                        </h4>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Số lượng: <span className="font-bold text-slate-800 dark:text-slate-200">x{qty}</span> • Đơn giá: {formatVND(price)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Thành tiền
                      </div>
                      <div className="text-sm font-black text-red-600">
                        {formatVND(price * qty)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">
              Đơn hàng chưa cập nhật chi tiết từng sản phẩm.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
