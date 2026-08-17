using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Web_ban_laptop.Entities
{
    [Table("san_pham")]
    public class SanPham
    {
        [Key]
        [Column("ma_san_pham")]
        public int MaSanPham { get; set; }

        [Required]
        [StringLength(2)]
        [Column("ma_thuong_hieu")]
        public string MaThuongHieu { get; set; } = string.Empty;

        [Required]
        [Column("ma_danh_muc")]
        public int MaDanhMuc { get; set; }

        [Column("ma_khuyen_mai")]
        public int? MaKhuyenMai { get; set; }

        [Required]
        [Column("ten_san_pham")]
        [StringLength(255)]
        public string TenSanPham { get; set; } = string.Empty;

        [Column("cpu")]
        [StringLength(255)]
        public string? Cpu { get; set; }

        [Column("ram")]
        [StringLength(255)]
        public string? Ram { get; set; }

        [Column("o_cung")]
        [StringLength(255)]
        public string? OCung { get; set; }

        [Column("card_do_hoa")]
        [StringLength(255)]
        public string? CardDoHoa { get; set; }

        [Column("man_hinh")]
        [StringLength(500)]
        public string? ManHinh { get; set; }

        [Column("pin")]
        [StringLength(500)]
        public string? Pin { get; set; }

        [Column("he_dieu_hanh")]
        [StringLength(255)]
        public string? HeDieuHanh { get; set; }

        [Required]
        [Column("gia", TypeName = "decimal(15,2)")]
        public decimal Gia { get; set; }

        [Column("so_luong_ton")]
        public int SoLuongTon { get; set; } = 0;

        [Column("anh_dai_dien")]
        [StringLength(255)]
        public string? AnhDaiDien { get; set; }

        [Column("mo_ta")]
        public string? MoTa { get; set; }

        [Column("ngay_tao")]
        public DateTime? NgayTao { get; set; } = DateTime.Now;

        [ForeignKey("MaThuongHieu")]
        public ThuongHieu? ThuongHieu { get; set; }

        [ForeignKey("MaDanhMuc")]
        public DanhMuc? DanhMuc { get; set; }

        [ForeignKey("MaKhuyenMai")]
        public KhuyenMai? KhuyenMai { get; set; }

        public ICollection<HinhAnhSanPham> HinhAnhSanPhams { get; set; } = new List<HinhAnhSanPham>();

        [JsonIgnore]
        public ICollection<ChiTietDonHang> ChiTietDonHangs { get; set; } = new List<ChiTietDonHang>();

        [JsonIgnore]
        public ICollection<ChiTietGioHang> ChiTietGioHangs { get; set; } = new List<ChiTietGioHang>();

        [JsonIgnore]
        public ICollection<DanhGia> DanhGias { get; set; } = new List<DanhGia>();

        [NotMapped]
        public int SoLuongDanhGia { get; set; }

        [NotMapped]
        public double DiemDanhGiaTrungBinh { get; set; }

        [NotMapped]
        public decimal GiaGoc => Gia;

        [NotMapped]
        public decimal PhanTramGiam
        {
            get
            {
                if (KhuyenMai != null && (KhuyenMai.TrangThai == "hoat_dong" || KhuyenMai.TrangThai == "active" || string.IsNullOrEmpty(KhuyenMai.TrangThai)))
                {
                    var now = DateTime.Now;
                    var utcNow = DateTime.UtcNow;
                    bool isValidDate = (!KhuyenMai.NgayBatDau.HasValue || KhuyenMai.NgayBatDau.Value <= now) && (!KhuyenMai.NgayKetThuc.HasValue || KhuyenMai.NgayKetThuc.Value >= now);
                    if (isValidDate && KhuyenMai.PhanTramGiam.HasValue)
                    {
                        return KhuyenMai.PhanTramGiam.Value;
                    }
                }
                return 0;
            }
        }

        [NotMapped]
        public decimal GiaKhuyenMai
        {
            get
            {
                var percent = PhanTramGiam;
                if (percent > 0)
                {
                    return Math.Round(Gia * (1 - percent / 100));
                }
                return Gia;
            }
        }
    }
}