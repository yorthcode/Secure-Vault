namespace Secure_Vault.DTOs
{
    public class RegisterDTO
    {
        public String Username { get; set; }
        public String PasswordEncrypted { get; set; }
        public String KDFSalt {  get; set; }
        public String PublicKey { get; set; }
    }
}
