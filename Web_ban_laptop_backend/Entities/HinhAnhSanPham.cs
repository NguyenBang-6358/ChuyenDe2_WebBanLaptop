using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Web_ban_laptop.Entities
{
    [Table("hinh_anh_san_pham")]
    public class HinhAnhSanPham
    {
        [Key]
        [Column("ma_hinh_anh")]
        public int MaHinhAnh { get; set; }

        [Column("ma_san_pham")]
        public int? MaSanPham { get; set; }

        [Column("ma_phu_kien")]
        public int? MaPhuKien { get; set; }

        [Required]
        [Column("duong_dan_anh")]
        [StringLength(255)]
        public string DuongDanAnh { get; set; } = string.Empty;

        [ForeignKey("MaSanPham")]
        [JsonIgnore]
        public SanPham? SanPham { get; set; }

        [ForeignKey("MaPhuKien")]
        [JsonIgnore]
        public PhuKien? PhuKien { get; set; }
    }
}
