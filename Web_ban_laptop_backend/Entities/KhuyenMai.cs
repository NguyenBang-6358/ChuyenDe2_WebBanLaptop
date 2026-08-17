using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Web_ban_laptop.Entities
{
    [Table("khuyen_mai")]
    public class KhuyenMai
    {
        [Key]
        [Column("ma_khuyen_mai")]
        public int MaKhuyenMai { get; set; }

        [Required]
        [Column("ten_khuyen_mai")]
        [StringLength(100)]
        public string TenKhuyenMai { get; set; } = string.Empty;

        [Column("phan_tram_giam", TypeName = "decimal(5,2)")]
        public decimal? PhanTramGiam { get; set; }

        [Column("ngay_bat_dau")]
        public DateTime? NgayBatDau { get; set; }

        [Column("ngay_ket_thuc")]
        public DateTime? NgayKetThuc { get; set; }

        [Column("trang_thai")]
        public string? TrangThai { get; set; } = "hoat_dong";

        [JsonIgnore]
        public ICollection<SanPham> SanPhams { get; set; } = new List<SanPham>();
    }
}
