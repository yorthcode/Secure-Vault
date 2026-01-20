using Microsoft.EntityFrameworkCore;
using Secure_Vault.Classes;

namespace Secure_Vault.Database
{
    public class DatabaseContext : DbContext
    {
        public DatabaseContext(DbContextOptions<DatabaseContext> options) : base(options) { }
        public DbSet<User> Users => Set<User>();
        public DbSet<Secret> Secrets => Set<Secret>();
        public DbSet<SecretKey> SecretKeys => Set<SecretKey>();
    }
}
