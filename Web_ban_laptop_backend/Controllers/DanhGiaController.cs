using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Web_ban_laptop.Data;
using Web_ban_laptop.Entities;

namespace Web_ban_laptop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DanhGiaController : ControllerBase
    {
        private readonly DataContext _context;

        public DanhGiaController(DataContext context)
        {
            _context = context;
        }

        // GET: api/DanhGia?maSanPham=1 hoặc api/DanhGia?maPhuKien=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetReviews(
            [FromQuery] int? maSanPham, 
            [FromQuery] int? maPhuKien)
        {
            if (maSanPham.HasValue == maPhuKien.HasValue)
            {
                return BadRequest(new { message = "Yêu cầu phải chứa maSanPham hoặc maPhuKien, không được chứa cả hai hoặc không chứa cái nào." });
            }

            var query = _context.DanhGias.AsNoTracking().Where(d => d.TrangThai == "hien_thi");

            if (maSanPham.HasValue)
            {
                query = query.Where(d => d.MaSanPham == maSanPham);
            }
            else
            {
                query = query.Where(d => d.MaPhuKien == maPhuKien);
            }

            var list = await query
                .Include(d => d.NguoiDung)
                .OrderByDescending(d => d.NgayDanhGia)
                .Select(d => new
                {
                    maDanhGia = d.MaDanhGia,
                    soSao = d.SoSao ?? 0,
                    noiDung = d.NoiDung ?? "",
                    ngayDanhGia = d.NgayDanhGia,
                    tenNguoiDung = d.NguoiDung != null ? d.NguoiDung.HoTen : "Khách",
                    anhDaiDien = d.NguoiDung != null ? d.NguoiDung.AnhDaiDien : null,
                    phanHoiCuaAdmin = d.PhanHoiCuaAdmin
                })
                .ToListAsync();

            return Ok(list);
        }

        // POST: api/DanhGia
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new { message = "Dữ liệu yêu cầu không hợp lệ." });
            }

            if (dto.SoSao < 1 || dto.SoSao > 5)
            {
                return BadRequest(new { message = "Số sao đánh giá phải từ 1 đến 5." });
            }

            if (dto.MaSanPham.HasValue && dto.MaPhuKien.HasValue)
            {
                return BadRequest(new { message = "Chỉ được đánh giá sản phẩm hoặc phụ kiện, không gửi cả hai." });
            }

            if (!dto.MaSanPham.HasValue && !dto.MaPhuKien.HasValue)
            {
                return BadRequest(new { message = "Vui lòng cung cấp mã sản phẩm hoặc mã phụ kiện để đánh giá." });
            }

            // Trích xuất ma_nguoi_dung từ Claims
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int maNguoiDung))
            {
                return Unauthorized(new { message = "Không xác định được người dùng." });
            }

            // Kiểm tra xem người dùng có tồn tại không
            var userExists = await _context.NguoiDungs.AnyAsync(u => u.MaNguoiDung == maNguoiDung);
            if (!userExists)
            {
                return NotFound(new { message = "Người dùng không tồn tại trên hệ thống." });
            }

            if (dto.MaSanPham.HasValue)
            {
                // Kiểm tra xem sản phẩm có tồn tại không
                var productExists = await _context.SanPhams.AnyAsync(s => s.MaSanPham == dto.MaSanPham.Value);
                if (!productExists)
                {
                    return NotFound(new { message = "Sản phẩm không tồn tại." });
                }
            }
            else if (dto.MaPhuKien.HasValue)
            {
                // Kiểm tra xem phụ kiện có tồn tại không
                var accessoryExists = await _context.PhuKiens.AnyAsync(p => p.MaPhuKien == dto.MaPhuKien.Value);
                if (!accessoryExists)
                {
                    return NotFound(new { message = "Phụ kiện không tồn tại." });
                }
            }

            var danhGia = new DanhGia
            {
                MaNguoiDung = maNguoiDung,
                MaSanPham = dto.MaSanPham,
                MaPhuKien = dto.MaPhuKien,
                SoSao = dto.SoSao,
                NoiDung = dto.NoiDung,
                NgayDanhGia = DateTime.Now,
                TrangThai = "hien_thi"
            };

            _context.DanhGias.Add(danhGia);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Gửi đánh giá thành công!", maDanhGia = danhGia.MaDanhGia });
        }

        // GET: api/DanhGia/admin
        [HttpGet("admin")]
        public async Task<ActionResult<IEnumerable<object>>> GetReviewsForAdmin()
        {
            var list = await _context.DanhGias
                .AsNoTracking()
                .Include(d => d.NguoiDung)
                .Include(d => d.SanPham)
                .Include(d => d.PhuKien)
                .OrderByDescending(d => d.NgayDanhGia)
                .Select(d => new
                {
                    maDanhGia = d.MaDanhGia,
                    soSao = d.SoSao ?? 0,
                    noiDung = d.NoiDung ?? "",
                    ngayDanhGia = d.NgayDanhGia,
                    trangThai = d.TrangThai,
                    phanHoiCuaAdmin = d.PhanHoiCuaAdmin,
                    maNguoiDung = d.MaNguoiDung,
                    hoTenNguoiDung = d.NguoiDung != null ? d.NguoiDung.HoTen : "Khách",
                    emailNguoiDung = d.NguoiDung != null ? d.NguoiDung.Email : "",
                    anhDaiDienNguoiDung = d.NguoiDung != null ? d.NguoiDung.AnhDaiDien : null,
                    maSanPham = d.MaSanPham,
                    tenSanPham = d.SanPham != null ? d.SanPham.TenSanPham : null,
                    maPhuKien = d.MaPhuKien,
                    tenPhuKien = d.PhuKien != null ? d.PhuKien.TenPhuKien : null,
                    tenItem = d.SanPham != null ? d.SanPham.TenSanPham : (d.PhuKien != null ? d.PhuKien.TenPhuKien : "Sản phẩm")
                })
                .ToListAsync();

            return Ok(list);
        }

        public class UpdateReviewAdminDto
        {
            public string? TrangThai { get; set; }
            public string? PhanHoiCuaAdmin { get; set; }
        }

        // PUT: api/DanhGia/admin/{id}
        [HttpPut("admin/{id}")]
        public async Task<IActionResult> UpdateReviewAdmin(int id, [FromBody] UpdateReviewAdminDto dto)
        {
            var dbReview = await _context.DanhGias.FindAsync(id);
            if (dbReview == null)
            {
                return NotFound(new { message = "Không tìm thấy đánh giá này." });
            }

            if (dto.TrangThai != null)
            {
                if (dto.TrangThai != "hien_thi" && dto.TrangThai != "an")
                {
                    return BadRequest(new { message = "Trạng thái chỉ có thể là 'hien_thi' hoặc 'an'." });
                }
                dbReview.TrangThai = dto.TrangThai;
            }

            dbReview.PhanHoiCuaAdmin = dto.PhanHoiCuaAdmin;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật đánh giá thành công!", review = dbReview });
        }

        // DELETE: api/DanhGia/admin/{id}
        [HttpDelete("admin/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteReviewAdmin(int id)
        {
            var dbReview = await _context.DanhGias.FindAsync(id);
            if (dbReview == null)
            {
                return NotFound(new { message = "Không tìm thấy đánh giá này." });
            }

            _context.DanhGias.Remove(dbReview);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Xóa đánh giá vĩnh viễn thành công!" });
        }
    }

    public class CreateReviewDto
    {
        public int? MaSanPham { get; set; }
        public int? MaPhuKien { get; set; }
        public int SoSao { get; set; }
        public string NoiDung { get; set; } = string.Empty;
    }
}
