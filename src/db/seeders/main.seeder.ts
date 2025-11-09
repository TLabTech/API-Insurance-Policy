import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { RoleSeeder } from './role.seeder';
import { UserSeeder } from './user.seeder';

// Load environment variables
config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'mydatabase',
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
  logging: true,
});

async function runSeeders() {
  try {
    await AppDataSource.initialize();
    console.log('🌱 Starting database seeding...');

    // Run role seeder first
    const roleSeeder = new RoleSeeder();
    await roleSeeder.run(AppDataSource);
    console.log('✅ Role seeder completed');

    // Then run user seeder
    const userSeeder = new UserSeeder();
    await userSeeder.run(AppDataSource);
    console.log('✅ User seeder completed');

    console.log('🌱 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run seeders if this file is executed directly
if (require.main === module) {
  runSeeders();
}

export { AppDataSource, runSeeders };
