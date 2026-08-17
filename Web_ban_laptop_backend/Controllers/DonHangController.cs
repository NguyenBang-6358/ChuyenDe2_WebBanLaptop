using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_ban_laptop.Data;
using Web_ban_laptop.Entities;

namespace Web_ban_laptop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DonHangController : ControllerBase
    {
        private readonly DataContext _context;

        public DonHangController(DataContext context)
        {
            _context = context;
        }

        // GET: api/DonHang
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DonHang>>> GetDonHangs()
        {
            return await _context.DonHangs
                .Include(d => d.NguoiDung)
                .Include(d => d.ChiTietDonHangs)
                    .ThenInclude(ct => ct.SanPham)
                .Include(d => d.ChiTietDonHangs)
                    .ThenInclude(ct => ct.PhuKien)
                .ToListAsync();
        }

        // GET: api/DonHang/5
        [HttpGet("{id}")]
        public async Task<ActionResult<DonHang>> GetDonHang(int id)
        {
            var donHang = await _context.DonHangs
                .Include(d => d.NguoiDung)
                .Include(d => d.ChiTietDonHangs)
                    .ThenInclude(ct => ct.SanPham)
                .Include(d => d.ChiTietDonHangs)
                    .ThenInclude(ct => ct.PhuKien)
                .FirstOrDefaultAsync(d => d.MaDonHang == id);

            if (donHang == null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng với ID = {id}" });
            }

            return donHang;
        }

        // POST: api/DonHang
        [HttpPost]
        public async Task<IActionResult> CreateDonHang([FromBody] DatHangDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { message = "Dữ liệu đặt hàng không hợp lệ." });
            }

            // Bước 1: Kiểm tra người dùng có tồn tại trong hệ thống không
            var nguoiDungExists = await _context.NguoiDungs.AnyAsync(n => n.MaNguoiDung == dto.MaNguoiDung);
            if (!nguoiDungExists)
            {
                return BadRequest(new { message = $"Người dùng với ID = {dto.MaNguoiDung} không tồn tại trên hệ thống." });
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Bước 2: Truy vấn bảng gio_hang và nạp danh sách chi_tiet_gio_hang của user này
                var gioHang = await _context.GioHangs
                    .Include(g => g.ChiTietGioHangs)
                        .ThenInclude(c => c.SanPham)
                    .Include(g => g.ChiTietGioHangs)
                        .ThenInclude(c => c.PhuKien)
                    .FirstOrDefaultAsync(g => g.MaNguoiDung == dto.MaNguoiDung);

                if (gioHang == null || gioHang.ChiTietGioHangs == null || !gioHang.ChiTietGioHangs.Any())
                {
                    return BadRequest(new { message = "Giỏ hàng của bạn đang trống!" });
                }

                // Bước 3: Khởi tạo thực thể DonHang mới và gán giá trị
                var donHang = new DonHang
                {
                    MaNguoiDung = dto.MaNguoiDung,
                    DiaChiGiaoHang = dto.DiaChiGiaoHang,
                    PhuongThucThanhToan = dto.PhuongThucThanhToan,
                    TrangThai = "cho_xac_nhan",
                    NgayDat = DateTime.Now,
                    TongTien = 0 // Sẽ tính toán cộng dồn ở dưới
                };

                // Tính toán tổng tiền của đơn hàng
                decimal computedTongTien = 0;
                foreach (var item in gioHang.ChiTietGioHangs)
                {
                    // BẮT BUỘC: Kiểm tra tính hợp lệ (XOR logic)
                    if (item.MaSanPham.HasValue == item.MaPhuKien.HasValue)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new { message = "Chi tiết giỏ hàng không hợp lệ (mỗi mục chỉ được là Laptop hoặc Phụ kiện)." });
                    }

                    if (item.MaSanPham.HasValue)
                    {
                        if (item.SanPham != null)
                        {
                            computedTongTien += (item.SoLuong ?? 0) * item.SanPham.Gia;
                        }
                    }
                    else if (item.MaPhuKien.HasValue)
                    {
                        if (item.PhuKien != null)
                        {
                            computedTongTien += (item.SoLuong ?? 0) * item.PhuKien.Gia;
                        }
                    }
                }
                donHang.TongTien = computedTongTien;

                _context.DonHangs.Add(donHang);
                await _context.SaveChangesAsync(); // Lưu để sinh ra ma_don_hang (MaDonHang)

                // Bước 4: Duyệt qua từng item trong chi_tiet_gio_hang để lưu chi tiết đơn hàng và cập nhật tồn kho
                foreach (var item in gioHang.ChiTietGioHangs)
                {
                    decimal itemGia = 0;
                    int soLuongDat = item.SoLuong ?? 0;

                    if (item.MaSanPham.HasValue)
                    {
                        if (item.SanPham == null)
                        {
                            await transaction.RollbackAsync();
                            return BadRequest(new { message = "Có sản phẩm trong giỏ hàng không tồn tại trên hệ thống." });
                        }

                        if (soLuongDat > item.SanPham.SoLuongTon)
                        {
                            await transaction.RollbackAsync();
                            return BadRequest(new { message = $"Sản phẩm '{item.SanPham.TenSanPham}' không đủ hàng tồn kho!" });
                        }

                        // Trừ bớt số lượng tồn kho của sản phẩm
                        item.SanPham.SoLuongTon -= soLuongDat;
                        itemGia = item.SanPham.Gia;
                    }
                    else if (item.MaPhuKien.HasValue)
                    {
                        if (item.PhuKien == null)
                        {
                            await transaction.RollbackAsync();
                            return BadRequest(new { message = "Có phụ kiện trong giỏ hàng không tồn tại trên hệ thống." });
                        }

                        if (soLuongDat > item.PhuKien.SoLuongTon)
                        {
                            await transaction.RollbackAsync();
                            return BadRequest(new { message = $"Phụ kiện '{item.PhuKien.TenPhuKien}' không đủ hàng tồn kho!" });
                        }

                        // Trừ bớt số lượng tồn kho của phụ kiện
                        item.PhuKien.SoLuongTon -= soLuongDat;
                        itemGia = item.PhuKien.Gia;
                    }

                    // Tạo thực thể ChiTietDonHang mới
                    var chiTietDonHang = new ChiTietDonHang
                    {
                        MaDonHang = donHang.MaDonHang,
                        MaSanPham = item.MaSanPham,
                        MaPhuKien = item.MaPhuKien,
                        SoLuong = soLuongDat,
                        Gia = itemGia // Lưu lại giá tại thời điểm mua
                    };
                    _context.ChiTietDonHangs.Add(chiTietDonHang);
                }

                // Bước 5: Xóa sạch toàn bộ các dòng chi_tiet_gio_hang cũ của người dùng này
                _context.ChiTietGioHangs.RemoveRange(gioHang.ChiTietGioHangs);
                await _context.SaveChangesAsync();

                // Bước 6: Commit Transaction bất đồng bộ
                await transaction.CommitAsync();

                return Ok(new { message = "Đặt hàng thành công!", maDonHang = donHang.MaDonHang });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "Lỗi hệ thống khi xử lý đặt hàng từ giỏ hàng.", error = ex.Message });
            }
        }

        // PUT: api/DonHang/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDonHang(int id, DonHang donHang)
        {
            if (id != donHang.MaDonHang)
            {
                return BadRequest(new { message = "ID trong URL và ID của đối tượng không khớp" });
            }

            var existingDonHang = await _context.DonHangs.FindAsync(id);
            if (existingDonHang == null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng với ID = {id}" });
            }

            existingDonHang.TrangThai = donHang.TrangThai;
            existingDonHang.DiaChiGiaoHang = donHang.DiaChiGiaoHang;
            existingDonHang.PhuongThucThanhToan = donHang.PhuongThucThanhToan;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await DonHangExists(id))
                {
                    return NotFound(new { message = $"Không tìm thấy đơn hàng với ID = {id}" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/DonHang/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDonHang(int id)
        {
            var donHang = await _context.DonHangs
                .Include(d => d.ChiTietDonHangs)
                .FirstOrDefaultAsync(d => d.MaDonHang == id);

            if (donHang == null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn hàng với ID = {id}" });
            }

            if (donHang.TrangThai != "hoan_thanh" && donHang.TrangThai != "da_huy")
            {
                foreach (var chiTiet in donHang.ChiTietDonHangs)
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

            _context.DonHangs.Remove(donHang);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<bool> DonHangExists(int id)
        {
            return await _context.DonHangs.AnyAsync(e => e.MaDonHang == id);
        }
    }
}
