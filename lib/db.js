import Database from 'better-sqlite3';
import path from 'node:path';

const databasePath =
  process.env.DATABASE_PATH || './data/youtube.db';

const resolvedPath = path.resolve(databasePath);

export function openDatabase() {
  const db = new Database(resolvedPath);

  db.pragma('foreign_keys = ON');

  return db;
}