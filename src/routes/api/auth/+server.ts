import { json } from '@sveltejs/kit';
import { getCentralDb, getUserDb } from '$lib/server/db';

export async function POST({ request }) {
	const { username, password, action } = await request.json();
	const centralDb = getCentralDb();

	if (action === 'register') {
		try {
			const dbPath = `${username}.db`;
			const stmt = centralDb.prepare('INSERT INTO users (username, password_hash, db_path) VALUES (?, ?, ?)');
			stmt.run(username, password, dbPath);

			getUserDb(username);

			return json({
				success: true,
				user: { username, dbPath }
			});
		} catch (err: any) {
			if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
				return json({ message: 'Usuário já existe' }, { status: 400 });
			}
			return json({ message: 'Erro ao criar conta' }, { status: 500 });
		}
	} else {
		const user = centralDb.prepare('SELECT * FROM users WHERE username = ? AND password_hash = ?').get(username, password) as any;

		if (user) {
			return json({
				success: true,
				user: { username: user.username, dbPath: user.db_path }
			});
		} else {
			return json({ message: 'Credenciais inválidas' }, { status: 401 });
		}
	}
}
