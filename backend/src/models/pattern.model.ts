// src/models/pattern.model.ts
import pool from '../config/db';
import { Pattern } from './db.types';

export async function createPattern(pattern: Omit<Pattern, 'id' | 'created_at'>): Promise<Pattern> {
  const { name, description, category } = pattern;
  
  const result = await pool.query(
    'INSERT INTO patterns (name, description, category) VALUES ($1, $2, $3) RETURNING *',
    [name, description, category]
  );
  
  return result.rows[0];
}

export async function getPatterns(): Promise<Pattern[]> {
  const result = await pool.query('SELECT * FROM patterns ORDER BY name');
  return result.rows;
}

export async function getPatternById(id: string): Promise<Pattern | null> {
  const result = await pool.query('SELECT * FROM patterns WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getPatternsByCategory(category: string): Promise<Pattern[]> {
  const result = await pool.query('SELECT * FROM patterns WHERE category = $1 ORDER BY name', [category]);
  return result.rows;
}
