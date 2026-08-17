using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Web_ban_laptop.Entities
{
    [Table("nguoi_dung")]
    public class NguoiDung
    {
        [Key]
        [Column("ma_nguoi_dung")]
        public int MaNguoiDung { get; set; }

        [Required]
        [Column("ho_ten")]
        [StringLength(100)]
        public string HoTen { get; set; } = string.Empty;

        [Required]
        [Column("email")]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Column("mat_khau")]
        [StringLength(255)]
        public string MatKhau { get; set; } = string.Empty;

        [Column("so_dien_thoai")]
        [StringLength(20)]
        public string? SoDienThoai { get; set; }

        [Column("dia_chi")]
        public string? DiaChi { get; set; }

        [Column("anh_dai_dien")]
        [StringLength(255)]
        public string? AnhDaiDien { get; set; }

        [Column("vai_tro")]
        public string? VaiTro { get; set; } = "khach_hang";

        [Column("trang_thai")]
        public string? TrangThai { get; set; } = "hoat_dong";

        [Column("ngay_tao")]
        public DateTime? NgayTao { get; set; } = DateTime.Now;

        [JsonIgnore]
        public GioHang? GioHang { get; set; }

        [JsonIgnore]
        public ICollection<DonHang> DonHangs { get; set; } = new List<DonHang>();

        [JsonIgnore]
        public ICollection<DanhGia> DanhGias { get; set; } = new List<DanhGia>();
    }
}
