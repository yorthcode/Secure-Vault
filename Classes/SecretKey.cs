using System.ComponentModel.DataAnnotations;

namespace Secure_Vault.Classes
{
    public class SecretKey
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        public Secret SecretObj { get; set; }
        public Guid SecretObjId { get; set; }

        public User UserObj { get; set; }
        public Guid UserObjId { get; set; }

        public byte[] Envelope { get; set; }
    }
}
