using System.ComponentModel.DataAnnotations;

namespace Secure_Vault.Classes
{
    public class Secret
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        public String Name { get; set; }
        public byte[] Data { get; set; }
        public byte[] IV { get; set; }
        public String UsernameOwner { get; set; }
    }
}
