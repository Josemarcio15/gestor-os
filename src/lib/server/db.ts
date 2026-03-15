import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const DATA_DIR = path.resolve('data');
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR, { recursive: true });
}

const ENCRYPTION_KEY = Buffer.from('v7x!A%C*F-JaNdRgUjXn2r5u8x/A?D(G', 'utf-8'); // 32 bytes para AES-256

export function encrypt(text: string): string {
	if (!text) return text;
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
	let encrypted = cipher.update(text, 'utf8', 'hex');
	encrypted += cipher.final('hex');
	const authTag = cipher.getAuthTag().toString('hex');
	return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decrypt(hash: string): string {
	if (!hash || !hash.includes(':')) return hash;
	try {
		const [ivHex, authTagHex, encryptedText] = hash.split(':');
		const iv = Buffer.from(ivHex, 'hex');
		const authTag = Buffer.from(authTagHex, 'hex');
		const decipher = createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
		decipher.setAuthTag(authTag);
		let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
		decrypted += decipher.final('utf8');
		return decrypted;
	} catch (err) {
		console.error('Falha na descriptografia:', err);
		return hash;
	}
}

const CENTRAL_DB_PATH = path.join(DATA_DIR, 'central_admin.db');
const centralDb = new Database(CENTRAL_DB_PATH);

centralDb.exec(`
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		db_path TEXT NOT NULL,
		q1 TEXT, a1_hash TEXT,
		q2 TEXT, a2_hash TEXT,
		q3 TEXT, a3_hash TEXT
	)
`);

try {
	centralDb.exec('ALTER TABLE users ADD COLUMN q1 TEXT');
	centralDb.exec('ALTER TABLE users ADD COLUMN a1_hash TEXT');
	centralDb.exec('ALTER TABLE users ADD COLUMN q2 TEXT');
	centralDb.exec('ALTER TABLE users ADD COLUMN a2_hash TEXT');
	centralDb.exec('ALTER TABLE users ADD COLUMN q3 TEXT');
	centralDb.exec('ALTER TABLE users ADD COLUMN a3_hash TEXT');
} catch (e) {
}

export const getCentralDb = () => centralDb;

export const getUserDb = (username: string) => {
	const sanitizedUsername = username.replace(/[^a-zA-Z0-9_]/g, '');
	const userDbPath = path.join(DATA_DIR, `${sanitizedUsername}.db`);
	const dbExists = fs.existsSync(userDbPath);
	const db = new Database(userDbPath);

	if (!dbExists) {
		db.exec(`
			CREATE TABLE IF NOT EXISTS clients (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				email TEXT,
				phone TEXT,
				address TEXT,
				document TEXT,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			);

			CREATE TABLE IF NOT EXISTS parts (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				sku TEXT UNIQUE,
				price REAL NOT NULL,
				stock INTEGER DEFAULT 0,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			);

			CREATE TABLE IF NOT EXISTS services (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				description TEXT NOT NULL,
				price REAL NOT NULL,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP
			);

			CREATE TABLE IF NOT EXISTS orders (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				client_id INTEGER NOT NULL,
				status TEXT DEFAULT 'budget', 
				discount REAL DEFAULT 0,
				total REAL DEFAULT 0,
				notes TEXT,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (client_id) REFERENCES clients(id)
			);

			CREATE TABLE IF NOT EXISTS order_items (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				order_id INTEGER NOT NULL,
				item_type TEXT NOT NULL, 
				item_id INTEGER NOT NULL,
				description TEXT NOT NULL,
				quantity INTEGER DEFAULT 1,
				unit_price REAL NOT NULL,
				total_price REAL NOT NULL,
				FOREIGN KEY (order_id) REFERENCES orders(id)
			);
		`);
	}

	return db;
};
