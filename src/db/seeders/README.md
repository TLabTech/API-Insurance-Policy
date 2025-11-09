# Database Seeders

This directory contains database seeders for populating initial data in your NestJS application.

## What Gets Seeded

### Roles
- **admin** - Administrator role with full privileges
- **staff** - Regular staff role  
- **supervisor** - Supervisor role with elevated privileges

### Users
- **Admin User**
  - Email: `admin@example.com`
  - Password: `admin123`
  - Role: `admin`
  - Status: `active`

## Available Commands

```bash
# Run all seeders (production mode - requires build)
npm run seed

# Run seeders in development mode (no build required)
npm run seed:dev

# Verify seeded data
npm run seed:verify
```

## How Seeders Work

1. **Role Seeder** runs first to create all roles
2. **User Seeder** runs second to create users with proper role assignments
3. **Idempotent**: Seeders check if data already exists and skip creation if found

## Security Notes

⚠️ **Important**: The default admin password is `admin123`. Make sure to:
1. Change this password in production
2. Use strong passwords for all accounts
3. Consider using environment variables for sensitive data

## Adding New Seeders

1. Create a new seeder class implementing the `Seeder` interface
2. Add it to the `main.seeder.ts` file
3. Update this README with the new seeded data

## File Structure

```
src/db/seeders/
├── main.seeder.ts      # Main seeder runner
├── seeder.interface.ts # Seeder interface
├── role.seeder.ts      # Role seeder
├── user.seeder.ts      # User seeder
└── README.md           # This file
```