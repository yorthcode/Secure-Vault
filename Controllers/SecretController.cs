using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Secure_Vault.Classes;
using Secure_Vault.Database;
using Secure_Vault.DTOs;
using System.Security.Claims;

namespace Secure_Vault.Controllers
{
    [ApiController]
    [Route("api/secret")]
    public class SecretController : ControllerBase
    {
        private readonly DatabaseContext db;
        public SecretController(DatabaseContext db)
        {
            this.db = db;
        }
        [Authorize(Roles = "Admin,Lead")]
        [HttpPost("create")]
        public async Task<IActionResult> Create(AddSecretDTO dto)
        {
            Secret secret = new Secret
            {
                Name = dto.Name,
                Data = dto.Data
            };
            db.Secrets.Add(secret);
            await db.SaveChangesAsync();

            SecretKey secretKey = new SecretKey
            {
                UserObj = await db.Users.SingleAsync(u => u.Username == dto.Username),
                SecretObj = secret,
                Envelope = dto.Envelope

            };
            db.SecretKeys.Add(secretKey);
            await db.SaveChangesAsync();

            return Ok("Secret created");
        }
    }
}
