namespace Secure_Vault.DTOs
{
    public class UpdateSecretDTO
    {
        public String UsernameOwner { get; set; }
        public String Name { get; set; }
        public byte[] Data { get; set; }
    }
}
