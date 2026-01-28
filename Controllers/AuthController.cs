using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OtpNet;
using Secure_Vault.Classes;
using Secure_Vault.Database;
using Secure_Vault.DTOs;
using Secure_Vault.Services;
using System.Security.Claims;
using System.Security.Cryptography;

namespace Secure_Vault.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly DatabaseContext db;
        private readonly JWTService jwts;

        public AuthController(DatabaseContext db, JWTService jwts)
        {
            this.db = db;
            this.jwts = jwts;
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

            Totp totp = new Totp(Base32Encoding.ToBytes(loggedInUser.TOTPSecret));
            if (!totp.VerifyTotp(dto.TOTP, out long timeStepMatched, new VerificationWindow()))
                return Unauthorized(new
                {
                    message = "Invalid OTP code",
                });

            if (loggedInUser.TOTPStep != 0 && timeStepMatched <= loggedInUser.TOTPStep)
                return Unauthorized(new
                {
                    message = "OTP code expired",
                });

            String refresh = jwts.CreateRefreshToken();

            Response.Cookies.Append("token", jwts.CreateToken(loggedInUser), new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddMinutes(2)
            });

            Response.Cookies.Append("refresh", refresh, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddDays(7)
            });

            loggedInUser.RefreshToken = refresh;
            loggedInUser.RefreshTokenExpire = DateTime.UtcNow.AddDays(7);

            await db.SaveChangesAsync();

            return Ok(new
            {
                message = "Logged in",
                role = loggedInUser.Role
            });
        }
        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            String RefreshToken = Request.Cookies["refresh"];
            User user = await db.Users.SingleOrDefaultAsync(u => u.RefreshToken ==  RefreshToken);
            if (user != null)
            {
                user.RefreshToken = "0";
                user.RefreshTokenExpire = DateTime.UtcNow;
                await db.SaveChangesAsync();
            }

            Response.Cookies.Append("token", "0", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddMinutes(2)
            });

            Response.Cookies.Append("refresh", "0", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddDays(7)
            });

            return Ok(new
            {
                message = "Logged out",
            });
        }

        [Authorize]
        [HttpGet("status")]
        public async Task<IActionResult> Status()
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
                message = "Logged in",
                uname = user.Username,
                role = user.Role
            });
        }

        [HttpGet("refresh")]
        public async Task<IActionResult> Refresh()
        {
            String req = Request.Cookies["refresh"];
            if (req == null)
                return Unauthorized(new
                {
                    message = "No refresh token"
                });

            User user = await db.Users.SingleOrDefaultAsync(u => u.RefreshToken == req && DateTime.Compare(u.RefreshTokenExpire, DateTime.UtcNow) > 0);
            if (user == null)
                return Unauthorized(new
                {
                    message = "Refresh token expired"
                });

            String RefreshToken = jwts.CreateRefreshToken();
            user.RefreshToken = RefreshToken;
            user.RefreshTokenExpire = DateTime.UtcNow.AddDays(7);

            await db.SaveChangesAsync();

            String Token = jwts.CreateToken(user);

            Response.Cookies.Append("token", Token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddMinutes(2)
            });

            Response.Cookies.Append("refresh", RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddDays(7)
            });

            return Ok(new
            {
                message = "Refreshed",
                uname = user.Username,
                role = user.Role
            }); 
        }

        [HttpGet("google")]
        public async Task<IActionResult> Google()
        {
            AuthenticationProperties props = new AuthenticationProperties
            {
                RedirectUri = "api/auth/google/callback"
            };
            return Challenge(props, GoogleDefaults.AuthenticationScheme);
        }

        [HttpGet("google/callback")]
        public async Task<IActionResult> GoogleCallback()
        {
            AuthenticateResult result = HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme).Result;
            if (!result.Succeeded)
                return Unauthorized(new
                {
                    message = "Sign in failed"
                });

            String email = result.Principal.FindFirstValue(ClaimTypes.Email);

            User u = await db.Users.SingleOrDefaultAsync(u => u.Username == email);

            if (u == null)
            {
                u = new User
                {
                    Username = email,
                    PasswordEncrypted = "DOESNOTEXIST",
                    PublicKey = "",
                    KDFSalt = "",
                    Role = Role.Developer,
                    RefreshToken = jwts.CreateRefreshToken(),
                    RefreshTokenExpire = DateTime.Now,
                    TOTPSecret = Base32Encoding.ToString(KeyGeneration.GenerateRandomKey(20)),
                    TOTPStep = 0
                };
                db.Users.Add(u);
            }

            String RefreshToken = jwts.CreateRefreshToken();
            u.RefreshToken = RefreshToken;
            u.RefreshTokenExpire = DateTime.UtcNow.AddDays(7);
           
            await db.SaveChangesAsync();

            String Token = jwts.CreateToken(u);

            Response.Cookies.Append("token", Token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddMinutes(2)
            });

            Response.Cookies.Append("refresh", RefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddDays(7)
            });

            return Redirect("http://localhost:5173/oidcinfo");
        }
    }
}
