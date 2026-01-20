using System.ComponentModel.DataAnnotations;

namespace Secure_Vault.Classes
{
    public class SecretKey
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid SecretId { get; set; }
        public Secret SecretObj { get; set; }

        public Guid UserId {  get; set; }
        public User UserObj { get; set; }

        public byte[] Envelope { get; set; }
        public SecretRole Role { get; set; }
    }
}
