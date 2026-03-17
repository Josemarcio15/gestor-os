import { json } from '@sveltejs/kit';
import { getUserDb, encrypt, decrypt } from '$lib/server/db';

function getUsername(request: Request) {
    return request.headers.get('x-user-id');
}

export async function GET({ request }) {
    const username = getUsername(request);
    if (!username) return json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const db = getUserDb(username);
        let clients = db.prepare('SELECT * FROM clients WHERE active = 1 ORDER BY name ASC').all();

        clients = clients.map((c: any) => ({
            ...c,
            email: decrypt(c.email),
            phone: decrypt(c.phone),
            document: decrypt(c.document)
        }));

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
        if (!data.name || !data.document) {
            return json({ error: 'Nome e CPF/CNPJ são obrigatórios' }, { status: 400 });
        }
        const db = getUserDb(username);

        const encEmail = encrypt(data.email);
        const encPhone = encrypt(data.phone);
        const encDoc = encrypt(data.document);

        if (data.id) {
            const stmt = db.prepare(`
				UPDATE clients 
				SET name = ?, email = ?, phone = ?, document = ?
				WHERE id = ?
			`);
            stmt.run(data.name, encEmail, encPhone, encDoc, data.id);
        } else {
            const stmt = db.prepare(`
				INSERT INTO clients (name, email, phone, document)
				VALUES (?, ?, ?, ?)
			`);
            stmt.run(data.name, encEmail, encPhone, encDoc);
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

        // Executa o Soft Delete
        const result = db.prepare('UPDATE clients SET active = 0 WHERE id = ?').run(id);

        // Verifica se algum registro foi realmente alterado (caso o ID não exista)
        if (result.changes === 0) {
            return json({ error: 'Cliente não encontrado' }, { status: 404 });
        }

        return json({ success: true, message: 'Cliente desativado com sucesso' });
    } catch (err: any) {
        // Se cair aqui, pode ser que a coluna 'active' ainda não exista no banco da VPS
        console.error("Erro crítico no DELETE:", err);
        return json({
            error: 'Erro ao desativar cliente. Verifique se o banco está atualizado.',
            details: err.message
        }, { status: 500 });
    }
}

// export async function DELETE({ request, url }) {
//     const username = getUsername(request);
//     if (!username) return json({ error: 'Unauthorized' }, { status: 401 });

//     try {
//         const id = url.searchParams.get('id');
//         if (!id) return json({ error: 'Missing ID' }, { status: 400 });
//         const db = getUserDb(username);
//         db.prepare('UPDATE clients SET active = 0 WHERE id = ?').run(id);
//         return json({ success: true });
//     } catch (err) {
//         console.error("Erro ao desativar cliente:", err);
//         return json({ error: 'Failed to deactivate client' }, { status: 500 });
//     }
// }
