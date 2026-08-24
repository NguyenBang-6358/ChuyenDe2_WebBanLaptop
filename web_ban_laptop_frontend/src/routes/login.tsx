import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, LogIn, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { loginApi, googleLoginApi, LoginApiError } from "@/lib/laptop-api";
import { useAuth } from "@/lib/auth-store";
import { triggerGoogleLogin } from "@/lib/google-auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Đăng nhập — Laptop Center" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  if (isLoggedIn) {
    navigate({ to: "/" });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginApi({
        email: email.trim(),
        matKhau: password,
      });
      login(res.token, res.user);
      toast.success(`Đăng nhập thành công! Xin chào, ${res.user.hoTen}`);
      navigate({ to: "/" });
    } catch (err: unknown) {
      if (err instanceof LoginApiError) {
        setError(err.message);
        toast.error(err.message);
      } else {
        const msg = err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu.";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Đăng nhập Google chuẩn Google Identity Services (accounts.google.com)
  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const gProfile = await triggerGoogleLogin();
      const res = await googleLoginApi({
        email: gProfile.email,
        name: gProfile.name,
      });
      login(res.token, res.user);
      toast.success(`Đăng nhập Google thành công! Xin chào, ${res.user.hoTen}`);
      navigate({ to: "/" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi đăng nhập Google";
      setError(msg);
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Đăng Nhập</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Truy cập tài khoản của bạn để trải nghiệm hệ thống
          </p>
        </div>

        {/* Lỗi thông báo */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-800 font-medium">
            {error}
          </div>
        )}

        {/* Form Đăng Nhập */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="yourname@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || googleLoading}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-slate-900 dark:text-slate-100 transition"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || googleLoading}
                className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 text-slate-900 dark:text-slate-100 transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 cursor-pointer active:scale-98"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập</span>
              </>
            )}
          </button>
        </form>

        {/* Hoặc tiếp tục với Google */}
        <div className="relative my-4 flex items-center">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            hoặc
          </span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <button
          type="button"
          disabled={googleLoading}
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm cursor-pointer disabled:opacity-50 active:scale-98"
        >
          {googleLoading ? (
            <Loader2 className="size-4 animate-spin text-red-600" />
          ) : (
            <svg className="size-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
                fill="#EA4335"
              />
            </svg>
          )}
          Tiếp tục với Google
        </button>

        {/* Chuyển hướng Đăng Ký */}
        <div className="text-center text-xs text-slate-500">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="text-red-600 font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </div>

      </div>
    </div>
  );
}
