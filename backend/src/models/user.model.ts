// src/models/user.model.ts
import pool from '../config/db';
import { User } from './db.types';

export async function createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
  const { princeton_id, name, email } = user;
  
  const result = await pool.query(
    'INSERT INTO users (princeton_id, name, email) VALUES ($1, $2, $3) RETURNING *',
    [princeton_id, name, email]
  );
  
  return result.rows[0];
}

export async function getUserByPrincetonId(princetonId: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE princeton_id = $1', [princetonId]);
  return result.rows[0] || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

