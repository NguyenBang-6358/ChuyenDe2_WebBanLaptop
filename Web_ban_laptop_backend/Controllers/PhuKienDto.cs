using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Web_ban_laptop.Controllers
{
    public class PhuKienDto
    {
        [Required(ErrorMessage = "Tên phụ kiện là bắt buộc.")]
        [StringLength(1000, ErrorMessage = "Tên phụ kiện không được vượt quá 1000 ký tự.")]
        public string TenPhuKien { get; set; } = string.Empty;

        [Required(ErrorMessage = "Giá bán là bắt buộc.")]
        [Range(0, double.MaxValue, ErrorMessage = "Giá bán không được nhỏ hơn 0.")]
        public decimal Gia { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Số lượng tồn không được nhỏ hơn 0.")]
        public int SoLuongTon { get; set; }

        [StringLength(1000, ErrorMessage = "Ảnh đại diện không được vượt quá 1000 ký tự.")]
        public string? AnhDaiDien { get; set; }

        public string? MoTa { get; set; }

        [Required(ErrorMessage = "Loại phụ kiện là bắt buộc.")]
        [StringLength(500, ErrorMessage = "Loại phụ kiện không vượt quá 500 ký tự.")]
        public string LoaiPhuKien { get; set; } = string.Empty;

        [StringLength(255, ErrorMessage = "Thương hiệu không vượt quá 255 ký tự.")]
        public string? ThuongHieu { get; set; }

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

        [StringLength(500, ErrorMessage = "Thời hạn bảo hành không vượt quá 500 ký tự.")]
        public string? BaoHanh { get; set; }

        public List<string>? HinhAnhPhu { get; set; }

        public int? MaKhuyenMai { get; set; }
    }
}
