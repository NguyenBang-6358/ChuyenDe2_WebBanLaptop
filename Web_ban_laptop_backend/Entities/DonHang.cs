using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Web_ban_laptop.Entities
{
    [Table("don_hang")]
    public class DonHang
    {
        [Key]
        [Column("ma_don_hang")]
        public int MaDonHang { get; set; }

        [Required]
        [Column("ma_nguoi_dung")]
        public int MaNguoiDung { get; set; }

        [Required]
        [Column("tong_tien", TypeName = "decimal(15,2)")]
        public decimal TongTien { get; set; }

        [Column("dia_chi_giao_hang")]
        public string? DiaChiGiaoHang { get; set; }

        [Column("phuong_thuc_thanh_toan")]
        public string? PhuongThucThanhToan { get; set; }

        [Column("trang_thai")]
        public string? TrangThai { get; set; } = "cho_xac_nhan";

        [Column("ngay_dat")]
        public DateTime? NgayDat { get; set; } = DateTime.Now;

        [ForeignKey("MaNguoiDung")]
        public NguoiDung? NguoiDung { get; set; }

        public ICollection<ChiTietDonHang> ChiTietDonHangs { get; set; } = new List<ChiTietDonHang>();
    }
}
