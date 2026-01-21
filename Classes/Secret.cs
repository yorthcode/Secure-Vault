using System.ComponentModel.DataAnnotations;

namespace Secure_Vault.Classes
{
    public class Secret
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        public String Name { get; set; }
        public byte[] Data { get; set; }
    }
}
