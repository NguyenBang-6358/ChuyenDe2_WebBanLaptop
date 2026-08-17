using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Web_ban_laptop.Controllers
{
    /// <summary>
    /// DTO chứa đầy đủ thông tin chi tiết của một sản phẩm (bao gồm cả cấu hình Laptop hoặc Phụ kiện).
    /// </summary>
    public class ProductDetailDto
    {
        public int MaSanPham { get; set; }
        public string MaThuongHieu { get; set; } = string.Empty;
        public int MaDanhMuc { get; set; }
        public int? MaKhuyenMai { get; set; }
        public string TenSanPham { get; set; } = string.Empty;
        public string? Cpu { get; set; }
        public string? Ram { get; set; }
        public string? OCung { get; set; }
        public string? CardDoHoa { get; set; }
        public string? ManHinh { get; set; }
        public string? Pin { get; set; }
        public string? HeDieuHanh { get; set; }
        public decimal Gia { get; set; }
        public int SoLuongTon { get; set; }
        public string? AnhDaiDien { get; set; }
        public string? MoTa { get; set; }
        public DateTime? NgayTao { get; set; }
        public decimal GiaGoc { get; set; }
        public decimal PhanTramGiam { get; set; }
        public decimal GiaKhuyenMai { get; set; }

        // Các thuộc tính phụ kiện (sẽ tự động NULL nếu sản phẩm là Laptop)
        public string? LoaiPhuKien { get; set; }
        public string? ThuongHieuPhuKien { get; set; }
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
        public string? DienApDauVao { get; set; }
        public string? DienApDauRa { get; set; }
        public string? BaoHanh { get; set; }
    }

    /// <summary>
    /// DTO tiếp nhận dữ liệu thêm mới Phụ kiện từ Client/Admin gửi lên.
    /// </summary>
    public class CreatePhuKienDto
    {
        [Required(ErrorMessage = "Tên sản phẩm là bắt buộc.")]
        [StringLength(255, ErrorMessage = "Tên sản phẩm không được vượt quá 255 ký tự.")]
        public string TenSanPham { get; set; } = string.Empty;

        [Required(ErrorMessage = "Giá bán là bắt buộc.")]
        [Range(0, double.MaxValue, ErrorMessage = "Giá bán không được nhỏ hơn 0.")]
        public decimal Gia { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Số lượng tồn không được nhỏ hơn 0.")]
        public int SoLuongTon { get; set; } = 0;

        [StringLength(255, ErrorMessage = "Đường dẫn ảnh đại diện không vượt quá 255 ký tự.")]
        public string? AnhDaiDien { get; set; }

        public string? MoTa { get; set; }

        [Required(ErrorMessage = "Mã thương hiệu là bắt buộc.")]
        [StringLength(2, ErrorMessage = "Mã thương hiệu tối đa 2 ký tự.")]
        public string MaThuongHieu { get; set; } = string.Empty;

        [Required(ErrorMessage = "Mã danh mục là bắt buộc.")]
        public int MaDanhMuc { get; set; }

        // Thông tin phụ kiện
        [Required(ErrorMessage = "Loại phụ kiện là bắt buộc (ví dụ: Chuột, Bàn phím...).")]
        [StringLength(100, ErrorMessage = "Loại phụ kiện không vượt quá 100 ký tự.")]
        public string LoaiPhuKien { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Thương hiệu phụ kiện không vượt quá 100 ký tự.")]
        public string? ThuongHieuPhuKien { get; set; }

        [StringLength(500, ErrorMessage = "Kết nối không vượt quá 500 ký tự.")]
        public string? KetNoi { get; set; }

        [StringLength(255, ErrorMessage = "Đèn Led không vượt quá 255 ký tự.")]
        public string? DenLed { get; set; }

        [StringLength(255, ErrorMessage = "Độ phân giải không vượt quá 255 ký tự.")]
        public string? DoPhanGiai { get; set; }

        [StringLength(255, ErrorMessage = "Độ dài dây không vượt quá 255 ký tự.")]
        public string? DoDaiDay { get; set; }

        [StringLength(255, ErrorMessage = "Loại bàn phím không vượt quá 255 ký tự.")]
        public string? LoaiBanPhim { get; set; }

        public int? SoPhim { get; set; }

        [StringLength(255, ErrorMessage = "Kích thước không vượt quá 255 ký tự.")]
        public string? KichThuoc { get; set; }

        [StringLength(255, ErrorMessage = "Trọng lượng không vượt quá 255 ký tự.")]
        public string? TrongLuong { get; set; }

        [StringLength(500, ErrorMessage = "Công nghệ âm thanh không vượt quá 500 ký tự.")]
        public string? CongNgheAmThanh { get; set; }

        [StringLength(255, ErrorMessage = "Micro không vượt quá 255 ký tự.")]
        public string? Maicro { get; set; }

        [StringLength(255, ErrorMessage = "Thời lượng pin không vượt quá 255 ký tự.")]
        public string? ThoiLuongPin { get; set; }

        [StringLength(255, ErrorMessage = "Phiên bản quạt không vượt quá 255 ký tự.")]
        public string? PhienBanQuat { get; set; }

        [StringLength(255, ErrorMessage = "Công suất không vượt quá 255 ký tự.")]
        public string? CongSuat { get; set; }

        [StringLength(255, ErrorMessage = "Điện áp đầu vào không vượt quá 255 ký tự.")]
        public string? DienApDauVao { get; set; }

        [StringLength(255, ErrorMessage = "Điện áp đầu ra không vượt quá 255 ký tự.")]
        public string? DienApDauRa { get; set; }

        [StringLength(255, ErrorMessage = "Thời hạn bảo hành không vượt quá 255 ký tự.")]
        public string? BaoHanh { get; set; }

        // Danh sách hình ảnh phụ kèm theo (nếu có)
        public List<string>? HinhAnhPhu { get; set; }
    }
}
