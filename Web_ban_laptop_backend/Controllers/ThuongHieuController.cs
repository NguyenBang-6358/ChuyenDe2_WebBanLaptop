using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_ban_laptop.Data;
using Web_ban_laptop.Entities;

namespace Web_ban_laptop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ThuongHieuController : ControllerBase
    {
        private readonly DataContext _context;

        public ThuongHieuController(DataContext context)
        {
            _context = context;
        }

        // GET: api/ThuongHieu
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ThuongHieu>>> GetThuongHieus()
        {
            return await _context.ThuongHieus.ToListAsync();
        }

        // GET: api/ThuongHieu/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ThuongHieu>> GetThuongHieu(string id)
        {
            var thuongHieu = await _context.ThuongHieus.FindAsync(id);

            if (thuongHieu == null)
            {
                return NotFound(new { message = $"Không tìm thấy thương hiệu với ID = {id}" });
            }

            return thuongHieu;
        }

        // POST: api/ThuongHieu
        [HttpPost]
        public async Task<ActionResult<ThuongHieu>> CreateThuongHieu(ThuongHieu thuongHieu)
        {
            _context.ThuongHieus.Add(thuongHieu);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetThuongHieu), new { id = thuongHieu.MaThuongHieu }, thuongHieu);
        }

        // PUT: api/ThuongHieu/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateThuongHieu(string id, ThuongHieu thuongHieu)
        {
            if (id != thuongHieu.MaThuongHieu)
            {
                return BadRequest(new { message = "ID trong URL và ID của đối tượng không khớp" });
            }

            _context.Entry(thuongHieu).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await ThuongHieuExists(id))
                {
                    return NotFound(new { message = $"Không tìm thấy thương hiệu với ID = {id}" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/ThuongHieu/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteThuongHieu(string id)
        {
            var thuongHieu = await _context.ThuongHieus.FindAsync(id);
            if (thuongHieu == null)
            {
                return NotFound(new { message = $"Không tìm thấy thương hiệu với ID = {id}" });
            }

            _context.ThuongHieus.Remove(thuongHieu);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<bool> ThuongHieuExists(string id)
        {
            return await _context.ThuongHieus.AnyAsync(e => e.MaThuongHieu == id);
        }
    }
}
