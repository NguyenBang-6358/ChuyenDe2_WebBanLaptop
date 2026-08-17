using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Web_ban_laptop.Entities
{
    [Table("gio_hang")]
    public class GioHang
    {
        [Key]
        [Column("ma_gio_hang")]
        public int MaGioHang { get; set; }

        [Required]
        [Column("ma_nguoi_dung")]
        public int MaNguoiDung { get; set; }

        [Column("ngay_tao")]
        public DateTime? NgayTao { get; set; } = DateTime.Now;

        [ForeignKey("MaNguoiDung")]
        public NguoiDung? NguoiDung { get; set; }

        public ICollection<ChiTietGioHang> ChiTietGioHangs { get; set; } = new List<ChiTietGioHang>();
    }
}
