using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Web_ban_laptop.Entities
{
    [Table("chi_tiet_gio_hang")]
    public class ChiTietGioHang
    {
        [Key]
        [Column("ma_chi_tiet")]
        public int MaChiTiet { get; set; }

        [Required]
        [Column("ma_gio_hang")]
        public int MaGioHang { get; set; }

        [Column("ma_san_pham")]
        public int? MaSanPham { get; set; }

        [Column("ma_phu_kien")]
        public int? MaPhuKien { get; set; }

        [Column("so_luong")]
        public int? SoLuong { get; set; } = 1;

        [ForeignKey("MaGioHang")]
        [JsonIgnore]
        public GioHang? GioHang { get; set; }

        [ForeignKey("MaSanPham")]
        public SanPham? SanPham { get; set; }

        [ForeignKey("MaPhuKien")]
        public PhuKien? PhuKien { get; set; }
    }
}
