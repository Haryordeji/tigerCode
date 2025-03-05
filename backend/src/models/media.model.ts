// src/models/media.model.ts
import pool from '../config/db';
import { Media } from './db.types';

export async function createMedia(media: Omit<Media, 'id' | 'created_at'>): Promise<Media> {
  const { entity_type, entity_id, media_type, file_path, original_name, content_type } = media;
  
  const result = await pool.query(
    'INSERT INTO media (entity_type, entity_id, media_type, file_path, original_name, content_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [entity_type, entity_id, media_type, file_path, original_name, content_type]
  );
  
  return result.rows[0];
}

export async function getMediaForEntity(entityType: string, entityId: string): Promise<Media[]> {
  const result = await pool.query(
    'SELECT * FROM media WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at',
    [entityType, entityId]
  );
  
  return result.rows;
}

export async function deleteMedia(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM media WHERE id = $1 RETURNING id', [id]);
  return result.rowCount !== null && result.rowCount > 0;
}