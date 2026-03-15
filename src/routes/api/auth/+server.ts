import { json } from '@sveltejs/kit';
import { getCentralDb, getUserDb } from '$lib/server/db';
import { scryptSync, timingSafeEqual } from 'node:crypto';

function hashPassword(password: string, salt: string) {
	return scryptSync(password, salt, 64).toString('hex');
}

export async function POST({ request }) {
	const body = await request.json();
	const { username, password, action } = body;
	const centralDb = getCentralDb();
	const salt = username; // Usando username como salt para simplicidade no protótipo

	if (action === 'register') {
		const { q1, a1, q2, a2, q3, a3 } = body;
		try {
			const dbPath = `${username.replace(/[^a-zA-Z0-9_]/g, '')}.db`;
			const hashedPassword = hashPassword(password, salt);

			const stmt = centralDb.prepare(`
				INSERT INTO users (username, password_hash, db_path, q1, a1_hash, q2, a2_hash, q3, a3_hash) 
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
			`);
			stmt.run(
				username, hashedPassword, dbPath,
				q1, hashPassword(a1, salt),
				q2, hashPassword(a2, salt),
				q3, hashPassword(a3, salt)
			);

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
	} else if (action === 'reset') {
		const { a1, a2, a3, newPassword } = body;
		const user = centralDb.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

		if (!user) {
			return json({ message: 'Usuário não encontrado' }, { status: 404 });
		}

		const checkA1 = timingSafeEqual(Buffer.from(hashPassword(a1, salt), 'hex'), Buffer.from(user.a1_hash, 'hex'));
		const checkA2 = timingSafeEqual(Buffer.from(hashPassword(a2, salt), 'hex'), Buffer.from(user.a2_hash, 'hex'));
		const checkA3 = timingSafeEqual(Buffer.from(hashPassword(a3, salt), 'hex'), Buffer.from(user.a3_hash, 'hex'));

		if (checkA1 && checkA2 && checkA3) {
			const newHash = hashPassword(newPassword, salt);
			centralDb.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(newHash, username);
			return json({ success: true, message: 'Senha redefinida com sucesso' });
		} else {
			return json({ message: 'Respostas incorretas' }, { status: 401 });
		}
	} else if (action === 'get_questions') {
		const user = centralDb.prepare('SELECT q1, q2, q3 FROM users WHERE username = ?').get(username) as any;
		if (!user) return json({ message: 'Usuário não encontrado' }, { status: 404 });
		return json({ questions: [user.q1, user.q2, user.q3] });
	} else {
		const user = centralDb.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

		if (user) {
			const hashedPassword = hashPassword(password, salt);
			const isMatch = timingSafeEqual(
				Buffer.from(hashedPassword, 'hex'),
				Buffer.from(user.password_hash, 'hex')
			);

			if (isMatch) {
				return json({
					success: true,
					user: { username: user.username, dbPath: user.db_path }
				});
			}
		}

		return json({ message: 'Credenciais inválidas' }, { status: 401 });
	}
}
