import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.resolve('data');
if (!fs.existsSync(DATA_DIR)) {
	fs.mkdirSync(DATA_DIR, { recursive: true });
}

const CENTRAL_DB_PATH = path.join(DATA_DIR, 'central_admin.db');
const centralDb = new Database(CENTRAL_DB_PATH);

// Inicializar Banco Central
centralDb.exec(`
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		db_path TEXT NOT NULL
	)
`);

export const getCentralDb = () => centralDb;

export const getUserDb = (username: string) => {
	const userDbPath = path.join(DATA_DIR, `${username}.db`);
	const dbExists = fs.existsSync(userDbPath);
	const db = new Database(userDbPath);

	if (!dbExists) {
		// Aplicar Schema do Usuário
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
				status TEXT DEFAULT 'budget', -- budget, os, completed, cancelled
				discount REAL DEFAULT 0,
				total REAL DEFAULT 0,
				notes TEXT,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (client_id) REFERENCES clients(id)
			);

			CREATE TABLE IF NOT EXISTS order_items (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				order_id INTEGER NOT NULL,
				item_type TEXT NOT NULL, -- part, service
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
