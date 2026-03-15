import { error } from '@sveltejs/kit';
import path from 'path';
import fs from 'fs';

export async function GET({ url, request }) {
	const username = url.searchParams.get('username');
	const authUser = request.headers.get('x-user-id');

	if (!username || username !== authUser) {
		throw error(401, 'Não autorizado');
	}

	const sanitizedUsername = username.replace(/[^a-zA-Z0-9_]/g, '');
	const dbPath = path.resolve('data', `${sanitizedUsername}.db`);

	if (!fs.existsSync(dbPath)) {
		throw error(404, 'Banco de dados não encontrado');
	}

	const fileBuffer = fs.readFileSync(dbPath);

	return new Response(fileBuffer, {
		headers: {
			'Content-Type': 'application/x-sqlite3',
			'Content-Disposition': `attachment; filename="${username}_backup_${new Date().toISOString().split('T')[0]}.db"`
		}
	});
}
