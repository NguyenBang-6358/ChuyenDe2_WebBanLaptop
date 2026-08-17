using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Web_ban_laptop.Data;
using Web_ban_laptop.Entities;

namespace Web_ban_laptop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DanhMucController : ControllerBase
    {
        private readonly DataContext _context;

        public DanhMucController(DataContext context)
        {
            _context = context;
        }

        // GET: api/DanhMuc
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DanhMuc>>> GetDanhMucs()
        {
            return await _context.DanhMucs.ToListAsync();
        }

        // GET: api/DanhMuc/5
        [HttpGet("{id}")]
        public async Task<ActionResult<DanhMuc>> GetDanhMuc(int id)
        {
            var danhMuc = await _context.DanhMucs.FindAsync(id);

            if (danhMuc == null)
            {
                return NotFound(new { message = $"Không tìm thấy danh mục với ID = {id}" });
            }

            return danhMuc;
        }

        // POST: api/DanhMuc
        [HttpPost]
        public async Task<ActionResult<DanhMuc>> CreateDanhMuc(DanhMuc danhMuc)
        {
            _context.DanhMucs.Add(danhMuc);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDanhMuc), new { id = danhMuc.MaDanhMuc }, danhMuc);
        }

        // PUT: api/DanhMuc/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDanhMuc(int id, DanhMuc danhMuc)
        {
            if (id != danhMuc.MaDanhMuc)
            {
                return BadRequest(new { message = "ID trong URL và ID của đối tượng không khớp" });
            }

            _context.Entry(danhMuc).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await DanhMucExists(id))
                {
                    return NotFound(new { message = $"Không tìm thấy danh mục với ID = {id}" });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/DanhMuc/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDanhMuc(int id)
        {
            var danhMuc = await _context.DanhMucs.FindAsync(id);
            if (danhMuc == null)
            {
                return NotFound(new { message = $"Không tìm thấy danh mục với ID = {id}" });
            }

            _context.DanhMucs.Remove(danhMuc);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<bool> DanhMucExists(int id)
        {
            return await _context.DanhMucs.AnyAsync(e => e.MaDanhMuc == id);
        }
    }
}
