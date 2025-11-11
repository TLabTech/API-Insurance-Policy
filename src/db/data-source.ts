import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

console.log('🔧 DB CONFIG: ', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  database: process.env.DB_NAME,
});

// Detect if running under ts-node
const tsNodeSymbol = Symbol.for('ts-node.register.instance');
const isTsNode =
  process.env.TS_NODE === 'true' ||
  Reflect.has(process as object, tsNodeSymbol);

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
  entities: isTsNode ? ['src/**/*.entity.ts'] : ['dist/**/*.entity.js'],
  migrations: isTsNode
    ? ['src/db/migrations/*{.ts,.js}']
    : ['dist/db/migrations/*{.js}'],
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: true,
});

export default AppDataSource;
