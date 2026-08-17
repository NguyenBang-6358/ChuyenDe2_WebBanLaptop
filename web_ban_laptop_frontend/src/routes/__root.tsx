import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Trang không tồn tại</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Trang bạn tìm không tồn tại hoặc đã được di chuyển.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">Trang không tải được</h1>
        <p className="mt-2 text-sm text-muted-foreground">Có lỗi xảy ra. Vui lòng thử lại.</p>
        <pre className="mt-4 max-h-40 overflow-auto rounded bg-red-50 p-3 text-left text-xs text-red-700">
          {error?.message || "Unknown error"}
          {"\n"}
          {error?.stack || ""}
        </pre>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Thử lại
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Laptop Center — Hệ thống bán lẻ laptop chính hãng" },
      {
        name: "description",
        content:
          "Cửa hàng laptop trực tuyến: Apple, ASUS, Lenovo, Dell, MSI. Giá tốt, bảo hành chính hãng.",
      },
      { property: "og:title", content: "Laptop Center — Hệ thống bán lẻ laptop chính hãng" },
      { property: "og:description", content: "Cửa hàng laptop trực tuyến hàng đầu Việt Nam." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  // Chỉ LƯU scroll position — việc khôi phục scroll sẽ do từng trang tự xử lý sau khi data load xong
  useEffect(() => {
    let timer: any = null;
    const handleScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        sessionStorage.setItem(`scroll_pos_${location.pathname}`, String(window.scrollY));
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [location.pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      {isAdmin ? (
        <div className="min-h-screen bg-[#F8FAFC]">
          <Outlet />
        </div>
      ) : (
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      )}
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
