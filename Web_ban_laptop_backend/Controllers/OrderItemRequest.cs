using System.ComponentModel.DataAnnotations;

namespace Web_ban_laptop.Controllers
{
    public class OrderItemRequest
    {
        public int? MaSanPham { get; set; }

        public int? MaPhuKien { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn hoặc bằng 1.")]
        public int SoLuong { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Giá bán không được nhỏ hơn 0.")]
        public decimal Gia { get; set; }
    }
}
