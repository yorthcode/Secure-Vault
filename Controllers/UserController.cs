using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Secure_Vault.Classes;
using Secure_Vault.Database;
using Secure_Vault.DTOs;

namespace Secure_Vault.Controllers
{
    [ApiController]
    [Route("api/user")]
    public class UserController : ControllerBase
    {
        private readonly DatabaseContext db;
        public UserController(DatabaseContext db)
        {
            this.db = db;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDTO dto)
        {
            if (await db.Users.AnyAsync(u => u.Username == dto.Username))
                return BadRequest(new
                {
                    message = "User exists",
                });

            User user = new User
            {
                Username = dto.Username,
                PasswordEncrypted = dto.PasswordEncrypted,
                PublicKey = dto.PublicKey,
                KDFSalt = dto.KDFSalt,
                Role = Role.Developer
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Ok(new 
            {
                message = "Registered",
            });
        }
    }
}
