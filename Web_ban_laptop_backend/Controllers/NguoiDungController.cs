using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_ban_laptop.Data;
using Web_ban_laptop.Entities;

namespace Web_ban_laptop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NguoiDungController : ControllerBase
    {
        private readonly DataContext _context;

        public NguoiDungController(DataContext context)
        {
            _context = context;
        }

        // GET: api/NguoiDung
        [HttpGet]
        public async Task<ActionResult<IEnumerable<NguoiDung>>> GetNguoiDungs()
        {
            return await _context.NguoiDungs.ToListAsync();
        }

        // GET: api/NguoiDung/5
        [HttpGet("{id}")]
        public async Task<ActionResult<NguoiDung>> GetNguoiDung(int id)
        {
            var nguoiDung = await _context.NguoiDungs.FindAsync(id);

            if (nguoiDung == null)
            {
                return NotFound(new { message = $"Không tìm thấy người dùng với ID = {id}" });
            }

            return nguoiDung;
        }

        // POST: api/NguoiDung
        [HttpPost]
        public async Task<ActionResult<NguoiDung>> CreateNguoiDung(NguoiDung nguoiDung)
        {
            var emailExists = await _context.NguoiDungs.AnyAsync(u => u.Email == nguoiDung.Email);
            if (emailExists)
            {
                return BadRequest(new { message = "Email này đã được đăng ký sử dụng bởi người dùng khác." });
            }

            _context.NguoiDungs.Add(nguoiDung);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetNguoiDung), new { id = nguoiDung.MaNguoiDung }, nguoiDung);
        }

        // PUT: api/NguoiDung/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNguoiDung(int id, NguoiDung nguoiDung)
        {
            if (id != nguoiDung.MaNguoiDung)
            {
                return BadRequest(new { message = "ID trong URL và ID của đối tượng không khớp" });
            }

            var emailExists = await _context.NguoiDungs.AnyAsync(u => u.Email == nguoiDung.Email && u.MaNguoiDung != id);
            if (emailExists)
            {
                return BadRequest(new { message = "Email này đã được sử dụng bởi một tài khoản khác." });
            }

            _context.Entry(nguoiDung).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await NguoiDungExists(id))
                {
                    return NotFound(new { message = $"Không tìm thấy người dùng với ID = {id}" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/NguoiDung/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNguoiDung(int id)
        {
            var nguoiDung = await _context.NguoiDungs.FindAsync(id);
            if (nguoiDung == null)
            {
                return NotFound(new { message = $"Không tìm thấy người dùng với ID = {id}" });
            }

            _context.NguoiDungs.Remove(nguoiDung);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<bool> NguoiDungExists(int id)
        {
            return await _context.NguoiDungs.AnyAsync(e => e.MaNguoiDung == id);
        }
    }
}
