import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/user/user.entity';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    await app.init();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await userRepository.clear();
  });

  afterAll(async () => {
    // Clean up database after all tests
    await userRepository.clear();
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'testuser@example.com',
          firstName: 'Test',
          lastName: 'User',
          password: 'testPassword123',
        })
        .expect(201);
    });

    it('should login with valid credentials', async () => {
      const loginDto = {
        email: 'testuser@example.com',
        password: 'testPassword123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.access_token).toMatch(
        /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,
      ); // JWT format
      expect(response.body.user).toEqual({
        id: expect.any(Number),
        email: 'testuser@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        roleID: null,
        role: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      // Ensure password is not returned
      expect(response.body.user.password).toBeUndefined();
    });

    it('should return 401 for invalid email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'testPassword123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      });
    });

    it('should return 401 for invalid password', async () => {
      const loginDto = {
        email: 'testuser@example.com',
        password: 'wrongPassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      });
    });

    it('should return 400 for invalid email format', async () => {
      const loginDto = {
        email: 'invalidemail',
        password: 'testPassword123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(400);
    });

    it('should return 400 for short password', async () => {
      const loginDto = {
        email: 'testuser@example.com',
        password: '123',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(400);
    });

    it('should return 400 for missing fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'testuser@example.com' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'testPassword123' })
        .expect(400);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Create a test user and get access token
      await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'profileuser@example.com',
          firstName: 'Profile',
          lastName: 'User',
          password: 'profilePassword123',
        })
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'profileuser@example.com',
          password: 'profilePassword123',
        })
        .expect(200);

      accessToken = loginResponse.body.access_token;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        id: expect.any(Number),
        email: 'profileuser@example.com',
        firstName: 'Profile',
        lastName: 'User',
        isActive: true,
        roleID: null,
        role: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      // Ensure password is not returned
      expect(response.body.password).toBeUndefined();
    });

    it('should return 401 without token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        message: 'No token provided',
        error: 'Unauthorized',
      });
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        message: 'Invalid token',
        error: 'Unauthorized',
      });
    });

    it('should return 401 with malformed authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        message: 'No token provided',
        error: 'Unauthorized',
      });
    });

    it('should return 401 with empty authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', '')
        .expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        message: 'No token provided',
        error: 'Unauthorized',
      });
    });
  });

  describe('JWT Token Integration', () => {
    let userId: number;

    beforeEach(async () => {
      // Create a test user
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'jwtuser@example.com',
          firstName: 'JWT',
          lastName: 'User',
          password: 'jwtPassword123',
        })
        .expect(201);

      userId = createResponse.body.id;
    });

    it('should complete full authentication flow', async () => {
      // 1. Login and get token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'jwtuser@example.com',
          password: 'jwtPassword123',
        })
        .expect(200);

      const { access_token, user } = loginResponse.body;
      expect(access_token).toBeDefined();
      expect(user.id).toBe(userId);

      // 2. Use token to access protected profile endpoint
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);

      expect(profileResponse.body.id).toBe(userId);
      expect(profileResponse.body.email).toBe('jwtuser@example.com');

      // 3. Verify token works with other protected endpoints (if any user endpoints are protected)
      // For now, user endpoints are not protected, but this demonstrates the flow
    });

    it('should handle token expiration gracefully', async () => {
      // This test would require setting a very short expiration time
      // For now, we'll just test that the JWT has proper structure
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'jwtuser@example.com',
          password: 'jwtPassword123',
        })
        .expect(200);

      const token = loginResponse.body.access_token;
      const parts = token.split('.');
      expect(parts).toHaveLength(3); // JWT has 3 parts: header.payload.signature

      // Decode payload (base64)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      expect(payload.sub).toBe(userId);
      expect(payload.email).toBe('jwtuser@example.com');
      expect(payload.iat).toBeDefined(); // issued at
      expect(payload.exp).toBeDefined(); // expires at
    });

    it('should maintain user state consistency between login and profile', async () => {
      // Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'jwtuser@example.com',
          password: 'jwtPassword123',
        })
        .expect(200);

      const loginUser = loginResponse.body.user;
      const accessToken = loginResponse.body.access_token;

      // Get profile
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const profileUser = profileResponse.body;

      // Both should represent the same user with same data
      expect(loginUser.id).toBe(profileUser.id);
      expect(loginUser.email).toBe(profileUser.email);
      expect(loginUser.firstName).toBe(profileUser.firstName);
      expect(loginUser.lastName).toBe(profileUser.lastName);
      expect(loginUser.isActive).toBe(profileUser.isActive);
    });
  });
});
