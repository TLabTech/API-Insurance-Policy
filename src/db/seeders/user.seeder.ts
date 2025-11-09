import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../user/user.entity';
import { Role } from '../../role/role.entity';
import { Seeder } from './seeder.interface';

export class UserSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(User);
    const roleRepository = dataSource.getRepository(Role);

    // Find all roles
    const adminRole = await roleRepository.findOne({
      where: { name: 'admin' },
    });
    const staffRole = await roleRepository.findOne({
      where: { name: 'staff' },
    });
    const supervisorRole = await roleRepository.findOne({
      where: { name: 'supervisor' },
    });

    if (!adminRole || !staffRole || !supervisorRole) {
      throw new Error(
        'Required roles not found. Please run role seeder first.',
      );
    }

    const saltOrRounds = 10;

    // Define users to seed
    const usersToSeed = [
      {
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        password: 'admin123',
        role: adminRole,
      },
      {
        email: 'staff@example.com',
        firstName: 'Staff',
        lastName: 'User',
        password: 'staff123',
        role: staffRole,
      },
      {
        email: 'supervisor@example.com',
        firstName: 'Supervisor',
        lastName: 'User',
        password: 'supervisor123',
        role: supervisorRole,
      },
    ];

    // Create or update users
    for (const userData of usersToSeed) {
      const existingUser = await userRepository.findOne({
        where: { email: userData.email },
      });

      // Hash the password ONCE
      const hashedPassword = await bcrypt.hash(userData.password, saltOrRounds);

      if (!existingUser) {
        // Insert directly with QueryBuilder (bypasses hooks)
        await dataSource
          .createQueryBuilder()
          .insert()
          .into(User)
          .values({
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            password: hashedPassword,
            isActive: true,
            roleID: userData.role.id,
          })
          .execute();

        console.log(`👤 Created ${userData.role.name} user:`);
        console.log(`   📧 Email: ${userData.email}`);
        console.log(`   🔑 Password: ${userData.password}`);
        console.log(`   👔 Role: ${userData.role.name}`);
      } else {
        // Update existing user
        await dataSource
          .createQueryBuilder()
          .update(User)
          .set({
            password: hashedPassword,
            roleID: userData.role.id,
            isActive: true,
          })
          .where('email = :email', { email: userData.email })
          .execute();

        console.log(`🔄 Updated ${userData.role.name} user:`);
        console.log(`   📧 Email: ${userData.email}`);
        console.log(`   🔑 Password: ${userData.password} (updated)`);
        console.log(`   👔 Role: ${userData.role.name}`);
      }
    }
  }
}
