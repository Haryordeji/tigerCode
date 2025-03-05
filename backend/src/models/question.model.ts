// src/models/question.model.ts
import pool from '../config/db';
import { Question } from './db.types';

export async function createQuestion(question: Omit<Question, 'id' | 'created_at'>): Promise<Question> {
  const { pattern_id, title, description, difficulty } = question;
  
  const result = await pool.query(
    'INSERT INTO questions (pattern_id, title, description, difficulty) VALUES ($1, $2, $3, $4) RETURNING *',
    [pattern_id, title, description, difficulty]
  );
  
  return result.rows[0];
}

export async function getQuestions(): Promise<Question[]> {
  const result = await pool.query('SELECT * FROM questions ORDER BY created_at DESC');
  return result.rows;
}

export async function getQuestionById(id: string): Promise<Question | null> {
  const result = await pool.query('SELECT * FROM questions WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getQuestionsByPatternId(patternId: string): Promise<Question[]> {
  const result = await pool.query('SELECT * FROM questions WHERE pattern_id = $1 ORDER BY difficulty', [patternId]);
  return result.rows;
}
