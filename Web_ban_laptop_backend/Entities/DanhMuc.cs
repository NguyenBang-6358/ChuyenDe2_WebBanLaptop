using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Web_ban_laptop.Entities
{
    [Table("danh_muc")]
    public class DanhMuc
    {
        [Key]
        [Column("ma_danh_muc")]
        public int MaDanhMuc { get; set; }

        [Required]
        [Column("ten_danh_muc")]
        [StringLength(100)]
        public string TenDanhMuc { get; set; } = string.Empty;

        [Column("mo_ta")]
        public string? MoTa { get; set; }

        [JsonIgnore]
        public ICollection<SanPham> SanPhams { get; set; } = new List<SanPham>();
    }
}
