import { Link } from "@tanstack/react-router";
import { Phone, Mail, MapPin, ShieldCheck, Award, Truck, CreditCard, Headphones } from "lucide-react";

export function Footer() {
  return (
    <>
      {/* Khối Cam Kết Dịch Vụ Trên Footer — Thiết Kế Modern Card (Giống mẫu 1 & mẫu 2) */}
      <section className="bg-[#f8fafc] dark:bg-slate-900/40 py-12 px-4 md:px-6 border-t border-slate-200/60 dark:border-slate-800/80">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                Icon: ShieldCheck,
                title: "Chính hãng 100%",
                desc: "Bảo hành toàn quốc chính hãng 24 tháng.",
                bgIcon: "bg-emerald-100/70 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
              },
              {
                Icon: Truck,
                title: "Giao nhanh 2h",
                desc: "Giao hàng siêu tốc trong vòng 2h tại HCM & Hà Nội.",
                bgIcon: "bg-blue-100/70 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
              },
              {
                Icon: CreditCard,
                title: "Trả góp 0%",
                desc: "Hỗ trợ trả góp 0% linh hoạt qua thẻ tín dụng.",
                bgIcon: "bg-amber-100/70 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
              },
              {
                Icon: Headphones,
                title: "Hỗ trợ 24/7",
                desc: "Tư vấn viên luôn sẵn sàng hỗ trợ bạn bất cứ lúc nào.",
                bgIcon: "bg-purple-100/70 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400",
              },
            ].map(({ Icon, title, desc, bgIcon }) => (
              <div
                key={title}
                className="flex items-start gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
              >
                <div
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full ${bgIcon} transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="size-5 stroke-[2.2]" />
                </div>
                <div className="space-y-1 pt-0.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Main */}
      <footer className="bg-slate-950 text-gray-300 pt-12 pb-8 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* 1. Thương hiệu & Giới thiệu */}
            <div>
              <Link to="/" className="inline-flex items-center gap-2.5 text-xl font-bold text-white mb-4">
                <img
                  src="/images/categories/logo-laptop.png"
                  alt="Laptop Center Logo"
                  className="h-8 w-auto object-contain"
                />
                <span>
                  Laptop<span className="text-primary"> Center</span>
                </span>
              </Link>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Hệ thống bán lẻ laptop chính hãng hàng đầu. Cam kết chất lượng 100%, bảo hành uy tín và giá trị vượt trội.
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Chính hãng
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-primary" /> Uy tín
                </span>
              </div>
            </div>

            {/* 2. Danh mục sản phẩm */}
            <div>
              <h4 className="text-white font-semibold text-xs mb-4 uppercase tracking-wider">
                Danh mục sản phẩm
              </h4>
              <ul className="space-y-2.5 text-xs text-gray-400">
                <li>
                  <Link to="/products" search={{ need: "Gaming" }} className="hover:text-primary transition">
                    Laptop Gaming
                  </Link>
                </li>
                <li>
                  <Link to="/products" search={{ need: "Văn phòng" }} className="hover:text-primary transition">
                    Laptop Văn phòng
                  </Link>
                </li>
                <li>
                  <Link to="/products" search={{ need: "Đồ họa" }} className="hover:text-primary transition">
                    Laptop Đồ họa & Workstation
                  </Link>
                </li>
                <li>
                  <Link to="/accessories" className="hover:text-primary transition">
                    Phụ kiện Laptop chính hãng
                  </Link>
                </li>
              </ul>
            </div>

            {/* 3. Chính sách & Hỗ trợ */}
            <div>
              <h4 className="text-white font-semibold text-xs mb-4 uppercase tracking-wider">
                Chính sách & Hỗ trợ
              </h4>
              <ul className="space-y-2.5 text-xs text-gray-400">
                <li>
                  <Link to="/" className="hover:text-primary transition">
                    Chính sách bảo hành 24 tháng
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-primary transition">
                    Chính sách đổi trả 1 - 1 trong 30 ngày
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-primary transition">
                    Phương thức thanh toán & Đặt hàng
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-primary transition">
                    Chính sách bảo mật thông tin
                  </Link>
                </li>
              </ul>
            </div>

            {/* 4. Thông tin liên hệ */}
            <div>
              <h4 className="text-white font-semibold text-xs mb-4 uppercase tracking-wider">
                Thông tin liên hệ
              </h4>
              <ul className="space-y-3 text-xs text-gray-400">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <span>Hotline: 1900 6868 (8:00 - 21:30)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span>hello@laptopcenter.vn</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright Section */}
          <div className="border-t border-slate-800/80 pt-6 text-center text-xs text-gray-400">
            <p>
              © {new Date().getFullYear()} Công ty TNHH Bán Lẻ Laptop Center. Hệ thống bán lẻ Laptop chính hãng hàng đầu Việt Nam. Tất cả các quyền được bảo lưu.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
