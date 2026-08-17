using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Web_ban_laptop.Entities
{
    [Table("chi_tiet_don_hang")]
    public class ChiTietDonHang
    {
        [Key]
        [Column("ma_chi_tiet")]
        public int MaChiTiet { get; set; }

        [Required]
        [Column("ma_don_hang")]
        public int MaDonHang { get; set; }

        [Column("ma_san_pham")]
        public int? MaSanPham { get; set; }

        [Column("ma_phu_kien")]
        public int? MaPhuKien { get; set; }

        [Required]
        [Column("so_luong")]
        public int SoLuong { get; set; }

        [Required]
        [Column("gia", TypeName = "decimal(15,2)")]
        public decimal Gia { get; set; }

        [ForeignKey("MaDonHang")]
        [JsonIgnore]
        public DonHang? DonHang { get; set; }

        [ForeignKey("MaSanPham")]
        public SanPham? SanPham { get; set; }

        [ForeignKey("MaPhuKien")]
        public PhuKien? PhuKien { get; set; }
    }
}
