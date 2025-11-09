import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/user/user.entity';
import { Role } from '../src/role/role.entity';

describe('User (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;
  let adminRole: Role;
  let userRole: Role;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    roleRepository = moduleFixture.get<Repository<Role>>(
      getRepositoryToken(Role),
    );

    await app.init();

    // Create test roles
    adminRole = await roleRepository.save({ name: 'Admin' });
    userRole = await roleRepository.save({ name: 'User' });
  });

  beforeEach(async () => {
    // Clean up database before each test (users first due to foreign key constraint)
    await userRepository.clear();
    await roleRepository.clear();

    // Recreate test roles for each test
    adminRole = await roleRepository.save({ name: 'Admin' });
    userRole = await roleRepository.save({ name: 'User' });
  });

  afterAll(async () => {
    // Clean up database after all tests
    await userRepository.clear();
    await roleRepository.clear();
    await app.close();
  });

  describe('/users (POST)', () => {
    it('should create a new user with hashed password', async () => {
      const createUserDto = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'securePassword123',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(Number),
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        isActive: true,
        roleID: null,
        role: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify password is not returned in response
      expect(response.body.password).toBeUndefined();

      // Verify user was saved to database with hashed password
      const savedUser = await userRepository.findOne({
        where: { email: createUserDto.email },
        select: [
          'id',
          'email',
          'firstName',
          'lastName',
          'password',
          'isActive',
          'roleID',
          'createdAt',
          'updatedAt',
        ],
        relations: { role: true },
      });

      expect(savedUser).toBeDefined();
      expect(savedUser!.password).not.toBe(createUserDto.password); // Password should be hashed
      expect(savedUser!.password).toMatch(/^\$2[aby]?\$\d{1,2}\$.{53}$/); // bcrypt hash format
      expect(savedUser!.role).toBeNull(); // No role assigned
    });

    it('should create a new user with a role', async () => {
      const createUserDto = {
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        password: 'adminPassword123',
        roleID: adminRole.id,
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(Number),
        email: createUserDto.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        isActive: true,
        roleID: adminRole.id,
        role: {
          id: adminRole.id,
          name: adminRole.name,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify password is not returned in response
      expect(response.body.password).toBeUndefined();
    });

    it('should return 400 when creating user with duplicate email', async () => {
      const createUserDto = {
        email: 'duplicate@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
      };

      // Create first user
      await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(201);

      // Try to create user with same email
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(createUserDto)
        .expect(400);

      expect(response.body.message).toBe('User with this email already exists');
    });

    it('should return 400 when required fields are missing', async () => {
      const incompleteUserDto = {
        email: 'incomplete@example.com',
        firstName: 'John',
        // Missing lastName and password
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(incompleteUserDto)
        .expect(400);
    });
  });

  describe('/users (GET)', () => {
    it('should return empty array when no users exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all users without passwords', async () => {
      // Create test users
      const users = [
        {
          email: 'user1@example.com',
          firstName: 'User',
          lastName: 'One',
          password: 'password1',
          roleID: adminRole.id,
        },
        {
          email: 'user2@example.com',
          firstName: 'User',
          lastName: 'Two',
          password: 'password2',
          roleID: userRole.id,
        },
      ];

      for (const userData of users) {
        await request(app.getHttpServer())
          .post('/users')
          .send(userData)
          .expect(201);
      }

      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toEqual({
        id: expect.any(Number),
        email: users[0].email,
        firstName: users[0].firstName,
        lastName: users[0].lastName,
        isActive: true,
        roleID: adminRole.id,
        role: {
          id: adminRole.id,
          name: adminRole.name,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify passwords are not returned
      response.body.forEach((user) => {
        expect(user.password).toBeUndefined();
        expect(user.role).toBeDefined(); // Role should be included
      });
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return a user by id without password', async () => {
      // Create a test user
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'getbyid@example.com',
          firstName: 'Get',
          lastName: 'ById',
          password: 'password123',
          roleID: userRole.id,
        })
        .expect(201);

      const userId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200);

      expect(response.body).toEqual({
        id: userId,
        email: 'getbyid@example.com',
        firstName: 'Get',
        lastName: 'ById',
        isActive: true,
        roleID: userRole.id,
        role: {
          id: userRole.id,
          name: userRole.name,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Verify password is not returned
      expect(response.body.password).toBeUndefined();
    });

    it('should return 404 with null for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/99999')
        .expect(404);

      expect(response.body).toEqual({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      });
    });

    it('should return 400 for invalid user id', async () => {
      await request(app.getHttpServer()).get('/users/invalid-id').expect(400);
    });
  });

  describe('/users/:id (PUT)', () => {
    let userId: number;

    beforeEach(async () => {
      // Create a test user for update tests
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'update@example.com',
          firstName: 'Update',
          lastName: 'Test',
          password: 'originalPassword123',
          roleID: userRole.id,
        })
        .expect(201);

      userId = createResponse.body.id;
    });

    it('should update user fields', async () => {
      const updateData = {
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
        isActive: false,
      };

      const response = await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        id: userId,
        email: 'update@example.com',
        firstName: 'UpdatedFirst',
        lastName: 'UpdatedLast',
        isActive: false,
        roleID: userRole.id,
        role: {
          id: userRole.id,
          name: userRole.name,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should update user role', async () => {
      const updateData = {
        roleID: adminRole.id,
      };

      const response = await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        id: userId,
        email: 'update@example.com',
        firstName: 'Update',
        lastName: 'Test',
        isActive: true,
        roleID: adminRole.id,
        role: {
          id: adminRole.id,
          name: adminRole.name,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should update password and hash it', async () => {
      const newPassword = 'newSecurePassword456';

      await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .send({ password: newPassword })
        .expect(200);

      // Verify password was updated and hashed in database
      const updatedUser = await userRepository.findOne({
        where: { id: userId },
        select: [
          'id',
          'email',
          'firstName',
          'lastName',
          'password',
          'isActive',
          'roleID',
          'createdAt',
          'updatedAt',
        ],
        relations: { role: true },
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser!.password).not.toBe(newPassword);
      expect(updatedUser!.password).toMatch(/^\$2[aby]?\$\d{1,2}\$.{53}$/);

      // Verify password validation works with new password
      const validateResponse = await request(app.getHttpServer())
        .post('/users/auth/validate')
        .send({
          email: 'update@example.com',
          password: newPassword,
        })
        .expect(200);

      expect(validateResponse.body.valid).toBe(true);
    });

    it('should return 400 when updating email to existing one', async () => {
      // Create another user
      await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'existing@example.com',
          firstName: 'Existing',
          lastName: 'User',
          password: 'password123',
        })
        .expect(201);

      // Try to update first user's email to existing email
      const response = await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .send({ email: 'existing@example.com' })
        .expect(400);

      expect(response.body.message).toBe('User with this email already exists');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .put('/users/99999')
        .send({ firstName: 'NotFound' })
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });
  });

  describe('/users/:id (DELETE)', () => {
    let userId: number;

    beforeEach(async () => {
      // Create a test user for deletion tests
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'delete@example.com',
          firstName: 'Delete',
          lastName: 'Test',
          password: 'password123',
        })
        .expect(201);

      userId = createResponse.body.id;
    });

    it('should delete a user', async () => {
      await request(app.getHttpServer()).delete(`/users/${userId}`).expect(204);

      // Verify user was deleted
      const deletedUser = await userRepository.findOne({
        where: { id: userId },
      });
      expect(deletedUser).toBeNull();
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/99999')
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });
  });

  describe('/users/auth/validate (POST)', () => {
    let userEmail: string;
    let userPassword: string;

    beforeEach(async () => {
      userEmail = 'validate@example.com';
      userPassword = 'validationPassword123';

      // Create a test user
      await request(app.getHttpServer())
        .post('/users')
        .send({
          email: userEmail,
          firstName: 'Validate',
          lastName: 'Test',
          password: userPassword,
          roleID: userRole.id,
        })
        .expect(201);
    });

    it('should validate correct password', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/auth/validate')
        .send({
          email: userEmail,
          password: userPassword,
        })
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userEmail);
      expect(response.body.user.password).toBeUndefined(); // Password should not be returned
    });

    it('should reject incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/auth/validate')
        .send({
          email: userEmail,
          password: 'wrongPassword',
        })
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.user).toBeUndefined();
    });

    it('should reject non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/auth/validate')
        .send({
          email: 'nonexistent@example.com',
          password: userPassword,
        })
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.user).toBeUndefined();
    });

    it('should return 400 when email or password is missing', async () => {
      await request(app.getHttpServer())
        .post('/users/auth/validate')
        .send({ email: userEmail })
        .expect(400);

      await request(app.getHttpServer())
        .post('/users/auth/validate')
        .send({ password: userPassword })
        .expect(400);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete user lifecycle', async () => {
      const userData = {
        email: 'lifecycle@example.com',
        firstName: 'Life',
        lastName: 'Cycle',
        password: 'lifecyclePassword123',
        roleID: adminRole.id,
      };

      // 1. Create user
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(201);

      const userId = createResponse.body.id;
      expect(createResponse.body.email).toBe(userData.email);

      // 2. Validate initial password
      const validateResponse = await request(app.getHttpServer())
        .post('/users/auth/validate')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(validateResponse.body.valid).toBe(true);

      // 3. Update user information
      const updateData = {
        firstName: 'UpdatedLife',
        password: 'newLifecyclePassword456',
      };

      const updateResponse = await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.firstName).toBe('UpdatedLife');

      // 4. Validate new password
      const newValidateResponse = await request(app.getHttpServer())
        .post('/users/auth/validate')
        .send({
          email: userData.email,
          password: updateData.password,
        })
        .expect(200);

      expect(newValidateResponse.body.valid).toBe(true);

      // 5. Verify old password no longer works
      const oldValidateResponse = await request(app.getHttpServer())
        .post('/users/auth/validate')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(oldValidateResponse.body.valid).toBe(false);

      // 6. Get user by ID
      const getUserResponse = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200);

      expect(getUserResponse.body.firstName).toBe('UpdatedLife');

      // 7. Get all users
      const getAllResponse = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      expect(getAllResponse.body).toHaveLength(1);
      expect(getAllResponse.body[0].firstName).toBe('UpdatedLife');

      // 8. Delete user
      await request(app.getHttpServer()).delete(`/users/${userId}`).expect(204);

      // 9. Verify user is deleted
      const getDeletedUserResponse = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(404);

      expect(getDeletedUserResponse.body).toEqual({
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found',
      });
    });

    it('should handle user with null role properly', async () => {
      // Create user without role
      const userWithoutRole = {
        email: 'norole@example.com',
        firstName: 'No',
        lastName: 'Role',
        password: 'password123',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send(userWithoutRole)
        .expect(201);

      expect(createResponse.body.role).toBeNull();
      expect(createResponse.body.roleID).toBeNull();

      // Verify in GET request as well
      const getResponse = await request(app.getHttpServer())
        .get(`/users/${createResponse.body.id}`)
        .expect(200);

      expect(getResponse.body.role).toBeNull();
      expect(getResponse.body.roleID).toBeNull();
    });

    it('should handle role assignment and removal', async () => {
      // Create user without role
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'rolechange@example.com',
          firstName: 'Role',
          lastName: 'Change',
          password: 'password123',
        })
        .expect(201);

      const userId = createResponse.body.id;

      // Assign role
      const assignRoleResponse = await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .send({ roleID: adminRole.id })
        .expect(200);

      expect(assignRoleResponse.body.roleID).toBe(adminRole.id);
      expect(assignRoleResponse.body.role.name).toBe('Admin');

      // Remove role (set to null)
      const removeRoleResponse = await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .send({ roleID: null })
        .expect(200);

      expect(removeRoleResponse.body.roleID).toBeNull();
      expect(removeRoleResponse.body.role).toBeNull();
    });
  });
});
