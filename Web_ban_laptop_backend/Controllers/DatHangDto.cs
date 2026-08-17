using System.ComponentModel.DataAnnotations;

namespace Web_ban_laptop.Controllers
{
    public class DatHangDto
    {
        [Required(ErrorMessage = "Mã người dùng là bắt buộc.")]
        public int MaNguoiDung { get; set; }

        [Required(ErrorMessage = "Họ tên người nhận là bắt buộc.")]
        [StringLength(100, ErrorMessage = "Họ tên không được vượt quá 100 ký tự.")]
        public string HoTen { get; set; } = string.Empty;

        [Required(ErrorMessage = "Số điện thoại nhận hàng là bắt buộc.")]
        [Phone(ErrorMessage = "Số điện thoại không hợp lệ.")]
        [StringLength(20, ErrorMessage = "Số điện thoại không được vượt quá 20 ký tự.")]
        public string SoDienThoai { get; set; } = string.Empty;

        [Required(ErrorMessage = "Địa chỉ giao hàng là bắt buộc.")]
        public string DiaChiGiaoHang { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phương thức thanh toán là bắt buộc.")]
        [RegularExpression("^(tien_mat|chuyen_khoan)$", 
            ErrorMessage = "Phương thức thanh toán phải là: 'tien_mat' hoặc 'chuyen_khoan'.")]
        public string PhuongThucThanhToan { get; set; } = string.Empty;
    }
}