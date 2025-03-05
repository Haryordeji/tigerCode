// db/migrations/001_create_tables.ts
import { Pool } from 'pg';

export async function up(pool: Pool): Promise<void> {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

  // Create users table
  await pool.query(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      princeton_id VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(100),
      email VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create patterns table
  await pool.query(`
    CREATE TABLE patterns (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create questions table
  await pool.query(`
    CREATE TABLE questions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      pattern_id UUID NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      difficulty VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create user_progress table
  await pool.query(`
    CREATE TABLE user_progress (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL,
      last_attempted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, question_id)
    );
  `);

  // Create submissions table
  await pool.query(`
    CREATE TABLE submissions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      language VARCHAR(50) NOT NULL,
      status VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create leaderboard table
  await pool.query(`
    CREATE TABLE leaderboard (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      score INTEGER NOT NULL,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create new media table for storing images and visualizations
  await pool.query(`
    CREATE TABLE media (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      entity_type VARCHAR(50) NOT NULL,
      entity_id UUID NOT NULL,
      media_type VARCHAR(50) NOT NULL,
      file_path VARCHAR(255) NOT NULL,
      original_name VARCHAR(255),
      content_type VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create index on entity_id and entity_type for faster media lookups
  await pool.query(`
    CREATE INDEX idx_media_entity ON media(entity_type, entity_id);
  `);
}

export async function down(pool: Pool): Promise<void> {
  await pool.query(`DROP TABLE IF EXISTS media;`);
  await pool.query(`DROP TABLE IF EXISTS leaderboard;`);
  await pool.query(`DROP TABLE IF EXISTS submissions;`);
  await pool.query(`DROP TABLE IF EXISTS user_progress;`);
  await pool.query(`DROP TABLE IF EXISTS questions;`);
  await pool.query(`DROP TABLE IF EXISTS patterns;`);
  await pool.query(`DROP TABLE IF EXISTS users;`);
}