using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Secure_Vault.Classes;
using Secure_Vault.Database;
using Secure_Vault.DTOs;
using System.Security.Claims;
using System.Security.Cryptography;

namespace Secure_Vault.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly DatabaseContext db;

        public AuthController(DatabaseContext db)
        {
            this.db = db;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO dto)
        {
            User loggedInUser = await db.Users.SingleOrDefaultAsync(u => u.Username == dto.Username);
            if (loggedInUser == null)
                return Unauthorized(new
                {
                    message = "Invalid username",
                });

            if (!CryptographicOperations.FixedTimeEquals(Convert.FromBase64String(loggedInUser.PasswordEncrypted), Convert.FromBase64String(dto.PasswordEncrypted)))
                return Unauthorized(new
                {
                    message = "Invalid password",
                });

            List<Claim> claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, loggedInUser.Id.ToString()),
                new Claim(ClaimTypes.Name, loggedInUser.Username),
                new Claim(ClaimTypes.Role, loggedInUser.Role.ToString())
            };

            ClaimsIdentity identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

            await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity));
            return Ok(new
            {
                message = "Logged in",
            });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync();
            return Ok(new
            {
                message = "Logged out",
            });
        }
    }
}
