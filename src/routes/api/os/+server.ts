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

        const orders = db.prepare(`
			SELECT o.*, c.name as client 
			FROM orders o
			LEFT JOIN clients c ON o.client_id = c.id
			ORDER BY o.created_at DESC
		`).all();

        return json({ orders });
    } catch (err) {
        return json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

export async function POST({ request }) {
    const username = getUsername(request);
    if (!username) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const data = await request.json();
        const db = getUserDb(username);

        const saveOrder = db.transaction((orderData) => {
            let orderId = orderData.id;

            if (orderId) {
                const stmt = db.prepare(`
					UPDATE orders 
					SET client_id = ?, status = ?, discount = ?, total = ?, notes = ?
					WHERE id = ?
				`);
                stmt.run(orderData.client_id, orderData.status, orderData.discount, orderData.total, orderData.notes, orderId);

                db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId);
            } else {
                const stmt = db.prepare(`
					INSERT INTO orders (client_id, status, discount, total, notes)
					VALUES (?, ?, ?, ?, ?)
				`);
                const result = stmt.run(orderData.client_id, orderData.status, orderData.discount, orderData.total, orderData.notes);
                orderId = result.lastInsertRowid;
            }

            if (orderData.items && Array.isArray(orderData.items)) {
                const insertItem = db.prepare(`
					INSERT INTO order_items (order_id, item_type, item_id, description, quantity, unit_price, total_price)
					VALUES (?, ?, ?, ?, ?, ?, ?)
				`);

                for (const item of orderData.items) {
                    insertItem.run(
                        orderId,
                        item.type,
                        item.item_id,
                        item.description,
                        item.quantity,
                        item.price,
                        item.quantity * item.price
                    );
                }
            }
            return orderId;
        });

        saveOrder(data);

        return json({ success: true });
    } catch (err) {
        console.error("OS Save error:", err);
        return json({ error: 'Failed to save order' }, { status: 500 });
    }
}

export async function DELETE({ request, url }) {
    const username = getUsername(request);
    if (!username) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const id = url.searchParams.get('id');
        if (!id) return json({ error: 'Missing ID' }, { status: 400 });

        const db = getUserDb(username);

        const transaction = db.transaction(() => {
            db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
            db.prepare('DELETE FROM orders WHERE id = ?').run(id);
        });

        transaction();

        return json({ success: true });
    } catch (err) {
        return json({ error: 'Failed to delete order' }, { status: 500 });
    }
}
