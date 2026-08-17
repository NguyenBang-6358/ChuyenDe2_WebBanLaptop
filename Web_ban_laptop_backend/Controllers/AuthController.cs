using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Web_ban_laptop.Data;
using Web_ban_laptop.Entities;

namespace Web_ban_laptop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly IConfiguration _config;

        public AuthController(DataContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // POST: api/Auth/Register
        [HttpPost("Register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            var emailExists = await _context.NguoiDungs.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower());
            if (emailExists)
            {
                return BadRequest(new { message = "Email này đã được sử dụng bởi tài khoản khác." });
            }

            var nguoiDung = new NguoiDung
            {
                HoTen = dto.HoTen,
                Email = dto.Email,
                MatKhau = dto.MatKhau, // Lưu mật khẩu thuần Plain Text
                SoDienThoai = dto.SoDienThoai,
                DiaChi = dto.DiaChi,
                VaiTro = "khach_hang",
                TrangThai = "hoat_dong",
                NgayTao = DateTime.Now
            };

            _context.NguoiDungs.Add(nguoiDung);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đăng ký tài khoản thành công!", userId = nguoiDung.MaNguoiDung });
        }

        // POST: api/Auth/Login
        [HttpPost("Login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var nguoiDung = await _context.NguoiDungs
                .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower());

            if (nguoiDung == null)
            {
                return Unauthorized(new { message = "Email đăng nhập không tồn tại trên hệ thống." });
            }

            // So sánh mật khẩu Plain Text trực tiếp
            if (nguoiDung.MatKhau != dto.MatKhau)
            {
                return Unauthorized(new { message = "Mật khẩu không chính xác." });
            }

            if (nguoiDung.TrangThai == "khoa")
            {
                return BadRequest(new { message = "Tài khoản của bạn hiện đang bị khóa." });
            }

            var token = GenerateJwtToken(nguoiDung);

            return Ok(new
            {
                message = "Đăng nhập thành công!",
                token = token,
                user = new
                {
                    maNguoiDung = nguoiDung.MaNguoiDung,
                    hoTen = nguoiDung.HoTen,
                    email = nguoiDung.Email,
                    vaiTro = nguoiDung.VaiTro
                }
            });
        }

        
        // POST: api/Auth/GoogleLogin
        [HttpPost("GoogleLogin")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { message = "Email Google không hợp lệ." });
            }

            var emailLower = dto.Email.Trim().ToLower();
            var nguoiDung = await _context.NguoiDungs.FirstOrDefaultAsync(u => u.Email.ToLower() == emailLower);

            if (nguoiDung == null)
            {
                var nameFromEmail = !string.IsNullOrWhiteSpace(dto.Name)
                    ? dto.Name
                    : emailLower.Split('@')[0];

                nguoiDung = new NguoiDung
                {
                    HoTen = nameFromEmail,
                    Email = emailLower,
                    MatKhau = "GoogleOAuth_" + Guid.NewGuid().ToString("N"),
                    VaiTro = "khach_hang",
                    TrangThai = "hoat_dong",
                    NgayTao = DateTime.Now
                };

                _context.NguoiDungs.Add(nguoiDung);
                await _context.SaveChangesAsync();
            }
            else if (nguoiDung.TrangThai == "khoa")
            {
                return BadRequest(new { message = "Tài khoản của bạn hiện đang bị khóa." });
            }

            var token = GenerateJwtToken(nguoiDung);

            return Ok(new
            {
                message = "Đăng nhập Google thành công!",
                token = token,
                user = new
                {
                    maNguoiDung = nguoiDung.MaNguoiDung,
                    hoTen = nguoiDung.HoTen,
                    email = nguoiDung.Email,
                    vaiTro = nguoiDung.VaiTro
                }
            });
        }

        private string GenerateJwtToken(NguoiDung nguoiDung)
        {
            var key = _config["Jwt:Key"] ?? "SieuSecretKeyBaoMatTuyetDoiLaptopStore2026Net8Apis!";
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var rawRole = nguoiDung.VaiTro ?? "khach_hang";
            var role = (rawRole == "quan_tri" || rawRole == "admin" || rawRole == "administrator") ? "admin" : rawRole;

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, nguoiDung.MaNguoiDung.ToString()),
                new Claim(ClaimTypes.Email, nguoiDung.Email),
                new Claim(ClaimTypes.Role, role),
                new Claim("role", role)
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"] ?? "LaptopStoreBackend",
                audience: _config["Jwt:Audience"] ?? "LaptopStoreClients",
                claims: claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class RegisterDto
    {
        public string HoTen { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string MatKhau { get; set; } = string.Empty;
        public string? SoDienThoai { get; set; }
        public string? DiaChi { get; set; }
    }

    public class GoogleLoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string? Name { get; set; }
    }

    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string MatKhau { get; set; } = string.Empty;
    }
}