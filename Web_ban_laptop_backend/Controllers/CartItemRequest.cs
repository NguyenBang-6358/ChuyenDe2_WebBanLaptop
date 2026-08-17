using System.ComponentModel.DataAnnotations;

namespace Web_ban_laptop.Controllers
{
    public class CartItemRequest
    {
        [Required(ErrorMessage = "Mã người dùng là bắt buộc.")]
        public int MaNguoiDung { get; set; }

        public int? MaSanPham { get; set; }

        public int? MaPhuKien { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn hoặc bằng 1.")]
        public int SoLuong { get; set; } = 1;
    }
}
