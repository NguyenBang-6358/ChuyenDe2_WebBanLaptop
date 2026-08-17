import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Thanh toán — Laptop Center" },
      { name: "description", content: "Chuyển hướng đến trang Giỏ hàng và Thanh toán." },
    ],
  }),
  component: () => <Navigate to="/cart" replace />,
});
