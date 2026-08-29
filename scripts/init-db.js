import fs from 'node:fs';
import path from 'node:path';
import { openDatabase } from '../lib/db.js';

const schemaPath = path.resolve('database/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

const db = openDatabase();

try {
  db.exec(schema);
  console.log('Database initialized successfully.');
} finally {
  db.close();
}