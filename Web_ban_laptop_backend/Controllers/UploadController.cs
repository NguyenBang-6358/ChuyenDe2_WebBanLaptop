using Microsoft.AspNetCore.Mvc;

namespace Web_ban_laptop.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _environment;

        public UploadController(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        /// <summary>
        /// POST: api/Upload - Upload 1 file ảnh sản phẩm vào thư mục uploads
        /// Trả về đường dẫn tương đối /uploads/{filename} lưu trực tiếp vào CSDL
        /// </summary>
        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadImage(IFormFile? file)
        {
            var targetFile = file ?? (Request.HasFormContentType && Request.Form.Files.Count > 0 ? Request.Form.Files[0] : null);
            if (targetFile == null || targetFile.Length == 0)
            {
                return BadRequest(new { message = "Vui lòng chọn file hình ảnh hợp lệ" });
            }

            var contentRootPath = _environment.ContentRootPath ?? Directory.GetCurrentDirectory();
            var uploadsFolderPath = Path.Combine(contentRootPath, "uploads");
            if (!Directory.Exists(uploadsFolderPath))
            {
                Directory.CreateDirectory(uploadsFolderPath);
            }

            var extension = Path.GetExtension(targetFile.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}_{DateTime.Now.Ticks}{extension}";
            var filePath = Path.Combine(uploadsFolderPath, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await targetFile.CopyToAsync(stream);
            }

            var relativePath = $"/uploads/{uniqueFileName}";
            return Ok(new { url = relativePath, path = relativePath, fileName = uniqueFileName });
        }

        /// <summary>
        /// POST: api/Upload/multiple - Upload nhiều file ảnh góc sản phẩm cùng lúc vào uploads
        /// </summary>
        [HttpPost("multiple")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadMaultipleImages(List<IFormFile>? files)
        {
            var targetFiles = (files != null && files.Count > 0)
                ? files
                : (Request.HasFormContentType ? Request.Form.Files.ToList() : new List<IFormFile>());

            if (targetFiles == null || targetFiles.Count == 0)
            {
                return BadRequest(new { message = "Vui lòng chọn ít nhất một file hình ảnh hợp lệ" });
            }

            var contentRootPath = _environment.ContentRootPath ?? Directory.GetCurrentDirectory();
            var uploadsFolderPath = Path.Combine(contentRootPath, "uploads");
            if (!Directory.Exists(uploadsFolderPath))
            {
                Directory.CreateDirectory(uploadsFolderPath);
            }

            var resultUrls = new List<string>();

            foreach (var targetFile in targetFiles)
            {
                if (targetFile != null && targetFile.Length > 0)
                {
                    var extension = Path.GetExtension(targetFile.FileName);
                    var uniqueFileName = $"{Guid.NewGuid()}_{DateTime.Now.Ticks}{extension}";
                    var filePath = Path.Combine(uploadsFolderPath, uniqueFileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await targetFile.CopyToAsync(stream);
                    }

                    resultUrls.Add($"/uploads/{uniqueFileName}");
                }
            }

            return Ok(new { urls = resultUrls, images = resultUrls });
        }
    }
}
