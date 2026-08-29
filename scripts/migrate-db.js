import fs from 'node:fs';
import path from 'node:path';

import { openDatabase } from '../lib/db.js';

const migrationsPath = path.resolve('database/migrations');

const db = openDatabase();

try {
    // Keep track of migrations that have already been applied.
    db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL UNIQUE,
            applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Find all SQL migration files and run them in filename order.
    const migrationFiles = fs
        .readdirSync(migrationsPath)
        .filter((filename) => filename.endsWith('.sql'))
        .sort();

    const hasMigration = db.prepare(`
        SELECT 1
        FROM schema_migrations
        WHERE filename = ?
    `);

    const recordMigration = db.prepare(`
        INSERT INTO schema_migrations (filename)
        VALUES (?)
    `);

    for (const filename of migrationFiles) {
        const alreadyApplied = hasMigration.get(filename);

        if (alreadyApplied) {
            console.log(`Skipped: ${filename}`);
            continue;
        }

        const migrationPath = path.join(migrationsPath, filename);
        const migration = fs.readFileSync(migrationPath, 'utf8');

        const applyMigration = db.transaction(() => {
            db.exec(migration);
            recordMigration.run(filename);
        });

        applyMigration();

        console.log(`Applied: ${filename}`);
    }

    console.log('Database migrations complete.');
} catch (error) {
    console.error('Database migration failed:', error.message);
    process.exitCode = 1;
} finally {
    db.close();
}