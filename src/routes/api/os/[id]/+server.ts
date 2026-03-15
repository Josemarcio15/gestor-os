import { json } from '@sveltejs/kit';
import { getUserDb } from '$lib/server/db';

function getUsername(request: Request) {
    return request.headers.get('x-user-id');
}

export async function GET({ request, params }) {
    const username = getUsername(request);
    if (!username) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const orderId = params.id;
        const db = getUserDb(username);

        const order = db.prepare(`
            SELECT o.*, c.name as client_name, c.document as client_document 
            FROM orders o
            LEFT JOIN clients c ON o.client_id = c.id
            WHERE o.id = ?
        `).get(orderId);

        if (!order) {
            return json({ error: 'Order not found' }, { status: 404 });
        }

        const items = db.prepare(`
            SELECT * FROM order_items 
            WHERE order_id = ?
        `).all(orderId);

        return json({
            order,
            items
        });

    } catch (err) {
        console.error("Error fetching order via ID: ", err);
        return json({ error: 'Failed to fetch order details' }, { status: 500 });
    }
}
