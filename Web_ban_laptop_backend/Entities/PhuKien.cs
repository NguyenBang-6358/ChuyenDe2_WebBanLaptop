using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Web_ban_laptop.Entities
{
    [Table("phu_kien")]
    public class PhuKien
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("ma_phu_kien")]
        public int MaPhuKien { get; set; }

        [Required]
        [Column("ten_phu_kien")]
        [StringLength(1000)]
        public string TenPhuKien { get; set; } = string.Empty;

        [Required]
        [Column("gia", TypeName = "decimal(15,2)")]
        public decimal Gia { get; set; }

        [Required]
        [Column("so_luong_ton")]
        public int SoLuongTon { get; set; }

        [Column("anh_dai_dien")]
        [StringLength(1000)]
        public string? AnhDaiDien { get; set; }

        [Column("mo_ta")]
        public string? MoTa { get; set; }

        [Column("ngay_tao")]
        public DateTime NgayTao { get; set; } = DateTime.Now;

        [Required]
        [Column("loai_phu_kien")]
        [StringLength(500)]
        public string LoaiPhuKien { get; set; } = string.Empty;

        [Column("thuong_hieu")]
        [StringLength(255)]
        public string? ThuongHieu { get; set; }

        [Column("ket_noi")]
        [StringLength(500)]
        public string? KetNoi { get; set; }

        [Column("den_led")]
        [StringLength(255)]
        public string? DenLed { get; set; }

        [Column("do_phan_giai")]
        [StringLength(255)]
        public string? DoPhanGiai { get; set; }

        [Column("do_dai_day")]
        [StringLength(255)]
        public string? DoDaiDay { get; set; }

        [Column("loai_ban_phim")]
        [StringLength(255)]
        public string? LoaiBanPhim { get; set; }

        [Column("so_phim")]
        public int? SoPhim { get; set; }

        [Column("kich_thuoc")]
        [StringLength(255)]
        public string? KichThuoc { get; set; }

        [Column("trong_luong")]
        [StringLength(255)]
        public string? TrongLuong { get; set; }

        [Column("cong_nghe_am_thanh")]
        [StringLength(500)]
        public string? CongNgheAmThanh { get; set; }

        [Column("micro")]
        [StringLength(255)]
        public string? Maicro { get; set; }

        [Column("thoi_luong_pin")]
        [StringLength(255)]
        public string? ThoiLuongPin { get; set; }

        [Column("phien_ban_quat")]
        [StringLength(255)]
        public string? PhienBanQuat { get; set; }

        [Column("cong_suat")]
        [StringLength(255)]
        public string? CongSuat { get; set; }

        [Column("dien_ap_dau_vao")]
        [StringLength(255)]
        public string? DienApDauVao { get; set; }

        [Column("dien_ap_dau_ra")]
        [StringLength(255)]
        public string? DienApDauRa { get; set; }

        [Column("bao_hanh")]
        [StringLength(500)]
        public string? BaoHanh { get; set; }

        [Column("ma_khuyen_mai")]
        public int? MaKhuyenMai { get; set; }

        [ForeignKey("MaKhuyenMai")]
        public KhuyenMai? KhuyenMai { get; set; }

        [JsonIgnore]
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