using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_ban_laptop.Data;
using Web_ban_laptop.Entities;

namespace Web_ban_laptop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly DataContext _context;

        public ProductController(DataContext context)
        {
            _context = context;
        }

        // GET: api/Product/{id}
        // Lấy chi tiết một sản phẩm đầy đủ thông tin cấu hình và khuyến mãi
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDetailDto>> GetProductDetail(int id)
        {
            var query = _context.Database.SqlQueryRaw<ProductDetailDto>(@"
                SELECT 
                    sp.ma_san_pham AS MaSanPham,
                    sp.ma_thuong_hieu AS MaThuongHieu,
                    sp.ma_danh_muc AS MaDanhMuc,
                    sp.ma_khuyen_mai AS MaKhuyenMai,
                    sp.ten_san_pham AS TenSanPham,
                    sp.cpu AS Cpu,
                    sp.ram AS Ram,
                    sp.o_cung AS OCung,
                    sp.card_do_hoa AS CardDoHoa,
                    sp.man_hinh AS ManHinh,
                    sp.pin AS Pin,
                    sp.he_dieu_hanh AS HeDieuHanh,
                    sp.gia AS Gia,
                    sp.so_luong_ton AS SoLuongTon,
                    sp.anh_dai_dien AS AnhDaiDien,
                    sp.mo_ta AS MoTa,
                    sp.ngay_tao AS NgayTao,
                    sp.gia AS GiaGoc,
                    COALESCE(
                        CASE 
                            WHEN km.trang_thai = 'hoat_dong' 
                                 AND (km.ngay_bat_dau IS NULL OR km.ngay_bat_dau <= NOW()) 
                                 AND (km.ngay_ket_thuc IS NULL OR km.ngay_ket_thuc >= NOW()) 
                            THEN km.phan_tram_giam 
                            ELSE 0 
                        END, 
                        0
                    ) AS PhanTramGiam,
                    CASE 
                        WHEN km.trang_thai = 'hoat_dong' 
                             AND (km.ngay_bat_dau IS NULL OR km.ngay_bat_dau <= NOW()) 
                             AND (km.ngay_ket_thuc IS NULL OR km.ngay_ket_thuc >= NOW()) 
                        THEN ROUND(sp.gia * (1 - km.phan_tram_giam / 100)) 
                        ELSE sp.gia 
                    END AS GiaKhuyenMai,
                    -- Thuộc tính Phụ kiện (tương thích cho DTO)
                    NULL AS LoaiPhuKien,
                    NULL AS ThuongHieuPhuKien,
                    NULL AS KetNoi,
                    NULL AS DenLed,
                    NULL AS DoPhanGiai,
                    NULL AS DoDaiDay,
                    NULL AS LoaiBanPhim,
                    NULL AS SoPhim,
                    NULL AS KichThuoc,
                    NULL AS TrongLuong,
                    NULL AS CongNgheAmThanh,
                    NULL AS Maicro,
                    NULL AS ThoiLuongPin,
                    NULL AS PhienBanQuat,
                    NULL AS CongSuat,
                    NULL AS DienApDauVao,
                    NULL AS DienApDauRa,
                    NULL AS BaoHanh
                FROM san_pham sp
                LEFT JOIN khuyen_mai km ON sp.ma_khuyen_mai = km.ma_khuyen_mai
                WHERE sp.ma_san_pham = {0}", id);

            var product = await query.FirstOrDefaultAsync();

            if (product == null)
            {
                return NotFound(new { message = $"Không tìm thấy sản phẩm với ID = {id}" });
            }

            return Ok(product);
        }
    }
}
