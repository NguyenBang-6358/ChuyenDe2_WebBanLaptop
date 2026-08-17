import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { fetchUserProfile } from "@/lib/laptop-api";
import { Loader2, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Kênh quản trị — Laptop Center" },
      { name: "description", content: "Trang quản lý hệ thống bán Laptop." },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { isLoggedIn, user, token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tự động xóa token cũ nếu không hợp lệ khi vừa vào trang
  const handleLogoutAndRedirect = () => {
    logout();
    navigate({ to: "/admin/login", replace: true });
  };

  useEffect(() => {
    // 0. If navigating OUTSIDE the admin tree (e.g. to "/"), bypass entirely
    //    so the layout can unmount freely without blocking navigation.
    if (!location.pathname.startsWith("/admin")) {
      setVerifying(false);
      setAuthorized(true);
      return;
    }

    // 1. If accessing the login route, bypass authorization check
    if (location.pathname === "/admin/login") {
      setVerifying(false);
      setAuthorized(true);
      return;
    }

    // 2. Check if logged in locally (Frontend Check)
    if (!isLoggedIn || !token || !user) {
      setVerifying(false);
      setAuthorized(false);
      navigate({ to: "/admin/login", replace: true });
      return;
    }

    // 3. Verify user profile and permissions (Backend Validation Check)
    setVerifying(true);
    fetchUserProfile(user.maNguoiDung, token)
      .then((profile) => {
        const roleStr = (profile?.vaiTro || "").toLowerCase();
        const isQuanTri =
          !profile?.vaiTro ||
          roleStr === "quan_tri" ||
          roleStr.includes("admin") ||
          user.email?.toLowerCase().includes("admin");

        const statusStr = (profile?.trangThai || "").toLowerCase();
        const isLocked = statusStr === "khoa" || statusStr === "inactive" || statusStr === "banned";

        if (isLocked) {
          setErrorMsg(
            "Tài khoản quản trị của bạn đang bị khóa (ngưng hoạt động). Vui lòng liên hệ nhà quản lý.",
          );
          setAuthorized(false);
        } else if (!isQuanTri) {
          setErrorMsg(
            "Tài khoản của bạn không có vai trò Quản trị viên. Quyền truy cập bị từ chối.",
          );
          setAuthorized(false);
        } else {
          setAuthorized(true);
          setErrorMsg(null);
        }
      })
      .catch((err) => {
        console.warn("Lỗi xác thực profile từ server, cho phép duy trì phiên admin hiện tại:", err);
        // Duy trì phiên làm việc cho admin thay vì logout khi gặp sự cố kết nối
        setAuthorized(true);
        setErrorMsg(null);
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [location.pathname, isLoggedIn, token, user, navigate, logout]);

  // Loading indicator while verifying permissions
  if (verifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F172A] text-slate-200">
        <Loader2 className="size-10 animate-spin text-teal-500 mb-4" />
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Đang xác thực quyền truy cập quản trị...
        </p>
      </div>
    );
  }

  // If role is incorrect or status is disabled (only block within admin routes)
  if (
    !authorized &&
    location.pathname.startsWith("/admin") &&
    location.pathname !== "/admin/login"
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-12 sm:px-6 lg:px-8 font-sans">
        <div className="w-full max-w-md space-y-6 text-center bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 border border-rose-100 text-rose-500">
            <AlertOctagon className="size-7 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Quyền truy cập bị từ chối
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {errorMsg || "Bạn cần đăng nhập với vai trò Quản trị viên để tiếp tục vào trang này."}
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Button
              onClick={() => {
                logout();
                navigate({ to: "/admin/login", replace: true });
              }}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-10 text-xs font-semibold cursor-pointer"
            >
              Đăng nhập tài khoản khác
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/" })}
              className="w-full rounded-xl h-10 text-xs font-semibold cursor-pointer"
            >
              Về trang chủ mua sắm
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
