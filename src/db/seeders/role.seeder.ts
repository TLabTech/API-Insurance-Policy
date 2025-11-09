import { DataSource } from 'typeorm';
import { Role } from '../../role/role.entity';
import { Seeder } from './seeder.interface';

export class RoleSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const roleRepository = dataSource.getRepository(Role);

    // Check if admin role already exists
    const existingAdminRole = await roleRepository.findOne({
      where: { name: 'admin' },
    });

    if (!existingAdminRole) {
      // Create admin role
      const adminRole = roleRepository.create({
        name: 'admin',
      });

      await roleRepository.save(adminRole);
      console.log('📝 Created admin role');
    } else {
      console.log('ℹ️  Admin role already exists, skipping...');
    }

    // You can add more roles here if needed
    const roles = [{ name: 'staff' }, { name: 'supervisor' }];

    for (const roleData of roles) {
      const existingRole = await roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        const role = roleRepository.create(roleData);
        await roleRepository.save(role);
        console.log(`📝 Created ${roleData.name} role`);
      } else {
        console.log(`ℹ️  ${roleData.name} role already exists, skipping...`);
      }
    }
  }
}
