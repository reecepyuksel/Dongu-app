import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';

const isTsRuntime = __filename.endsWith('.ts');

export default new DataSource({
  type: 'postgres',
  host: String(process.env.DB_HOST ?? '127.0.0.1'),
  port: Number(process.env.DB_PORT || 5433),
  username: String(process.env.DB_USERNAME ?? 'postgres'),
  password: String(process.env.DB_PASSWORD ?? ''),
  database: String(process.env.DB_NAME ?? 'loopp_db'),
  entities: [isTsRuntime ? 'src/**/*.entity.ts' : 'dist/**/*.entity.js'],
  migrations: [isTsRuntime ? 'src/migrations/*.ts' : 'dist/migrations/*.js'],
  synchronize: false,
  ssl: false,
});
