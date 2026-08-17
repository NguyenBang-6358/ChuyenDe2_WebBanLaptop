using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_ban_laptop.Data;
using Web_ban_laptop.Entities;

namespace Web_ban_laptop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KhuyenMaiController : ControllerBase
    {
        private readonly DataContext _context;

        public KhuyenMaiController(DataContext context)
        {
            _context = context;
        }

        // GET: api/KhuyenMai
        [HttpGet]
        public async Task<ActionResult<IEnumerable<KhuyenMai>>> GetKhuyenMais()
        {
            return await _context.KhuyenMais.ToListAsync();
        }

        // GET: api/KhuyenMai/5
        [HttpGet("{id}")]
        public async Task<ActionResult<KhuyenMai>> GetKhuyenMai(int id)
        {
            var khuyenMai = await _context.KhuyenMais.FindAsync(id);

            if (khuyenMai == null)
            {
                return NotFound(new { message = $"Không tìm thấy khuyến mãi với ID = {id}" });
            }

            return khuyenMai;
        }

        // POST: api/KhuyenMai
        [HttpPost]
        public async Task<ActionResult<KhuyenMai>> CreateKhuyenMai(KhuyenMai khuyenMai)
        {
            _context.KhuyenMais.Add(khuyenMai);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetKhuyenMai), new { id = khuyenMai.MaKhuyenMai }, khuyenMai);
        }

        // PUT: api/KhuyenMai/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateKhuyenMai(int id, KhuyenMai khuyenMai)
        {
            if (id != khuyenMai.MaKhuyenMai)
            {
                return BadRequest(new { message = "ID trong URL và ID của đối tượng không khớp" });
            }

            _context.Entry(khuyenMai).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await KhuyenMaiExists(id))
                {
                    return NotFound(new { message = $"Không tìm thấy khuyến mãi với ID = {id}" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/KhuyenMai/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteKhuyenMai(int id)
        {
            var khuyenMai = await _context.KhuyenMais.FindAsync(id);
            if (khuyenMai == null)
            {
                return NotFound(new { message = $"Không tìm thấy khuyến mãi với ID = {id}" });
            }

            _context.KhuyenMais.Remove(khuyenMai);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<bool> KhuyenMaiExists(int id)
        {
            return await _context.KhuyenMais.AnyAsync(e => e.MaKhuyenMai == id);
        }
    }
}
