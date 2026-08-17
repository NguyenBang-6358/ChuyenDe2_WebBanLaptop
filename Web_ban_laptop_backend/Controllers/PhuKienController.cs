using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Web_ban_laptop.Data;
using Web_ban_laptop.Entities;
using Web_ban_laptop.Services;

namespace Web_ban_laptop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhuKienController : ControllerBase
    {
        private readonly IPhuKienService _phuKienService;
        private readonly DataContext _context;

        public PhuKienController(IPhuKienService phuKienService, DataContext context)
        {
            _phuKienService = phuKienService;
            _context = context;
        }

        // GET: api/PhuKien
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PhuKien>>> GetAll()
        {
            var phuKiens = await _phuKienService.GetAllAsync();
            // Gán thống kê đánh giá thật từ bảng danh_gia
            await GanThongKeDanhGiaAsync(phuKiens);
            return Ok(phuKiens);
        }

        // GET: api/PhuKien/types
        [HttpGet("types")]
        public async Task<ActionResult<IEnumerable<string>>> GetAccessoryTypes()
        {
            var types = await _context.PhuKiens
                .Where(pk => pk.LoaiPhuKien != null && pk.LoaiPhuKien != "")
                .Select(pk => pk.LoaiPhuKien)
                .Distinct()
                .ToListAsync();
            return Ok(types);
        }

        // GET: api/PhuKien/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PhuKien>> GetById(int id)
        {
            var phuKien = await _phuKienService.GetByIdAsync(id);
            if (phuKien == null)
            {
                return NotFound(new { message = $"Không tìm thấy phụ kiện với ID = {id}" });
            }
            // Gán thống kê đánh giá thật
            await GanThongKeDanhGiaAsync(new[] { phuKien });
            return Ok(phuKien);
        }

        // GET: api/PhuKien/{id}/related
        [HttpGet("{id}/related")]
        public async Task<ActionResult<IEnumerable<PhuKien>>> GetRelated(int id)
        {
            var current = await _context.PhuKiens
                .AsNoTracking()
                .Select(pk => new { pk.MaPhuKien, pk.LoaiPhuKien })
                .FirstOrDefaultAsync(pk => pk.MaPhuKien == id);

            if (current == null)
            {
                return NotFound(new { message = $"Không tìm thấy phụ kiện với ID = {id}" });
            }

            var related = await _context.PhuKiens
                .Include(pk => pk.KhuyenMai)
                .Where(pk => pk.LoaiPhuKien == current.LoaiPhuKien && pk.MaPhuKien != id)
                .OrderByDescending(pk => pk.NgayTao)
                .Take(15)
                .ToListAsync();

            await GanThongKeDanhGiaAsync(related);
            return Ok(related);
        }

        // POST: api/PhuKien
        [HttpPost]
        public async Task<ActionResult<PhuKien>> Create([FromBody] PhuKienDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (dto.MaKhuyenMai.HasValue)
            {
                var khuyenMaiExists = await _context.KhuyenMais.AnyAsync(k => k.MaKhuyenMai == dto.MaKhuyenMai.Value);
                if (!khuyenMaiExists)
                {
                    return BadRequest(new { message = $"Mã khuyến mãi {dto.MaKhuyenMai} không tồn tại trong hệ thống." });
                }
            }

            try
            {
                var phuKien = await _phuKienService.CreateAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = phuKien.MaPhuKien }, phuKien);
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tạo phụ kiện mới.", error = ex.Message });
            }
        }

        // PUT: api/PhuKien/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] PhuKienDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (dto.MaKhuyenMai.HasValue)
            {
                var khuyenMaiExists = await _context.KhuyenMais.AnyAsync(k => k.MaKhuyenMai == dto.MaKhuyenMai.Value);
                if (!khuyenMaiExists)
                {
                    return BadRequest(new { message = $"Mã khuyến mãi {dto.MaKhuyenMai} không tồn tại trong hệ thống." });
                }
            }

            try
            {
                var success = await _phuKienService.UpdateAsync(id, dto);
                if (!success)
                {
                    return NotFound(new { message = $"Không tìm thấy phụ kiện với ID = {id} để cập nhật." });
                }
                return NoContent();
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi cập nhật phụ kiện.", error = ex.Message });
            }
        }

        // DELETE: api/PhuKien/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var success = await _phuKienService.DeleteAsync(id);
                if (!success)
                {
                    return NotFound(new { message = $"Không tìm thấy phụ kiện với ID = {id} để xóa." });
                }
                return NoContent();
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi xóa phụ kiện.", error = ex.Message });
            }
        }

        /// <summary>
        /// Tương tự GanThongKeDanhGiaAsync trong SanPhamController nhưng cho PhuKien.
        /// Query bảng danh_gia theo MaPhuKien, tính SoLuong và DiemTb, gán vào entity
        /// (field [NotMapped] - không lưu DB, chỉ xuất JSON).
        /// </summary>
        private async Task GanThongKeDanhGiaAsync(IEnumerable<PhuKien> phuKiens)
        {
            var ids = phuKiens.Select(pk => pk.MaPhuKien).ToList();
            if (ids.Count == 0) return;

            var stats = await _context.DanhGias
                .Where(d => d.MaPhuKien != null && ids.Contains(d.MaPhuKien.Value) && d.SoSao != null && d.TrangThai == "hien_thi")
                .GroupBy(d => d.MaPhuKien)
                .Select(g => new
                {
                    MaPhuKien = g.Key!.Value,
                    SoLuong   = g.Count(),
                    DiemTb    = g.Average(d => (double)d.SoSao!.Value),
                })
                .ToListAsync();

            var map = stats.ToDictionary(s => s.MaPhuKien);

            foreach (var pk in phuKiens)
            {
                if (map.TryGetValue(pk.MaPhuKien, out var s))
                {
                    pk.SoLuongDanhGia        = s.SoLuong;
                    pk.DiemDanhGiaTrungBinh  = Math.Round(s.DiemTb, 1);
                }
                else
                {
                    pk.SoLuongDanhGia        = 0;
                    pk.DiemDanhGiaTrungBinh  = 0;
                }
            }
        }
    }
}
