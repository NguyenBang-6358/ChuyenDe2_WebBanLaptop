using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Web_ban_laptop.Data;
using Web_ban_laptop.Entities;
using Web_ban_laptop.Controllers;

namespace Web_ban_laptop.Services
{
    public class PhuKienService : IPhuKienService
    {
        private readonly DataContext _context;

        public PhuKienService(DataContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PhuKien>> GetAllAsync()
        {
            return await _context.PhuKiens
                .Include(p => p.HinhAnhSanPhams)
                .Include(p => p.KhuyenMai)
                .OrderByDescending(p => p.NgayTao)
                .ToListAsync();
        }

        public async Task<PhuKien?> GetByIdAsync(int id)
        {
            return await _context.PhuKiens
                .Include(p => p.HinhAnhSanPhams)
                .Include(p => p.KhuyenMai)
                .FirstOrDefaultAsync(p => p.MaPhuKien == id);
        }

        public async Task<PhuKien> CreateAsync(PhuKienDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var phuKien = new PhuKien
                {
                    TenPhuKien = dto.TenPhuKien,
                    Gia = dto.Gia,
                    SoLuongTon = dto.SoLuongTon,
                    AnhDaiDien = dto.AnhDaiDien,
                    MoTa = dto.MoTa,
                    LoaiPhuKien = dto.LoaiPhuKien,
                    ThuongHieu = dto.ThuongHieu,
                    KetNoi = dto.KetNoi,
                    DenLed = dto.DenLed,
                    DoPhanGiai = dto.DoPhanGiai,
                    DoDaiDay = dto.DoDaiDay,
                    LoaiBanPhim = dto.LoaiBanPhim,
                    SoPhim = dto.SoPhim,
                    KichThuoc = dto.KichThuoc,
                    TrongLuong = dto.TrongLuong,
                    CongNgheAmThanh = dto.CongNgheAmThanh,
                    Maicro = dto.Maicro,
                    ThoiLuongPin = dto.ThoiLuongPin,
                    PhienBanQuat = dto.PhienBanQuat,
                    CongSuat = dto.CongSuat,
                    DienApDauVao = dto.DienApDauVao,
                    DienApDauRa = dto.DienApDauRa,
                    BaoHanh = dto.BaoHanh,
                    MaKhuyenMai = dto.MaKhuyenMai,
                    NgayTao = DateTime.Now
                };

                _context.PhuKiens.Add(phuKien);
                await _context.SaveChangesAsync();

                if (dto.HinhAnhPhu != null && dto.HinhAnhPhu.Any())
                {
                    foreach (var imagePath in dto.HinhAnhPhu)
                    {
                        if (!string.IsNullOrEmpty(imagePath))
                        {
                            _context.HinhAnhSanPhams.Add(new HinhAnhSanPham
                            {
                                MaPhuKien = phuKien.MaPhuKien,
                                DuongDanAnh = imagePath
                            });
                        }
                    }
                }
                else if (!string.IsNullOrEmpty(dto.AnhDaiDien))
                {
                    _context.HinhAnhSanPhams.Add(new HinhAnhSanPham
                    {
                        MaPhuKien = phuKien.MaPhuKien,
                        DuongDanAnh = dto.AnhDaiDien
                    });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return await _context.PhuKiens
                    .Include(p => p.HinhAnhSanPhams)
                    .Include(p => p.KhuyenMai)
                    .FirstAsync(p => p.MaPhuKien == phuKien.MaPhuKien);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> UpdateAsync(int id, PhuKienDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var phuKien = await _context.PhuKiens
                    .Include(p => p.HinhAnhSanPhams)
                    .Include(p => p.KhuyenMai)
                    .FirstOrDefaultAsync(p => p.MaPhuKien == id);

                if (phuKien == null)
                {
                    return false;
                }

                phuKien.TenPhuKien = dto.TenPhuKien;
                phuKien.Gia = dto.Gia;
                phuKien.SoLuongTon = dto.SoLuongTon;
                phuKien.AnhDaiDien = dto.AnhDaiDien;
                phuKien.MoTa = dto.MoTa;
                phuKien.LoaiPhuKien = dto.LoaiPhuKien;
                phuKien.ThuongHieu = dto.ThuongHieu;
                phuKien.KetNoi = dto.KetNoi;
                phuKien.DenLed = dto.DenLed;
                phuKien.DoPhanGiai = dto.DoPhanGiai;
                phuKien.DoDaiDay = dto.DoDaiDay;
                phuKien.LoaiBanPhim = dto.LoaiBanPhim;
                phuKien.SoPhim = dto.SoPhim;
                phuKien.KichThuoc = dto.KichThuoc;
                phuKien.TrongLuong = dto.TrongLuong;
                phuKien.CongNgheAmThanh = dto.CongNgheAmThanh;
                phuKien.Maicro = dto.Maicro;
                phuKien.ThoiLuongPin = dto.ThoiLuongPin;
                phuKien.PhienBanQuat = dto.PhienBanQuat;
                phuKien.CongSuat = dto.CongSuat;
                phuKien.DienApDauVao = dto.DienApDauVao;
                phuKien.DienApDauRa = dto.DienApDauRa;
                phuKien.BaoHanh = dto.BaoHanh;
                phuKien.MaKhuyenMai = dto.MaKhuyenMai;

                // C?p nh?t hình ?nh ph?: Xóa h?t ?nh cu c?a ph? ki?n này và add l?i
                var oldImages = _context.HinhAnhSanPhams.Where(h => h.MaPhuKien == id);
                _context.HinhAnhSanPhams.RemoveRange(oldImages);

                if (dto.HinhAnhPhu != null && dto.HinhAnhPhu.Any())
                {
                    foreach (var imagePath in dto.HinhAnhPhu)
                    {
                        if (!string.IsNullOrEmpty(imagePath))
                        {
                            _context.HinhAnhSanPhams.Add(new HinhAnhSanPham
                            {
                                MaPhuKien = id,
                                DuongDanAnh = imagePath
                            });
                        }
                    }
                }
                else if (!string.IsNullOrEmpty(dto.AnhDaiDien))
                {
                    _context.HinhAnhSanPhams.Add(new HinhAnhSanPham
                    {
                        MaPhuKien = id,
                        DuongDanAnh = dto.AnhDaiDien
                    });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var phuKien = await _context.PhuKiens.FindAsync(id);
            if (phuKien == null)
            {
                return false;
            }

            _context.PhuKiens.Remove(phuKien);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
