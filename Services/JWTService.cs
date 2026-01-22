using Microsoft.IdentityModel.Tokens;
using Secure_Vault.Classes;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Secure_Vault.Services
{
    public class JWTService
    {
        private readonly IConfiguration config;
        public JWTService(IConfiguration config)
        {
            this.config = config;
        }

        public String CreateToken(User user)
        {
            List<Claim> claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            SymmetricSecurityKey ssk = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]));
            SigningCredentials sc = new SigningCredentials(ssk, SecurityAlgorithms.HmacSha256);

            JwtSecurityToken jst = new JwtSecurityToken(issuer: config["Jwt:Issuer"], audience: config["Jwt:Audience"], claims, expires: DateTime.UtcNow.AddMinutes(10), signingCredentials: sc);

            return new JwtSecurityTokenHandler().WriteToken(jst);
        }
        public String CreateRefreshToken()
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        }

    }
}