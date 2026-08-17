using System.Collections.Generic;
using System.Threading.Tasks;
using Web_ban_laptop.Entities;
using Web_ban_laptop.Controllers;

namespace Web_ban_laptop.Services
{
    public interface IPhuKienService
    {
        Task<IEnumerable<PhuKien>> GetAllAsync();
        Task<PhuKien?> GetByIdAsync(int id);
        Task<PhuKien> CreateAsync(PhuKienDto dto);
        Task<bool> UpdateAsync(int id, PhuKienDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
