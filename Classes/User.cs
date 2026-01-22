using System;
using System.ComponentModel.DataAnnotations;

namespace Secure_Vault.Classes
{
    public enum Role
    {
        Admin,
        Lead,
        Developer
    }
    public class User
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Username { get; set; }
        public string PasswordEncrypted { get; set; }
        public String PublicKey { get; set; }
        public String KDFSalt { get; set; }
        public Role Role { get; set; }
        public String RefreshToken { get; set; }
        public DateTime RefreshTokenExpire { get; set; }
    }
}
