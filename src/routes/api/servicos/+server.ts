import { json } from '@sveltejs/kit';
import { getUserDb } from '$lib/server/db';

function getUsername(request: Request) {
    return request.headers.get('x-user-id');
}

export async function GET({ request }) {
    const username = getUsername(request);
    if (!username) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const db = getUserDb(username);
        const services = db.prepare('SELECT * FROM services WHERE active = 1 ORDER BY description ASC').all();
        return json({ services });
    } catch (err) {
        return json({ error: 'Failed to fetch services' }, { status: 500 });
    }
}

export async function POST({ request }) {
    const username = getUsername(request);
    if (!username) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const data = await request.json();
        const db = getUserDb(username);

        if (data.id) {
            const stmt = db.prepare(`
				UPDATE services 
				SET description = ?, price = ?
				WHERE id = ?
			`);
            stmt.run(data.description, data.price, data.id);
        } else {
            const stmt = db.prepare(`
				INSERT INTO services (description, price)
				VALUES (?, ?)
			`);
            stmt.run(data.description, data.price);
        }

        return json({ success: true });
    } catch (err) {
        return json({ error: 'Failed to save service' }, { status: 500 });
    }
}

export async function DELETE({ request, url }) {
    const username = getUsername(request);
    if (!username) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const id = url.searchParams.get('id');
        if (!id) return json({ error: 'Missing ID' }, { status: 400 });

        const db = getUserDb(username);

        const result = db.prepare('UPDATE services SET active = 0 WHERE id = ?').run(id);

        if (result.changes === 0) {
            return json({ error: 'Serviço não encontrado' }, { status: 404 });
        }

        return json({ success: true, message: 'Serviço desativado com sucesso' });
    } catch (err: any) {
        console.error("Erro ao desativar serviço:", err);
        return json({
            error: 'Erro ao desativar serviço.',
            details: err.message
        }, { status: 500 });
    }
}
