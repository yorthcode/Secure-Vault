using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Secure_Vault.Classes;
using Secure_Vault.Database;
using Secure_Vault.DTOs;
using Secure_Vault.Services;
using System.Security.Claims;

namespace Secure_Vault.Controllers
{
    [ApiController]
    [Route("api/user")]
    public class UserController : ControllerBase
    {
        private readonly DatabaseContext db;
        private readonly JWTService jwts;
        public UserController(DatabaseContext db, JWTService jwts)
        {
            this.db = db;
            this.jwts = jwts;
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
                Role = Role.Developer,
                RefreshToken = jwts.CreateRefreshToken(),
                RefreshTokenExpire = DateTime.Now
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Ok(new 
            {
                message = "Registered",
            });
        }
        [Authorize]
        [HttpGet("getsalt")]
        public async Task<IActionResult> GetSalt()
        {
            String claim = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            if (claim == null)
                return Unauthorized();

            User user = await db.Users.SingleOrDefaultAsync(u => u.Id.ToString() == claim);
            if (user == null)
                return Unauthorized();

            return Ok(new
            {
                KDFSalt = user.KDFSalt
            });
        }
    }
}
