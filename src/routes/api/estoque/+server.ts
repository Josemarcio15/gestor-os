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
        const parts = db.prepare('SELECT * FROM parts WHERE active = 1 ORDER BY name ASC').all();
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
        if (!data.name || data.price === undefined || data.stock === undefined) {
            return json({ error: 'Nome, preço e estoque são obrigatórios' }, { status: 400 });
        }
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


        const result = db.prepare('UPDATE parts SET active = 0 WHERE id = ?').run(id);

        if (result.changes === 0) {
            return json({ error: 'Peça não encontrada' }, { status: 404 });
        }

        return json({ success: true, message: 'Peça desativada com sucesso' });
    } catch (err: any) {
        console.error("Erro ao desativar peça:", err);
        return json({
            error: 'Erro ao desativar peça.',
            details: err.message
        }, { status: 500 });
    }
}
