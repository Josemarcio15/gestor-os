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
        const clients = db.prepare('SELECT * FROM clients ORDER BY name ASC').all();
        return json({ clients });
    } catch (err) {
        return json({ error: 'Failed to fetch clients' }, { status: 500 });
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
				UPDATE clients 
				SET name = ?, email = ?, phone = ?, document = ?
				WHERE id = ?
			`);
            stmt.run(data.name, data.email, data.phone, data.document, data.id);
        } else {
            const stmt = db.prepare(`
				INSERT INTO clients (name, email, phone, document)
				VALUES (?, ?, ?, ?)
			`);
            stmt.run(data.name, data.email, data.phone, data.document);
        }

        return json({ success: true });
    } catch (err) {
        return json({ error: 'Failed to save client' }, { status: 500 });
    }
}

export async function DELETE({ request, url }) {
    const username = getUsername(request);
    if (!username) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const id = url.searchParams.get('id');
        if (!id) return json({ error: 'Missing ID' }, { status: 400 });

        const db = getUserDb(username);
        db.prepare('DELETE FROM clients WHERE id = ?').run(id);

        return json({ success: true });
    } catch (err) {
        return json({ error: 'Failed to delete client' }, { status: 500 });
    }
}
