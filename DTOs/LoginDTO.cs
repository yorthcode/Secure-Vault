namespace Secure_Vault.DTOs
{
    public class LoginDTO
    {
        public String Username { get; set; }
        public String PasswordEncrypted {  get; set; }
    }
}
