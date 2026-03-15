import { error } from '@sveltejs/kit';
import path from 'path';
import fs from 'fs';

export async function GET({ url }) {
	const username = url.searchParams.get('username');
	
	if (!username) {
		throw error(400, 'Username é obrigatório');
	}

	const dbPath = path.resolve('data', `${username}.db`);

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
