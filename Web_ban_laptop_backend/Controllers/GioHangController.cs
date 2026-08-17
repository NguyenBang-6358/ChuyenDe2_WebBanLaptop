using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_ban_laptop.Data;
using Web_ban_laptop.Entities;

namespace Web_ban_laptop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GioHangController : ControllerBase
    {
        private readonly DataContext _context;

        public GioHangController(DataContext context)
        {
            _context = context;
        }

        // 1. GET: api/GioHang/{maNguoiDung}
        // Lấy thông tin giỏ hàng kèm danh sách sản phẩm/phụ kiện chi tiết của người dùng
        [HttpGet("{maNguoiDung}")]
        public async Task<ActionResult<GioHang>> GetGioHang(int maNguoiDung)
        {
            var gioHang = await _context.GioHangs
                .Include(g => g.ChiTietGioHangs)
                    .ThenInclude(c => c.SanPham)
                .Include(g => g.ChiTietGioHangs)
                    .ThenInclude(c => c.PhuKien)
                .FirstOrDefaultAsync(g => g.MaNguoiDung == maNguoiDung);

            if (gioHang == null)
            {
                return NotFound(new { message = $"Người dùng với ID = {maNguoiDung} chưa có giỏ hàng nào." });
            }

            return Ok(gioHang);
        }

        // 2. POST: api/GioHang/them
        // Thêm sản phẩm hoặc phụ kiện vào giỏ hàng (Tạo mới giỏ hàng nếu chưa có, cộng dồn số lượng nếu đã tồn tại)
        [HttpPost("them")]
        public async Task<IActionResult> AddToCart([FromBody] CartItemRequest dto)
        {
            if (dto == null)
            {
                return BadRequest(new { message = "Dữ liệu yêu cầu không hợp lệ." });
            }

            if (dto.SoLuong <= 0)
            {
                return BadRequest(new { message = "Số lượng sản phẩm thêm vào giỏ hàng phải lớn hơn 0." });
            }

            // BẮT BUỘC: Kiểm tra tính hợp lệ (XOR logic)
            if (dto.MaSanPham.HasValue == dto.MaPhuKien.HasValue)
            {
                return BadRequest(new { message = "Yêu cầu phải chứa MaSanPham hoặc MaPhuKien, không được chứa cả hai hoặc không chứa cái nào." });
            }

            // Kiểm tra xem sản phẩm hoặc phụ kiện có tồn tại trong hệ thống không
            if (dto.MaSanPham.HasValue)
            {
                var sanPhamExists = await _context.SanPhams.AnyAsync(s => s.MaSanPham == dto.MaSanPham.Value);
                if (!sanPhamExists)
                {
                    return NotFound(new { message = $"Không tìm thấy sản phẩm với ID = {dto.MaSanPham.Value} để thêm vào giỏ hàng." });
                }
            }
            else if (dto.MaPhuKien.HasValue)
            {
                var phuKienExists = await _context.PhuKiens.AnyAsync(p => p.MaPhuKien == dto.MaPhuKien.Value);
                if (!phuKienExists)
                {
                    return NotFound(new { message = $"Không tìm thấy phụ kiện với ID = {dto.MaPhuKien.Value} để thêm vào giỏ hàng." });
                }
            }

            // Kiểm tra xem Người dùng có tồn tại không
            var nguoiDungExists = await _context.NguoiDungs.AnyAsync(n => n.MaNguoiDung == dto.MaNguoiDung);
            if (!nguoiDungExists)
            {
                return NotFound(new { message = $"Không tìm thấy người dùng với ID = {dto.MaNguoiDung}." });
            }

            // Tìm giỏ hàng của người dùng
            var gioHang = await _context.GioHangs
                .FirstOrDefaultAsync(g => g.MaNguoiDung == dto.MaNguoiDung);

            // Nếu người dùng chưa có giỏ hàng, tiến hành tạo mới
            if (gioHang == null)
            {
                gioHang = new GioHang
                {
                    MaNguoiDung = dto.MaNguoiDung,
                    NgayTao = DateTime.Now
                };
                _context.GioHangs.Add(gioHang);
                await _context.SaveChangesAsync(); // Lưu để sinh ra mã giỏ hàng (MaGioHang)
            }

            // Tìm xem sản phẩm/phụ kiện này đã có trong chi tiết giỏ hàng chưa
            ChiTietGioHang? chiTiet = null;
            if (dto.MaSanPham.HasValue)
            {
                chiTiet = await _context.ChiTietGioHangs
                    .FirstOrDefaultAsync(c => c.MaGioHang == gioHang.MaGioHang && c.MaSanPham == dto.MaSanPham.Value);
            }
            else if (dto.MaPhuKien.HasValue)
            {
                chiTiet = await _context.ChiTietGioHangs
                    .FirstOrDefaultAsync(c => c.MaGioHang == gioHang.MaGioHang && c.MaPhuKien == dto.MaPhuKien.Value);
            }

            if (chiTiet != null)
            {
                // Nếu đã có, tiến hành cộng dồn số lượng
                chiTiet.SoLuong = (chiTiet.SoLuong ?? 0) + dto.SoLuong;
            }
            else
            {
                // Nếu chưa có, tạo mới dòng chi tiết giỏ hàng
                chiTiet = new ChiTietGioHang
                {
                    MaGioHang = gioHang.MaGioHang,
                    MaSanPham = dto.MaSanPham,
                    MaPhuKien = dto.MaPhuKien,
                    SoLuong = dto.SoLuong
                };
                _context.ChiTietGioHangs.Add(chiTiet);
            }

            await _context.SaveChangesAsync();

            // Trả về thông tin giỏ hàng mới nhất sau khi thêm thành công
            var updatedGioHang = await _context.GioHangs
                .Include(g => g.ChiTietGioHangs)
                    .ThenInclude(c => c.SanPham)
                .Include(g => g.ChiTietGioHangs)
                    .ThenInclude(c => c.PhuKien)
                .FirstOrDefaultAsync(g => g.MaGioHang == gioHang.MaGioHang);

            return Ok(new 
            { 
                message = "Thêm vào giỏ hàng thành công.", 
                data = updatedGioHang 
            });
        }

        // 3. DELETE: api/GioHang/xoa/{maChiTiet}
        // Xóa một dòng sản phẩm/phụ kiện ra khỏi bảng chi tiết giỏ hàng
        [HttpDelete("xoa/{maChiTiet}")]
        public async Task<IActionResult> DeleteCartItem(int maChiTiet)
        {
            var chiTiet = await _context.ChiTietGioHangs.FindAsync(maChiTiet);

            if (chiTiet == null)
            {
                return NotFound(new { message = $"Không tìm thấy chi tiết giỏ hàng với ID = {maChiTiet}" });
            }

            _context.ChiTietGioHangs.Remove(chiTiet);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa sản phẩm/phụ kiện khỏi giỏ hàng thành công." });
        }
    }
}
