using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_ban_laptop.Data;
using Web_ban_laptop.Entities;

namespace Web_ban_laptop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin,quan_tri,administrator")]
    public class AdminController : ControllerBase
    {
        private readonly DataContext _context;

        public AdminController(DataContext context)
        {
            _context = context;
        }

        // ==========================================
        // 1. QUẢN LÝ NGƯỜI DÙNG (USERS)
        // ==========================================

        // GET: api/admin/users
        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<NguoiDung>>> GetUsers()
        {
            var users = await _context.NguoiDungs
                .OrderByDescending(u => u.NgayTao)
                .ToListAsync();
            return Ok(users);
        }

        // PUT: api/admin/users/{id}/role
        [HttpPut("users/{id}/role")]
        public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateRoleRequest request)
        {
            var user = await _context.NguoiDungs.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = $"Không tìm thấy người dùng với ID = {id}" });
            }

            if (request.VaiTro != "khach_hang" && request.VaiTro != "admin")
            {
                return BadRequest(new { message = "Vai trò không hợp lệ. Chỉ chấp nhận 'khach_hang' hoặc 'admin'." });
            }

            user.VaiTro = request.VaiTro;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật vai trò thành công!", user });
        }

        // PUT: api/admin/users/{id}/status
        [HttpPut("users/{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            var user = await _context.NguoiDungs.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = $"Không tìm thấy người dùng với ID = {id}" });
            }

            if (request.TrangThai != "hoat_dong" && request.TrangThai != "khoa")
            {
                return BadRequest(new { message = "Trạng thái không hợp lệ. Chỉ chấp nhận 'hoat_dong' hoặc 'khoa'." });
            }

            user.TrangThai = request.TrangThai;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật trạng thái người dùng thành công!", user });
        }

        // ==========================================
        // 2. QUẢN LÝ ĐƠN HÀNG (ORDERS)
        // ==========================================

        // GET: api/admin/orders
        [HttpGet("orders")]
        public async Task<ActionResult<IEnumerable<object>>> GetOrders()
        {
            var orders = await _context.DonHangs
                .Include(d => d.NguoiDung)
                .Include(d => d.ChiTietDonHangs)
                    .ThenInclude(ct => ct.SanPham)
                .Include(d => d.ChiTietDonHangs)
                    .ThenInclude(ct => ct.PhuKien)
                .OrderByDescending(d => d.NgayDat)
                .Select(o => new
                {
                    maDonHang = o.MaDonHang,
                    maNguoiDung = o.MaNguoiDung,
                    hoTen = o.NguoiDung != null ? o.NguoiDung.HoTen : "Ẩn danh",
                    email = o.NguoiDung != null ? o.NguoiDung.Email : "",
                    soDienThoai = o.NguoiDung != null ? o.NguoiDung.SoDienThoai : "",
                    diaChiGiaoHang = o.DiaChiGiaoHang,
                    phuongThucThanhToan = o.PhuongThucThanhToan,
                    tongTien = o.TongTien,
                    trangThai = o.TrangThai,
                    ngayDat = o.NgayDat,
                    soLuongSanPham = o.ChiTietDonHangs.Count,
                    chiTietDonHangs = o.ChiTietDonHangs.Select(ct => new
                    {
                        maChiTiet = ct.MaChiTiet,
                        maSanPham = ct.MaSanPham,
                        tenSanPham = ct.SanPham != null ? ct.SanPham.TenSanPham : (ct.PhuKien != null ? ct.PhuKien.TenPhuKien : "Sản phẩm"),
                        anhDaiDien = ct.SanPham != null ? ct.SanPham.AnhDaiDien : (ct.PhuKien != null ? ct.PhuKien.AnhDaiDien : ""),
                        soLuong = ct.SoLuong,
                        gia = ct.Gia
                    })
                })
                .ToListAsync();

            return Ok(orders);
        }

        // GET: api/admin/orders/{id}
        [HttpGet("orders/{id}")]
        public async Task<ActionResult<object>> GetOrderDetail(int id)
        {
            var order = await _context.DonHangs
                .Include(d => d.NguoiDung)
                .Include(d => d.ChiTietDonHangs)
                    .ThenInclude(ct => ct.SanPham)
                .Include(d => d.ChiTietDonHangs)
                    .ThenInclude(ct => ct.PhuKien)
                .FirstOrDefaultAsync(d => d.MaDonHang == id);

            if (order == null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng với ID = {id}" });
            }

            var result = new
            {
                maDonHang = order.MaDonHang,
                maNguoiDung = order.MaNguoiDung,
                hoTen = order.NguoiDung?.HoTen ?? "Ẩn danh",
                email = order.NguoiDung?.Email ?? "",
                soDienThoai = order.NguoiDung?.SoDienThoai ?? "",
                diaChiGiaoHang = order.DiaChiGiaoHang,
                phuongThucThanhToan = order.PhuongThucThanhToan,
                tongTien = order.TongTien,
                trangThai = order.TrangThai,
                ngayDat = order.NgayDat,
                chiTietDonHangs = order.ChiTietDonHangs.Select(ct => new
                {
                    maChiTiet = ct.MaChiTiet,
                    maSanPham = ct.MaSanPham,
                    maPhuKien = ct.MaPhuKien,
                    tenSanPham = ct.SanPham?.TenSanPham ?? ct.PhuKien?.TenPhuKien ?? "Sản phẩm",
                    anhDaiDien = ct.SanPham?.AnhDaiDien ?? ct.PhuKien?.AnhDaiDien ?? "",
                    soLuong = ct.SoLuong,
                    gia = ct.Gia
                })
            };

            return Ok(result);
        }

        // PUT: api/admin/orders/{id}/status
        [HttpPut("orders/{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest request)
        {
            var order = await _context.DonHangs.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng với ID = {id}" });
            }

            var validStatuses = new[] { "cho_xu_ly", "da_xac_nhan", "dang_giao_hang", "hoan_thanh", "da_huy" };
            if (!validStatuses.Contains(request.TrangThai))
            {
                return BadRequest(new { message = "Trạng thái đơn hàng không hợp lệ. Chấp nhận: cho_xu_ly, da_xac_nhan, dang_giao_hang, hoan_thanh, da_huy." });
            }

            order.TrangThai = request.TrangThai;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật trạng thái đơn hàng thành công!", order });
        }

        // DELETE: api/admin/orders/{id}
        [HttpDelete("orders/{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.DonHangs
                .Include(d => d.ChiTietDonHangs)
                .FirstOrDefaultAsync(d => d.MaDonHang == id);

            if (order == null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng với ID = {id}" });
            }

            if (order.TrangThai != "hoan_thanh" && order.TrangThai != "da_huy")
            {
                foreach (var chiTiet in order.ChiTietDonHangs)
                {
                    if (chiTiet.MaSanPham.HasValue)
                    {
                        var sanPham = await _context.SanPhams.FindAsync(chiTiet.MaSanPham.Value);
                        if (sanPham != null)
                        {
                            sanPham.SoLuongTon += chiTiet.SoLuong;
                        }
                    }
                    else if (chiTiet.MaPhuKien.HasValue)
                    {
                        var phuKien = await _context.PhuKiens.FindAsync(chiTiet.MaPhuKien.Value);
                        if (phuKien != null)
                        {
                            phuKien.SoLuongTon += chiTiet.SoLuong;
                        }
                    }
                }
            }

            _context.DonHangs.Remove(order);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa đơn hàng thành công!" });
        }

        // ==========================================
        // 3. BÁO CÁO THỐNG KÊ (DASHBOARD STATS)
        // ==========================================

        // GET: api/admin/stats hoặc api/admin/dashboard/stats
        [HttpGet("stats")]
        [HttpGet("dashboard/stats")]
        public async Task<ActionResult<object>> GetDashboardStats()
        {
            var totalRevenue = await _context.DonHangs
                .Where(d => d.TrangThai == "hoan_thanh")
                .SumAsync(d => d.TongTien);

            var totalOrders = await _context.DonHangs.CountAsync();
            var totalUsers = await _context.NguoiDungs.CountAsync(u => u.VaiTro == "khach_hang");
            var totalProducts = await _context.SanPhams.CountAsync();
            var newOrders = await _context.DonHangs.CountAsync(d => d.TrangThai == "cho_xu_ly" || d.TrangThai == "cho_xac_nhan");

            var lowStockCount = await _context.SanPhams.CountAsync(s => s.SoLuongTon <= 5);

            var today = DateTime.Today;
            var todayRevenue = await _context.DonHangs
                .Where(d => d.TrangThai == "hoan_thanh" && d.NgayDat >= today)
                .SumAsync(d => d.TongTien);

            var sevenDaysAgo = today.AddDays(-6);
            var dailyRevenue = await _context.DonHangs
                .Where(d => d.TrangThai == "hoan_thanh" && d.NgayDat >= sevenDaysAgo)
                .GroupBy(d => d.NgayDat!.Value.Date)
                .Select(g => new
                {
                    date = g.Key,
                    revenue = g.Sum(d => d.TongTien)
                })
                .ToListAsync();

            var chartList = new List<object>();
            for (var i = 0; i < 7; i++)
            {
                var targetDate = sevenDaysAgo.AddDays(i);
                var found = dailyRevenue.FirstOrDefault(r => r.date == targetDate);
                chartList.Add(new
                {
                    date = targetDate.ToString("dd/MM"),
                    nhan = targetDate.ToString("dd/MM"),
                    name = targetDate.ToString("dd/MM"),
                    doanhThu = found?.revenue ?? 0,
                    giaTri = found?.revenue ?? 0
                });
            }

            var orderStatusCounts = await _context.DonHangs
                .GroupBy(d => d.TrangThai)
                .Select(g => new
                {
                    trangThai = g.Key ?? "Chưa rõ",
                    soLuong = g.Count()
                })
                .ToListAsync();

            var brandSales = await _context.ChiTietDonHangs
                .Include(ct => ct.SanPham)
                    .ThenInclude(sp => sp!.ThuongHieu)
                .Where(ct => ct.SanPham != null && ct.SanPham.ThuongHieu != null)
                .GroupBy(ct => ct.SanPham!.ThuongHieu!.TenThuongHieu)
                .Select(g => new
                {
                    name = g.Key,
                    value = g.Sum(ct => ct.SoLuong)
                })
                .OrderByDescending(x => x.value)
                .Take(5)
                .ToListAsync();

            var recentOrdersList = await _context.DonHangs
                .Include(d => d.NguoiDung)
                .OrderByDescending(d => d.MaDonHang)
                .Take(5)
                .Select(o => new
                {
                    maDonHang = o.MaDonHang,
                    hoTen = o.NguoiDung != null ? o.NguoiDung.HoTen : "Ẩn danh",
                    tongTien = o.TongTien,
                    phuongThucThanhToan = o.PhuongThucThanhToan,
                    ngayDat = o.NgayDat,
                    trangThai = o.TrangThai
                })
                .ToListAsync();

            var stats = new
            {
                tongDoanhThu = totalRevenue,
                tongDonHang = totalOrders,
                tongKhachHang = totalUsers,
                tongSanPham = totalProducts,
                donHangMoi = newOrders,
                doanhThuHomNay = todayRevenue,
                canhBaoSapHetHang = lowStockCount,
                bieuDoDoanhThu = chartList,
                donHangTheoTrangThai = orderStatusCounts,
                thuongHieuBanChay = brandSales,
                donHangGanDay = recentOrdersList
            };

            return Ok(stats);
        }

        // GET: api/admin/promotions
        [HttpGet("promotions")]
        public async Task<ActionResult> GetPromotions()
        {
            var promos = await _context.KhuyenMais.ToListAsync();
            var result = promos.Select(p => new
            {
                id = p.MaKhuyenMai,
                maGiamGia = p.TenKhuyenMai,
                code = p.TenKhuyenMai,
                loaiGiamGia = "percentage",
                type = "percentage",
                giaTriGiam = p.PhanTramGiam,
                discount = p.PhanTramGiam,
                ngayBatDau = p.NgayBatDau,
                ngayKetThuc = p.NgayKetThuc,
                ngayHetHan = p.NgayKetThuc,
                expireDate = p.NgayKetThuc,
                trangThai = p.TrangThai == "hoat_dong" ? "active" : "inactive",
                status = p.TrangThai == "hoat_dong" ? "active" : "inactive"
            });
            return Ok(result);
        }

        public class CreatePromoRequest
        {
            public string? Code { get; set; }
            public string? MaGiamGia { get; set; }
            public string? Type { get; set; }
            public string? LoaiGiamGia { get; set; }
            public decimal? Discount { get; set; }
            public decimal? GiaTriGiam { get; set; }
            public DateTime? NgayBatDau { get; set; }
            public DateTime? NgayKetThuc { get; set; }
            public string? TrangThai { get; set; }
        }

        // POST: api/admin/promotions
        [HttpPost("promotions")]
        public async Task<ActionResult> CreatePromotion([FromBody] CreatePromoRequest request)
        {
            var tenKhuyenMai = request.Code ?? request.MaGiamGia ?? "";
            var phanTramGiam = request.Discount ?? request.GiaTriGiam ?? 0;
            var ngayBatDau = request.NgayBatDau ?? DateTime.Now;
            var ngayKetThuc = request.NgayKetThuc ?? DateTime.Now.AddDays(30);

            var rawStatus = request.TrangThai ?? "hoat_dong";
            var trangThai = rawStatus == "active" ? "hoat_dong" :
                            rawStatus == "inactive" ? "ngung" : rawStatus;

            var promo = new KhuyenMai
            {
                TenKhuyenMai = tenKhuyenMai,
                PhanTramGiam = phanTramGiam,
                NgayBatDau = ngayBatDau,
                NgayKetThuc = ngayKetThuc,
                TrangThai = trangThai
            };

            _context.KhuyenMais.Add(promo);
            await _context.SaveChangesAsync();

            var result = new
            {
                id = promo.MaKhuyenMai,
                maGiamGia = promo.TenKhuyenMai,
                code = promo.TenKhuyenMai,
                loaiGiamGia = "percentage",
                type = "percentage",
                giaTriGiam = promo.PhanTramGiam,
                discount = promo.PhanTramGiam,
                ngayBatDau = promo.NgayBatDau,
                ngayKetThuc = promo.NgayKetThuc,
                ngayHetHan = promo.NgayKetThuc,
                expireDate = promo.NgayKetThuc,
                trangThai = promo.TrangThai == "hoat_dong" ? "active" : "inactive",
                status = promo.TrangThai == "hoat_dong" ? "active" : "inactive"
            };

            return CreatedAtAction(nameof(GetPromotions), result);
        }

        public class UpdatePromoRequest
        {
            public string? Code { get; set; }
            public string? MaGiamGia { get; set; }
            public string? TenKhuyenMai { get; set; }
            public string? Type { get; set; }
            public string? LoaiGiamGia { get; set; }
            public decimal? Discount { get; set; }
            public decimal? GiaTriGiam { get; set; }
            public decimal? PhanTramGiam { get; set; }
            public DateTime? NgayBatDau { get; set; }
            public DateTime? NgayKetThuc { get; set; }
            public string? TrangThai { get; set; }
        }

        // PUT: api/admin/promotions/{id}
        [HttpPut("promotions/{id}")]
        public async Task<IActionResult> UpdatePromotion(int id, [FromBody] UpdatePromoRequest request)
        {
            var promo = await _context.KhuyenMais.FindAsync(id);
            if (promo == null)
            {
                return NotFound(new { message = $"Không tìm thấy khuyến mãi với ID = {id}" });
            }

            var code = request.Code ?? request.MaGiamGia ?? request.TenKhuyenMai;
            if (!string.IsNullOrEmpty(code))
            {
                promo.TenKhuyenMai = code.Trim();
            }

            var discountVal = request.PhanTramGiam ?? request.Discount ?? request.GiaTriGiam;
            if (discountVal.HasValue && discountVal.Value > 0)
            {
                promo.PhanTramGiam = discountVal.Value;
            }

            if (request.NgayBatDau.HasValue)
            {
                promo.NgayBatDau = request.NgayBatDau.Value;
            }

            if (request.NgayKetThuc.HasValue)
            {
                promo.NgayKetThuc = request.NgayKetThuc.Value;
            }

            if (!string.IsNullOrEmpty(request.TrangThai))
            {
                var rawStatus = request.TrangThai.ToLower();
                promo.TrangThai = (rawStatus == "active" || rawStatus == "hoat_dong") ? "hoat_dong" : "ngung";
            }

            await _context.SaveChangesAsync();
            return Ok(promo);
        }

        // DELETE: api/admin/promotions/{id}
        [HttpDelete("promotions/{id}")]
        public async Task<IActionResult> DeletePromotion(int id)
        {
            var promo = await _context.KhuyenMais.FindAsync(id);
            if (promo == null)
            {
                return NotFound(new { message = $"Không tìm thấy khuyến mãi với ID = {id}" });
            }

            // Gỡ bỏ khuyến mãi khỏi các sản phẩm và phụ kiện đang áp dụng
            await _context.Database.ExecuteSqlRawAsync("UPDATE san_pham SET ma_khuyen_mai = NULL WHERE ma_khuyen_mai = {0}", id);
            await _context.Database.ExecuteSqlRawAsync("UPDATE phu_kien SET ma_khuyen_mai = NULL WHERE ma_khuyen_mai = {0}", id);

            _context.KhuyenMais.Remove(promo);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class UpdateRoleRequest
    {
        public string VaiTro { get; set; } = string.Empty;
    }

    public class UpdateStatusRequest
    {
        public string TrangThai { get; set; } = string.Empty;
    }

    public class UpdateOrderStatusRequest
    {
        public string TrangThai { get; set; } = string.Empty;
    }
}