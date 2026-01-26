using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Secure_Vault.Classes;
using Secure_Vault.Database;
using Secure_Vault.DTOs;
using System.Linq;
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
        [Authorize]
        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] AddSecretDTO dto)
        {
            String role = User.FindFirst(ClaimTypes.Role).Value;
            if (role != Role.Lead.ToString() && role != Role.Admin.ToString())
                return Unauthorized(new
                {
                    message = "Secrets can only be created by leads or admins"
                });

            Secret secret = new Secret
            {
                Name = dto.Name,
                Data = dto.Data,
                IV = dto.IV,
                UsernameOwner = dto.UsernameOwner
            };
            db.Secrets.Add(secret);

            List<SecretKey> sks = new List<SecretKey>();

            foreach (var e in dto.Envelopes)
            {
                User user = await db.Users.SingleOrDefaultAsync(u => u.Username == e.Username);
                if (user == null)
                    continue;

                sks.Add(new SecretKey
                {
                    UserObj = user,
                    SecretObj = secret,
                    Envelope = e.Envelope,
                });
            }

            db.SecretKeys.AddRange(sks);
            await db.SaveChangesAsync();

            return Ok(new
            {
                message = "Secret created"
            });
        }
        [Authorize]
        [HttpGet("getall")]
        public async Task<IActionResult> GetAll()
        {
            String claim = User.FindFirst(ClaimTypes.NameIdentifier).Value;
            if (claim == null)
                return Unauthorized(new
                {
                    message = "Not logged in"
                });

            List<Secret> SecretArray = new List<Secret>();
            List<byte[]> EnvelopeArray = new List<byte[]>();

            foreach (SecretKey sk in db.SecretKeys.Where(sk => sk.UserObjId.ToString() == claim).ToList())
            {
                SecretArray.Add(db.Secrets.Where(s => s.Id == sk.SecretObjId).ToList().First());
                EnvelopeArray.Add(sk.Envelope);
            }

            return Ok(new
            {
                message = "Secrets fetched",
                secrets = SecretArray,
                envelopes = EnvelopeArray
            });
        }

        [Authorize]
        [HttpDelete("delete")]
        public async Task<IActionResult> Delete([FromBody] DeleteSecretDTO dto)
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


            Secret sec = await db.Secrets.SingleOrDefaultAsync(s => s.UsernameOwner == dto.UsernameOwner && s.Name == dto.Name);
            if (sec == null)
                return BadRequest(new
                {
                    message = "Secret not found"
                });

            db.Secrets.Remove(sec);

            foreach (SecretKey sk in db.SecretKeys.Where(sk=> sk.SecretObjId == sec.Id))
                db.SecretKeys.Remove(sk);

            await db.SaveChangesAsync();

            return Ok(new
            {
                message = "Secret deleted"
            });
        }

        [Authorize]
        [HttpPost("update")]
        public async Task<IActionResult> Update(UpdateSecretDTO dto)
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

            Secret sec = await db.Secrets.SingleOrDefaultAsync(s => dto.UsernameOwner == s.UsernameOwner && s.Name == dto.Name);
            sec.Data = dto.Data;

            db.Secrets.Update(sec);

            await db.SaveChangesAsync();

            return Ok(new
            {
                message = "Secret updated"
            });
        }
    }
}
