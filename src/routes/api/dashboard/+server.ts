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

        const clientsCount = db.prepare('SELECT COUNT(*) as count FROM clients').get() as any;
        const partsStock = db.prepare('SELECT SUM(stock) as total FROM parts').get() as any;
        const pendingOs = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status IN ('budget', 'os')`).get() as any;
        const completedOs = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'completed'`).get() as any;

        const recentActivity = db.prepare(`
			SELECT o.*, c.name as client 
			FROM orders o
			LEFT JOIN clients c ON o.client_id = c.id
			ORDER BY o.created_at DESC
			LIMIT 5
		`).all();

        return json({
            stats: {
                clients: clientsCount.count || 0,
                parts: partsStock.total || 0,
                pendingOs: pendingOs.count || 0,
                completedOs: completedOs.count || 0,
            },
            recentActivity
        });
    } catch (err) {
        return json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
