namespace Secure_Vault.DTOs
{
    public class AddSecretDTO
    {
        //public String Username { get; set; }
        public String Name {  get; set; }
        public byte[] Data { get; set; }
        public List<EnvelopeDTO> Envelopes { get; set; }
    }
}
