using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Web_ban_laptop.Entities
{
    [Table("thuong_hieu")]
    public class ThuongHieu
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        [StringLength(2)]
        [Column("ma_thuong_hieu")]
        public string MaThuongHieu { get; set; } = string.Empty;

        [Required]
        [Column("ten_thuong_hieu")]
        [StringLength(100)]
        public string TenThuongHieu { get; set; } = string.Empty;

        [Column("logo")]
        [StringLength(255)]
        public string? Logo { get; set; }

        [Column("mo_ta")]
        public string? MoTa { get; set; }

        [JsonIgnore]
        public ICollection<SanPham> SanPhams { get; set; } = new List<SanPham>();
    }
}
