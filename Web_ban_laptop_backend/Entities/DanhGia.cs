using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Web_ban_laptop.Entities
{
    [Table("danh_gia")]
    public class DanhGia
    {
        [Key]
        [Column("ma_danh_gia")]
        public int MaDanhGia { get; set; }

        [Required]
        [Column("ma_nguoi_dung")]
        public int MaNguoiDung { get; set; }

        [Column("ma_san_pham")]
        public int? MaSanPham { get; set; }

        [Column("ma_phu_kien")]
        public int? MaPhuKien { get; set; }

        [Range(1, 5)]
        [Column("so_sao")]
        public int? SoSao { get; set; }

        [Column("noi_dung")]
        public string? NoiDung { get; set; }

        [Column("ngay_danh_gia")]
        public DateTime? NgayDanhGia { get; set; } = DateTime.Now;

        [ForeignKey("MaNguoiDung")]
        [JsonIgnore]
        public NguoiDung? NguoiDung { get; set; }

        [ForeignKey("MaSanPham")]
        [JsonIgnore]
        public SanPham? SanPham { get; set; }

        [ForeignKey("MaPhuKien")]
        [JsonIgnore]
        public PhuKien? PhuKien { get; set; }

        [Column("trang_thai")]
        public string TrangThai { get; set; } = "hien_thi";

        [Column("phan_hoi_cua_admin")]
        public string? PhanHoiCuaAdmin { get; set; }
    }
}
