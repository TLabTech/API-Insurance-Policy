# TypeORM Database Migrations

This directory contains database migrations for the NestJS application using TypeORM.

## Directory Structure

```
src/db/
├── data-source.ts           # TypeORM DataSource configuration for CLI
└── migrations/              # Migration files directory
    └── *.ts                # Individual migration files
```

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run migration:generate <name>` | Generate new migration | Creates a migration based on entity changes |
| `npm run migration:create <name>` | Create empty migration | Creates an empty migration file |
| `npm run migration:run` | Run migrations | Executes pending migrations |
| `npm run migration:revert` | Revert migration | Reverts the last executed migration |
| `npm run migration:show` | Show migrations | Shows all migrations and their status |

## Usage Examples

### 1. Generate Migration from Entity Changes
When you modify entities (add/remove columns, change types, etc.):

```bash
npm run migration:generate src/db/migrations/AddUserPhoneColumn
```

### 2. Create Empty Migration
For custom SQL or data seeding:

```bash
npm run migration:create src/db/migrations/SeedInitialRoles
```

### 3. Run Migrations
Execute all pending migrations:

```bash
npm run migration:run
```

### 4. Revert Last Migration
Undo the last executed migration:

```bash
npm run migration:revert
```

### 5. Check Migration Status
See which migrations have been executed:

```bash
npm run migration:show
```

## Migration File Structure

Each migration file implements the `MigrationInterface`:

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationName1234567890123 implements MigrationInterface {
    name = 'MigrationName1234567890123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // SQL to apply the migration
        await queryRunner.query(`CREATE TABLE ...`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // SQL to revert the migration
        await queryRunner.query(`DROP TABLE ...`);
    }
}
```

## Configuration

### Application Module (`src/app.module.ts`)
```typescript
TypeOrmModule.forRoot({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/db/migrations/*{.ts,.js}'],
  migrationsRun: false, // Set to true for auto-run on startup
  synchronize: false,   // MUST be false when using migrations
  logging: false,
})
```

### CLI Configuration (`src/db/data-source.ts`)
```typescript
export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/db/migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: true,
});
```

## Important Notes

1. **Synchronize Must Be False**: When using migrations, always set `synchronize: false` in your TypeORM configuration.

2. **Migration Order**: Migrations are executed in chronological order based on their timestamp.

3. **Data Safety**: Always backup your database before running migrations in production.

4. **Testing**: Test migrations thoroughly in development before applying to production.

5. **Rollback Strategy**: Always implement proper `down` methods for safe rollbacks.

## Troubleshooting

### Common Issues

1. **Module Resolution Errors**: If you encounter import errors, ensure all entity paths are correct in `data-source.ts`.

2. **ES Modules Issues**: The project uses ES modules. If TypeORM CLI fails, you may need to use the JSON configuration approach.

3. **Permission Errors**: Ensure the database file has proper write permissions.

### Alternative Configuration (ormconfig.json)

If TypeORM CLI has issues with the TypeScript data source, you can use JSON configuration:

```json
{
  "type": "sqlite",
  "database": "database.sqlite",
  "entities": ["src/**/*.entity{.ts,.js}"],
  "migrations": ["src/db/migrations/*.ts"],
  "migrationsTableName": "migrations",
  "synchronize": false,
  "logging": true
}
```

## Production Checklist

- [ ] Set `synchronize: false`
- [ ] Set `migrationsRun: false` (run migrations manually)
- [ ] Test all migrations in staging environment
- [ ] Backup production database
- [ ] Run migrations during maintenance window
- [ ] Verify data integrity after migration