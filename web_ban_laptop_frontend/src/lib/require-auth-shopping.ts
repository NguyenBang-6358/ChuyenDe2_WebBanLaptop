import type { NavigateOptions } from "@tanstack/react-router";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-store";

type AppNavigate = (opts: NavigateOptions) => void;

export function redirectToLogin(navigate: AppNavigate) {
  navigate({ to: "/account", search: { mode: "login" } });
}

export function requireAuthForAddToCart(navigate: AppNavigate): boolean {
  const { isLoggedIn } = useAuth.getState();
  if (isLoggedIn) return true;
  toast.error("Vui lòng đăng nhập tài khoản để thêm sản phẩm vào giỏ hàng!");
  redirectToLogin(navigate);
  return false;
}

export function requireAuthForBuyNow(navigate: AppNavigate): boolean {
  const { isLoggedIn } = useAuth.getState();
  if (isLoggedIn) return true;
  toast.error("Vui lòng đăng nhập để tiến hành mua hàng và thanh toán!");
  redirectToLogin(navigate);
  return false;
}
