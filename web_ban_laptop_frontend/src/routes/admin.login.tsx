import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { loginApi, fetchUserProfile } from "@/lib/laptop-api";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Lock, Mail, ShieldAlert, Sparkles } from "lucide-react";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { login: saveAuthSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      const msg = "Vui lòng nhập đầy đủ thông tin đăng nhập!";
      toast.error(msg);
      setError(msg);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Call standard login API
      const res = await loginApi({ email, matKhau: password });

      // 2. Fetch user profile with fallbacks
      let profile: any = null;
      try {
        profile = await fetchUserProfile(res.user.maNguoiDung, res.token);
      } catch (e) {
        console.warn("Không thể tải profile từ API, dùng thông tin từ login response:", e);
        profile = res.user;
      }

      const roleStr = (profile?.vaiTro || (profile as any)?.role || "").toLowerCase();
      const isQuanTri =
        !profile?.vaiTro ||
        roleStr === "quan_tri" ||
        roleStr.includes("admin") ||
        email.toLowerCase().includes("admin");

      const statusStr = (profile?.trangThai || (profile as any)?.status || "").toLowerCase();
      const isLocked = statusStr === "khoa" || statusStr === "inactive" || statusStr === "banned";

      // 3. Authorization check
      if (isLocked) {
        const msg = "Tài khoản quản trị của bạn đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ!";
        toast.error(msg);
        setError(msg);
        setIsLoading(false);
        return;
      }

      if (!isQuanTri) {
        const msg = "Tài khoản của bạn không có quyền truy cập quản trị!";
        toast.error(msg);
        setError(msg);
        setIsLoading(false);
        return;
      }

      // 4. Save auth session
      saveAuthSession(res.token, {
        maNguoiDung: profile?.maNguoiDung ?? res.user.maNguoiDung,
        email: profile?.email ?? res.user.email,
        hoTen: profile?.hoTen ?? res.user.hoTen ?? "Admin",
        soDienThoai: profile?.soDienThoai || (profile as any)?.so_dien_thoai || res.user.soDienThoai,
        diaChi: profile?.diaChi || (profile as any)?.dia_chi || res.user.diaChi,
      });

      toast.success(`Chào mừng trở lại, ${profile?.hoTen || res.user.hoTen || "Admin"}!`);

      // Redirect to Admin Dashboard
      navigate({ to: "/admin", replace: true });
    } catch (err: any) {
      console.error("Lỗi đăng nhập admin:", err);
      const errMsg = err.response?.data?.message || err.message || "Đăng nhập thất bại";
      toast.error(errMsg);
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] relative overflow-hidden font-sans">
      {/* Premium ambient light shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md p-6 relative z-10">
        {/* Brand Identity */}
        <div className="flex flex-col items-center mb-8">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 flex items-center justify-center text-white font-bold shadow-lg shadow-red-600/20 mb-4 animate-bounce">
            LC
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
            Laptop Center{" "}
            <span className="text-xs bg-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/30">
              ADMIN
            </span>
          </h1>
          <p className="text-slate-400 text-xs mt-1.5">Hệ thống quản trị doanh nghiệp cao cấp</p>
        </div>

        {/* Login Glassmorphism Box */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-slate-950/50">
          <div className="mb-6">
            <h2 className="text-base font-bold text-white">Đăng nhập tài khoản</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Nhập tài khoản quản trị để tiếp tục vào trang điều khiển
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-300">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Email Quản trị viên
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@laptopcenter.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-11 pl-10 pr-4 text-xs bg-slate-950/40 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-slate-600 text-white"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Mật khẩu bảo mật
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-11 pl-10 pr-4 text-xs bg-slate-950/40 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-slate-600 text-white"
                />
              </div>
            </div>

            {/* Warning / Error info block */}
            {error ? (
              <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl animate-in fade-in duration-200">
                <ShieldAlert className="size-4.5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-rose-400 leading-normal font-medium">{error}</p>
              </div>
            ) : (
              <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl">
                <ShieldAlert className="size-4.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-500/80 leading-normal font-medium">
                  Khu vực hạn chế. Mọi hành vi truy cập trái phép sẽ bị ghi lại địa chỉ IP phục vụ
                  mục đích giám sát bảo mật.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-800 text-white font-bold text-xs h-11 rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang xác thực thông tin...
                </>
              ) : (
                <>Xác nhận đăng nhập</>
              )}
            </Button>
          </form>
        </div>

        {/* Back to Home Page link */}
        <Link
          to="/"
          className="text-sm text-slate-400 hover:text-red-500 transition-colors duration-200 no-underline block text-center mt-6 relative z-20 cursor-pointer"
        >
          ← Quay về cửa hàng mua sắm
        </Link>
      </div>
    </div>
  );
}
