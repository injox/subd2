const pgp = require('pg-promise')();

const dbUrl = process.env.DATABASE_URL || 'postgres://myuser:mypassword@localhost:5434/mydatabase';
const db = pgp(dbUrl);

async function countValue(sql, params) {
    const row = await db.one(sql, params);
    return parseInt(row.cnt, 10);
}

afterAll(async () => {
    await pgp.end();
});

test('roles has required codes', async () => {
    const codes = await db.any('SELECT code FROM roles ORDER BY code');
    const set = new Set(codes.map((r) => r.code));
    expect(set.has('admin')).toBe(true);
    expect(set.has('manager')).toBe(true);
    expect(set.has('employee')).toBe(true);
});

test('users exist and have roles', async () => {
    const usersCount = await countValue('SELECT COUNT(*) AS cnt FROM users');
    expect(usersCount).toBeGreaterThan(0);

    const missingRoles = await countValue(
        'SELECT COUNT(*) AS cnt FROM users u LEFT JOIN roles r ON r.id = u.id_role WHERE r.id IS NULL'
    );
    expect(missingRoles).toBe(0);
});

test('clients exist and have labels', async () => {
    const clientsCount = await countValue('SELECT COUNT(*) AS cnt FROM clients');
    expect(clientsCount).toBeGreaterThan(0);

        const missingLabels = await countValue("SELECT COUNT(*) AS cnt FROM clients WHERE label IS NULL OR label = ''");
    expect(missingLabels).toBe(0);
});

test('order_statuses contains base statuses', async () => {
    const rows = await db.any('SELECT id FROM order_statuses ORDER BY id');
    const ids = new Set(rows.map((r) => r.id));
    expect(ids.has(10)).toBe(true);
    expect(ids.has(20)).toBe(true);
    expect(ids.has(30)).toBe(true);
});

test('payment_types contains base types', async () => {
    const rows = await db.any('SELECT id FROM payment_types ORDER BY id');
    const ids = new Set(rows.map((r) => r.id));
    expect(ids.has(10)).toBe(true);
    expect(ids.has(20)).toBe(true);
});

test('orders reference existing statuses', async () => {
    const missingStatuses = await countValue(
        'SELECT COUNT(*) AS cnt FROM orders o LEFT JOIN order_statuses s ON s.id = o.id_status WHERE s.id IS NULL'
    );
    expect(missingStatuses).toBe(0);
});

test('order items reference existing orders', async () => {
    const missingOrders = await countValue(
        'SELECT COUNT(*) AS cnt FROM order_items i LEFT JOIN orders o ON o.id = i.id_order WHERE o.id IS NULL'
    );
    expect(missingOrders).toBe(0);
});

test('payments reference existing orders', async () => {
    const missingOrders = await countValue(
        'SELECT COUNT(*) AS cnt FROM payments p LEFT JOIN orders o ON o.id = p.id_order WHERE o.id IS NULL'
    );
    expect(missingOrders).toBe(0);
});

test('user passwords look like md5 hashes', async () => {
    const invalidHashes = await countValue(
        'SELECT COUNT(*) AS cnt FROM users WHERE pass IS NULL OR length(pass) <> 32'
    );
    expect(invalidHashes).toBe(0);
});

test('users have logins', async () => {
    const missingLogins = await countValue(
        "SELECT COUNT(*) AS cnt FROM users WHERE login IS NULL OR login = ''"
    );
    expect(missingLogins).toBe(0);
});
