// db/migration-runner.ts
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { up, down } from './migrations/001_create_tables';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations(direction: 'up' | 'down'): Promise<void> {
  try {
    console.log(`Running migrations: ${direction}`);
    
    if (direction === 'up') {
      await up(pool);
    } else {
      await down(pool);
    }
    
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

const args = process.argv.slice(2);
const direction = args[0] === 'down' ? 'down' : 'up';

runMigrations(direction).catch((err) => {
  console.error('Failed to run migrations:', err);
  process.exit(1);
});