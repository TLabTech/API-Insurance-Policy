# Copilot Instructions

This is a NestJS TypeScript starter project using modern ES2023 modules and strict type checking.

## Architecture Overview

- **Framework**: NestJS 11.x with Express platform
- **Module System**: ES2023 with `nodenext` resolution
- **Structure**: Standard NestJS modular architecture with controllers, services, and modules
- **Entry Point**: `src/main.ts` bootstraps the app on port 3000 (or `PORT` env var)
- **Root Module**: `AppModule` in `src/app.module.ts` orchestrates the application

## Development Workflows

### Running the Application
```bash
npm run start:dev    # Watch mode for development
npm run start:debug  # Debug mode with --inspect-brk
npm run start:prod   # Production build from dist/
```

### Testing Strategy
- **Unit Tests**: Jest with `*.spec.ts` pattern in `src/`
- **E2E Tests**: Supertest in `test/` directory with `*.e2e-spec.ts` pattern
- **Coverage**: `npm run test:cov` generates coverage reports
- **Test Debugging**: Use `npm run test:debug` with Node inspector

### Code Quality
- **ESLint**: Flat config with TypeScript-aware rules in `eslint.config.mjs`
- **Prettier**: Integrated via eslint-plugin-prettier
- **Build**: `nest build` compiles to `dist/` with source maps

## Project Conventions

### TypeScript Configuration
- **Strict Mode**: Uses `strictNullChecks` but relaxed `noImplicitAny`
- **Decorators**: `experimentalDecorators` and `emitDecoratorMetadata` enabled for NestJS
- **Module Resolution**: `nodenext` with package.json exports resolution
- **Target**: ES2023 with modern features

### NestJS Patterns
- **Dependency Injection**: Constructor injection pattern (see `AppController`)
- **Decorators**: Use `@Controller()`, `@Injectable()`, `@Get()`, etc.
- **Module Structure**: Import/export pattern in `@Module` decorators
- **Testing**: Use `Test.createTestingModule()` for unit tests, full app bootstrap for e2e

### File Organization
```
src/
├── main.ts           # Application bootstrap
├── app.module.ts     # Root module
├── app.controller.ts # Root controller
├── app.service.ts    # Root service
└── *.spec.ts        # Unit tests alongside source
test/
├── *.e2e-spec.ts    # End-to-end tests
└── jest-e2e.json    # E2E Jest configuration
```

## Common Tasks

### Adding New Features
1. Generate with NestJS CLI: `nest generate controller|service|module <name>`
2. Import new modules into `AppModule`
3. Follow constructor injection pattern for dependencies
4. Add unit tests alongside source files
5. Create comprehensive e2e tests for new endpoints

### E2E Testing Workflow
```bash
npm run test:e2e                    # Run all e2e tests
npm run test:e2e -- --testPathPatterns=user  # Run specific test file
```

#### E2E Test Pattern
```typescript
// Setup test environment with real database
beforeAll(async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = moduleFixture.createNestApplication();
  repository = moduleFixture.get(getRepositoryToken(Entity));
  await app.init();
});

// Clean database between tests
beforeEach(async () => {
  await repository.clear();
});
```

### Testing Guidelines
- **Unit Tests**: Mock services using Jest, use `Test.createTestingModule()` for isolated modules
- **E2E Tests**: Full request/response cycle testing with supertest and real database
- **Database Cleanup**: Use `beforeEach()` to clear database state between tests
- **Authentication Testing**: Test password hashing, validation, and security endpoints
- **Error Scenarios**: Test validation failures, duplicate data, and not-found cases
- **Test Structure**: Keep e2e tests in `test/` directory with `*.e2e-spec.ts` suffix

### Debugging
- Use `start:debug` script for Node.js debugging
- Source maps enabled for proper stack traces
- ESLint warnings configured for async/promise handling

## Database Integration

### TypeORM with SQLite
- **Configuration**: SQLite database configured in `AppModule` with `synchronize: true` for development
- **Entities**: Use decorators like `@Entity()`, `@Column()`, `@PrimaryGeneratedColumn()`
- **Repository Pattern**: Inject repositories with `@InjectRepository(Entity)`
- **Module Structure**: Feature modules use `TypeOrmModule.forFeature([Entity])` to register entities

### Example Entity Structure
```typescript
// user/user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column({ unique: true })
  email: string;
}
```

### Service Integration
- Use `Repository<Entity>` for database operations
- Follow constructor injection pattern: `@InjectRepository(User) private userRepository: Repository<User>`
- Standard CRUD operations: `find()`, `findOne()`, `create()`, `save()`, `update()`, `delete()`

## Key Dependencies
- **Runtime**: @nestjs/core, @nestjs/common, @nestjs/platform-express, @nestjs/typeorm, typeorm
- **Database**: sqlite3 driver for SQLite database
- **Development**: @nestjs/cli, @nestjs/testing, typescript-eslint  
- **Testing**: jest, supertest, ts-jest