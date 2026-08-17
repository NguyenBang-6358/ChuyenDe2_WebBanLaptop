using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_ban_laptop.Data;
using Web_ban_laptop.Entities;

namespace Web_ban_laptop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SanPhamController : ControllerBase
    {
        private readonly DataContext _context;

        public SanPhamController(DataContext context)
        {
            _context = context;
        }

        // GET: api/SanPham
        [HttpGet]
        public async Task<ActionResult<IEnumerable<SanPham>>> GetSanPhams()
        {
            var sanPhams = await _context.SanPhams
                .Include(s => s.ThuongHieu)
                .Include(s => s.DanhMuc)
                .Include(s => s.KhuyenMai)
                .Include(s => s.HinhAnhSanPhams)
                .ToListAsync();

            await GanThongKeDanhGiaAsync(sanPhams);
            return sanPhams;
        }

                // GET: api/SanPham/5/related
        [HttpGet("{id}/related")]
        public async Task<ActionResult<IEnumerable<SanPham>>> GetRelated(int id)
        {
            var sp = await _context.SanPhams.FindAsync(id);
            if (sp == null)
            {
                return NotFound(new { message = $"Không tìm thấy sản phẩm với ID = {id}" });
            }

            var related = await _context.SanPhams
                .Include(s => s.ThuongHieu)
                .Include(s => s.DanhMuc)
                .Include(s => s.KhuyenMai)
                .Include(s => s.HinhAnhSanPhams)
                .Where(s => s.MaSanPham != id && (s.MaThuongHieu == sp.MaThuongHieu || s.MaDanhMuc == sp.MaDanhMuc))
                .Take(8)
                .ToListAsync();

            if (related.Count < 4)
            {
                var existingIds = related.Select(r => r.MaSanPham).Concat(new[] { id }).ToList();
                var more = await _context.SanPhams
                    .Include(s => s.ThuongHieu)
                    .Include(s => s.DanhMuc)
                    .Include(s => s.KhuyenMai)
                    .Include(s => s.HinhAnhSanPhams)
                    .Where(s => !existingIds.Contains(s.MaSanPham))
                    .Take(8 - related.Count)
                    .ToListAsync();
                related.AddRange(more);
            }

            await GanThongKeDanhGiaAsync(related);
            return Ok(related);
        }

        // GET: api/SanPham/5
        [HttpGet("{id}")]
        public async Task<ActionResult<SanPham>> GetSanPham(int id)
        {
            var sanPham = await _context.SanPhams
                .Include(s => s.ThuongHieu)
                .Include(s => s.DanhMuc)
                .Include(s => s.KhuyenMai)
                .Include(s => s.HinhAnhSanPhams)
                .FirstOrDefaultAsync(s => s.MaSanPham == id);

            if (sanPham == null)
            {
                return NotFound(new { message = $"Không tìm thấy sản phẩm với ID = {id}" });
            }

            await GanThongKeDanhGiaAsync(new[] { sanPham });
            return sanPham;
        }

        // POST: api/SanPham
        [HttpPost]
        public async Task<ActionResult<SanPham>> CreateSanPham(SanPham sanPham)
        {
            var thuongHieuExists = await _context.ThuongHieus.AnyAsync(th => th.MaThuongHieu == sanPham.MaThuongHieu);
            if (!thuongHieuExists)
            {
                return BadRequest(new { message = $"Mã thương hiệu {sanPham.MaThuongHieu} không tồn tại trong hệ thống." });
            }

            var danhMucExists = await _context.DanhMucs.AnyAsync(dm => dm.MaDanhMuc == sanPham.MaDanhMuc);
            if (!danhMucExists)
            {
                return BadRequest(new { message = $"Mã danh mục {sanPham.MaDanhMuc} không tồn tại trong hệ thống." });
            }

            if (sanPham.MaKhuyenMai.HasValue)
            {
                var khuyenMaiExists = await _context.KhuyenMais.AnyAsync(k => k.MaKhuyenMai == sanPham.MaKhuyenMai.Value);
                if (!khuyenMaiExists)
                {
                    return BadRequest(new { message = $"Mã khuyến mãi {sanPham.MaKhuyenMai} không tồn tại trong hệ thống." });
                }
            }

            if (sanPham.HinhAnhSanPhams != null)
            {
                sanPham.HinhAnhSanPhams = sanPham.HinhAnhSanPhams
                    .Where(img => !string.IsNullOrWhiteSpace(img.DuongDanAnh))
                    .ToList();
            }
            _context.SanPhams.Add(sanPham);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSanPham), new { id = sanPham.MaSanPham }, sanPham);
        }

        // PUT: api/SanPham/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSanPham(int id, SanPham sanPham)
        {
            if (id != sanPham.MaSanPham)
            {
                return BadRequest(new { message = "ID trong URL và ID của đối tượng không khớp" });
            }

            if (!string.IsNullOrEmpty(sanPham.MaThuongHieu))
            {
                var thuongHieuExists = await _context.ThuongHieus.AnyAsync(th => th.MaThuongHieu == sanPham.MaThuongHieu);
                if (!thuongHieuExists)
                {
                    return BadRequest(new { message = $"Mã thương hiệu {sanPham.MaThuongHieu} không tồn tại." });
                }
            }

            if (sanPham.MaDanhMuc > 0)
            {
                var danhMucExists = await _context.DanhMucs.AnyAsync(dm => dm.MaDanhMuc == sanPham.MaDanhMuc);
                if (!danhMucExists)
                {
                    return BadRequest(new { message = $"Mã danh mục {sanPham.MaDanhMuc} không tồn tại." });
                }
            }

            if (sanPham.MaKhuyenMai.HasValue)
            {
                var khuyenMaiExists = await _context.KhuyenMais.AnyAsync(k => k.MaKhuyenMai == sanPham.MaKhuyenMai.Value);
                if (!khuyenMaiExists)
                {
                    return BadRequest(new { message = $"Mã khuyến mãi {sanPham.MaKhuyenMai} không tồn tại." });
                }
            }

            var existingSanPham = await _context.SanPhams
                .Include(sp => sp.HinhAnhSanPhams)
                .FirstOrDefaultAsync(sp => sp.MaSanPham == id);

            if (existingSanPham == null)
            {
                return NotFound(new { message = $"Không tìm thấy sản phẩm với ID = {id}" });
            }

            _context.Entry(existingSanPham).CurrentValues.SetValues(sanPham);

            if (sanPham.HinhAnhSanPhams != null)
            {
                var validNewImages = sanPham.HinhAnhSanPhams
                    .Where(img => !string.IsNullOrWhiteSpace(img.DuongDanAnh))
                    .ToList();

                _context.HinhAnhSanPhams.RemoveRange(existingSanPham.HinhAnhSanPhams);
                foreach (var img in validNewImages)
                {
                    existingSanPham.HinhAnhSanPhams.Add(new HinhAnhSanPham
                    {
                        MaSanPham = id,
                        DuongDanAnh = img.DuongDanAnh.Trim()
                    });
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await SanPhamExists(id))
                {
                    return NotFound(new { message = $"Không tìm thấy sản phẩm với ID = {id}" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // GET: api/SanPham/flash-sale
        [HttpGet("flash-sale")]
        public async Task<ActionResult<IEnumerable<FlashSaleItemDto>>> GetFlashSaleProducts()
        {
            var now = DateTime.Now;
            var laptops = await _context.SanPhams
                .Include(s => s.KhuyenMai)
                .Include(s => s.HinhAnhSanPhams)
                .Where(s => s.KhuyenMai != null && (s.KhuyenMai.TrangThai == "hoat_dong" || s.KhuyenMai.TrangThai == "active" || s.KhuyenMai.TrangThai == null) && (!s.KhuyenMai.NgayBatDau.HasValue || s.KhuyenMai.NgayBatDau.Value <= now) && (!s.KhuyenMai.NgayKetThuc.HasValue || s.KhuyenMai.NgayKetThuc.Value >= now))
                .ToListAsync();

            var accessories = await _context.PhuKiens
                .Include(p => p.KhuyenMai)
                .Where(p => p.KhuyenMai != null && (p.KhuyenMai.TrangThai == "hoat_dong" || p.KhuyenMai.TrangThai == "active" || p.KhuyenMai.TrangThai == null) && (!p.KhuyenMai.NgayBatDau.HasValue || p.KhuyenMai.NgayBatDau.Value <= now) && (!p.KhuyenMai.NgayKetThuc.HasValue || p.KhuyenMai.NgayKetThuc.Value >= now))
                .ToListAsync();

            var laptopDtos = laptops.Select(s => new FlashSaleItemDto
            {
                Id = s.MaSanPham,
                Ten = s.TenSanPham,
                HinhAnh = s.AnhDaiDien,
                GiaGoc = s.GiaGoc,
                GiaKhuyenMai = s.GiaKhuyenMai,
                PhanTramGiam = s.PhanTramGiam,
                LoaiSanPham = "laptop",
                NgayKetThuc = s.KhuyenMai?.NgayKetThuc,
                Cpu = s.Cpu,
                Ram = s.Ram,
                OCung = s.OCung,
                CardDoHoa = s.CardDoHoa,
                ManHinh = s.ManHinh,
                Pin = s.Pin,
                HeDieuHanh = s.HeDieuHanh
            });

            var accessoryDtos = accessories.Select(p => new FlashSaleItemDto
            {
                Id = p.MaPhuKien,
                Ten = p.TenPhuKien,
                HinhAnh = p.AnhDaiDien,
                GiaGoc = p.GiaGoc,
                GiaKhuyenMai = p.GiaKhuyenMai,
                PhanTramGiam = p.PhanTramGiam,
                LoaiSanPham = "phu_kien",
                NgayKetThuc = p.KhuyenMai?.NgayKetThuc,
                LoaiPhuKien = p.LoaiPhuKien,
                ThuongHieu = p.ThuongHieu,
                KetNoi = p.KetNoi,
                DenLed = p.DenLed,
                DoPhanGiai = p.DoPhanGiai,
                DoDaiDay = p.DoDaiDay,
                LoaiBanPhim = p.LoaiBanPhim,
                SoPhim = p.SoPhim,
                KichThuoc = p.KichThuoc,
                TrongLuong = p.TrongLuong,
                CongNgheAmThanh = p.CongNgheAmThanh,
                Maicro = p.Maicro,
                ThoiLuongPin = p.ThoiLuongPin,
                PhienBanQuat = p.PhienBanQuat,
                CongSuat = p.CongSuat,
                BaoHanh = p.BaoHanh
            });

            var mergedList = laptopDtos.Concat(accessoryDtos).ToList();
            return Ok(mergedList);
        }

        // DELETE: api/SanPham/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSanPham(int id)
        {
            var sanPham = await _context.SanPhams.FindAsync(id);
            if (sanPham == null)
            {
                return NotFound(new { message = $"Không tìm thấy sản phẩm với ID = {id}" });
            }

            _context.SanPhams.Remove(sanPham);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<bool> SanPhamExists(int id)
        {
            return await _context.SanPhams.AnyAsync(e => e.MaSanPham == id);
        }

        private async Task GanThongKeDanhGiaAsync(IEnumerable<SanPham> sanPhams)
        {
            var ids = sanPhams.Select(p => p.MaSanPham).ToList();
            if (ids.Count == 0) return;

            var stats = await _context.DanhGias
                .Where(d => d.MaSanPham != null && ids.Contains(d.MaSanPham.Value) && d.SoSao != null && d.TrangThai == "hien_thi")
                .GroupBy(d => d.MaSanPham)
                .Select(g => new
                {
                    MaSanPham = g.Key!.Value,
                    SoLuong = g.Count(),
                    DiemTb = g.Average(d => (double)d.SoSao!.Value),
                })
                .ToListAsync();

            var map = stats.ToDictionary(s => s.MaSanPham);

            foreach (var sp in sanPhams)
            {
                if (map.TryGetValue(sp.MaSanPham, out var s))
                {
                    sp.SoLuongDanhGia = s.SoLuong;
                    sp.DiemDanhGiaTrungBinh = Math.Round(s.DiemTb, 1);
                }
                else
                {
                    sp.SoLuongDanhGia = 0;
                    sp.DiemDanhGiaTrungBinh = 0;
                }
            }
        }
    }

    public class FlashSaleItemDto
    {
        public int Id { get; set; }
        public string Ten { get; set; } = string.Empty;
        public string? HinhAnh { get; set; }
        public decimal GiaGoc { get; set; }
        public decimal GiaKhuyenMai { get; set; }
        public decimal PhanTramGiam { get; set; }
        public string LoaiSanPham { get; set; } = string.Empty; // "laptop" or "phu_kien"
        public DateTime? NgayKetThuc { get; set; }

        // Laptop Specs
        public string? Cpu { get; set; }
        public string? Ram { get; set; }
        public string? OCung { get; set; }
        public string? CardDoHoa { get; set; }
        public string? ManHinh { get; set; }
        public string? Pin { get; set; }
        public string? HeDieuHanh { get; set; }

        // Accessory Specs
        public string? LoaiPhuKien { get; set; }
        public string? ThuongHieu { get; set; }
        public string? KetNoi { get; set; }
        public string? DenLed { get; set; }
        public string? DoPhanGiai { get; set; }
        public string? DoDaiDay { get; set; }
        public string? LoaiBanPhim { get; set; }
        public int? SoPhim { get; set; }
        public string? KichThuoc { get; set; }
        public string? TrongLuong { get; set; }
        public string? CongNgheAmThanh { get; set; }
        public string? Maicro { get; set; }
        public string? ThoiLuongPin { get; set; }
        public string? PhienBanQuat { get; set; }
        public string? CongSuat { get; set; }
        public string? BaoHanh { get; set; }
    }
}