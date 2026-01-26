namespace Secure_Vault.DTOs
{
    public class AddSecretDTO
    {
        public String UsernameOwner { get; set; }
        public String Name {  get; set; }
        public byte[] Data { get; set; }
        public List<EnvelopeDTO> Envelopes { get; set; }
        public byte[] IV { get; set; }
    }
}
