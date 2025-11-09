import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../user/user.entity';
import { Role } from '../role/role.entity';

// Load environment variables
config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'mydatabase',
  entities: ['dist/**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: false,
});

async function verifySeededData() {
  try {
    await AppDataSource.initialize();
    console.log('🔍 Verifying seeded data...\n');

    const roleRepository = AppDataSource.getRepository(Role);
    const userRepository = AppDataSource.getRepository(User);

    // Check roles
    const roles = await roleRepository.find();
    console.log('📝 Roles in database:');
    roles.forEach((role) => {
      console.log(`   - ${role.name} (ID: ${role.id})`);
    });

    // Check users with their roles
    const users = await userRepository.find({
      relations: ['role'],
    });

    console.log('\n👤 Users in database:');
    users.forEach((user) => {
      console.log(`   - ${user.firstName} ${user.lastName}`);
      console.log(`     📧 Email: ${user.email}`);
      console.log(`     👑 Role: ${user.role?.name || 'No role assigned'}`);
      console.log(`     ✅ Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error verifying data:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifySeededData();
}

export { verifySeededData };
