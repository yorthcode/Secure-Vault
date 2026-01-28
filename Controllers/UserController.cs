using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Secure_Vault.Classes;
using Secure_Vault.Database;
using Secure_Vault.DTOs;
using Secure_Vault.Services;
using System.Security.Claims;
using OtpNet;

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
                RefreshTokenExpire = DateTime.Now,
                TOTPSecret = Base32Encoding.ToString(KeyGeneration.GenerateRandomKey(20)),
                TOTPStep = 0
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Ok(new 
            {
                message = "Registered",
                secret = user.TOTPSecret
            });
        }
        [Authorize]
        [HttpGet("getinfo")]
        public async Task<IActionResult> GetInfo()
        {
            String claim = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            if (claim == null)
                return Unauthorized(new
                {
                    message = "Not logged in"
                });

            User user = await db.Users.SingleOrDefaultAsync(u => u.Id.ToString() == claim);
            if (user == null)
                return Unauthorized(new
                {
                    message = "User not found"
                });

            return Ok(new
            {
                salt = user.KDFSalt
            });
        }
        [Authorize]
        [HttpGet("getpubkeys")]
        public async Task<IActionResult> GetPublicKey()
        {
            String claim = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            if (claim == null)
                return Unauthorized(new
                {
                    message = "Not logged in"
                });

            User user = await db.Users.SingleOrDefaultAsync(u => u.Id.ToString() == claim);
            if (user == null)
                return Unauthorized(new
                {
                    message = "User not found"
                });

            List<String> pubkeyArray = new List<String>();
            List<String> userArray = new List<String>();

            foreach (User u in db.Users){
                pubkeyArray.Add(u.PublicKey);
                userArray.Add(u.Username);
            }

            return Ok(new
            {
                pubkeys = pubkeyArray,
                users = userArray
            });
        }

        [Authorize]
        [HttpPost("sendinfo")]
        public async Task<IActionResult> SendInfo(SendInfoDTO dto)
        {
            String claim = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            if (claim == null)
                return Unauthorized(new
                {
                    message = "Not logged in"
                });

            User user = await db.Users.SingleOrDefaultAsync(u => u.Id.ToString() == claim);
            if (user == null)
                return Unauthorized(new
                {
                    message = "User not found"
                });

            user.KDFSalt = dto.KDFSalt;
            user.PublicKey = dto.PublicKey;

            await db.SaveChangesAsync();
            return Ok(new
            {
                message = "Saved info",
                totp = user.TOTPSecret
            });
        }
    }
}
