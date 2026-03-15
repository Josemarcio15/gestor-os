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
        const parts = db.prepare('SELECT * FROM parts ORDER BY name ASC').all();
        return json({ parts });
    } catch (err) {
        return json({ error: 'Failed to fetch parts' }, { status: 500 });
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
				UPDATE parts 
				SET name = ?, sku = ?, price = ?, stock = ?
				WHERE id = ?
			`);
            stmt.run(data.name, data.sku, data.price, data.stock, data.id);
        } else {
            const stmt = db.prepare(`
				INSERT INTO parts (name, sku, price, stock)
				VALUES (?, ?, ?, ?)
			`);
            stmt.run(data.name, data.sku, data.price, data.stock);
        }

        return json({ success: true });
    } catch (err: any) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return json({ error: 'SKU já cadastrado' }, { status: 400 });
        }
        return json({ error: 'Failed to save part' }, { status: 500 });
    }
}

export async function DELETE({ request, url }) {
    const username = getUsername(request);
    if (!username) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const id = url.searchParams.get('id');
        if (!id) return json({ error: 'Missing ID' }, { status: 400 });

        const db = getUserDb(username);
        db.prepare('DELETE FROM parts WHERE id = ?').run(id);

        return json({ success: true });
    } catch (err) {
        return json({ error: 'Failed to delete part' }, { status: 500 });
    }
}
