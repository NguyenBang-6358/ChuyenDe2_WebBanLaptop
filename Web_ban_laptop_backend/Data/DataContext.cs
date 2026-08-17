using Microsoft.EntityFrameworkCore;
using Web_ban_laptop.Entities;

namespace Web_ban_laptop.Data
{
    public class DataContext : DbContext 
    {
        public DataContext(DbContextOptions<DataContext> options) : base(options)
        { 
        }

        public DbSet<ThuongHieu> ThuongHieus { get; set; }
        public DbSet<DanhMuc> DanhMucs { get; set; }
        public DbSet<KhuyenMai> KhuyenMais { get; set; }
        public DbSet<NguoiDung> NguoiDungs { get; set; }
        public DbSet<SanPham> SanPhams { get; set; }
        public DbSet<HinhAnhSanPham> HinhAnhSanPhams { get; set; }
        public DbSet<DonHang> DonHangs { get; set; }
        public DbSet<ChiTietDonHang> ChiTietDonHangs { get; set; }
        public DbSet<GioHang> GioHangs { get; set; }
        public DbSet<ChiTietGioHang> ChiTietGioHangs { get; set; }
        public DbSet<DanhGia> DanhGias { get; set; }
        public DbSet<PhuKien> PhuKiens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Cấu hình quan hệ 1-1 giữa NguoiDung và GioHang
            modelBuilder.Entity<NguoiDung>()
                .HasOne(n => n.GioHang)
                .WithOne(g => g.NguoiDung)
                .HasForeignKey<GioHang>(g => g.MaNguoiDung);
        }
    }
}
