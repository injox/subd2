var express = require('express');
var router = express.Router();

const ROLE_ADMIN = 1;
const ROLE_MANAGER = 2;
const ROLE_EMPLOYEE = 3;

function canCreateOrder(user) {
    return user && (user.id_role === ROLE_EMPLOYEE || user.id_role === ROLE_MANAGER || user.id_role === ROLE_ADMIN);
}

function canManageOrders(user) {
    return user && (user.id_role === ROLE_MANAGER || user.id_role === ROLE_ADMIN);
}

router.get('/', async function(req, res, next) {
    if (!req.user) {
        res.redirect('/');
        return;
    }

    let orders = await req.db.any(
        'SELECT o.*, ' +
        's.label AS status_label, ' +
        'c.label AS client_label, ' +
        'COALESCE(SUM(p.amount), 0) AS paid_amount ' +
        'FROM orders o ' +
        'LEFT JOIN order_statuses s ON s.id = o.id_status ' +
        'LEFT JOIN clients c ON c.id = o.id_client ' +
        'LEFT JOIN payments p ON p.id_order = o.id ' +
        'GROUP BY o.id, s.label, c.label ' +
        'ORDER BY o.id'
    );
    let clients = await req.db.any('SELECT * FROM clients ORDER BY id');
    let statuses = await req.db.any('SELECT * FROM order_statuses ORDER BY id');
    let paymentTypes = await req.db.any('SELECT * FROM payment_types ORDER BY id');

    res.render('orders/list', {
        title: 'Заказы',
        orders: orders,
        clients: clients,
        statuses: statuses,
        paymentTypes: paymentTypes,
        can_create_order: canCreateOrder(req.user),
        can_manage_orders: canManageOrders(req.user)
    });
});

router.post('/create', async function(req, res, next) {
    if (!canCreateOrder(req.user)) {
        res.status(403).send('Forbidden');
        return;
    }

    let label = (req.body.label || '').trim();
    let idClient = parseInt(req.body.id_client, 10);
    let amount = req.body.amount ? parseFloat(req.body.amount) : null;

    if (!label) {
        res.redirect('/orders');
        return;
    }

    await req.db.none(
        'INSERT INTO orders(label, id_client, amount) VALUES($1, $2, $3)',
        [label, isNaN(idClient) ? null : idClient, amount]
    );
    res.redirect('/orders');
});

router.post('/:id/status', async function(req, res, next) {
    if (!canManageOrders(req.user)) {
        res.status(403).send('Forbidden');
        return;
    }

    let orderId = parseInt(req.params.id, 10);
    let statusId = parseInt(req.body.id_status, 10);

    if (isNaN(orderId) || isNaN(statusId)) {
        res.redirect('/orders');
        return;
    }

    await req.db.none('UPDATE orders SET id_status = $1 WHERE id = $2', [statusId, orderId]);
    res.redirect('/orders');
});

router.post('/:id/payments', async function(req, res, next) {
    if (!canManageOrders(req.user)) {
        res.status(403).send('Forbidden');
        return;
    }

    let orderId = parseInt(req.params.id, 10);
    let typeId = parseInt(req.body.id_payment_type, 10);
    let amount = req.body.amount ? parseFloat(req.body.amount) : null;

    if (isNaN(orderId) || isNaN(typeId) || amount === null) {
        res.redirect('/orders');
        return;
    }

    await req.db.none(
        'INSERT INTO payments(id_order, id_payment_type, amount) VALUES($1, $2, $3)',
        [orderId, typeId, amount]
    );
    res.redirect('/orders');
});

router.get('/:id/items', async function(req, res, next) {
    if (!req.user) {
        res.redirect('/');
        return;
    }

    let orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
        res.redirect('/orders');
        return;
    }

    let order = await req.db.oneOrNone(
        'SELECT o.*, s.label AS status_label, c.label AS client_label ' +
        'FROM orders o ' +
        'LEFT JOIN order_statuses s ON s.id = o.id_status ' +
        'LEFT JOIN clients c ON c.id = o.id_client ' +
        'WHERE o.id = $1',
        orderId
    );

    if (!order) {
        res.status(404).send('Order not found');
        return;
    }

    let items = await req.db.any('SELECT * FROM order_items WHERE id_order = $1 ORDER BY id', orderId);
    res.render('orders/items', {
        title: 'Элементы заказа',
        order: order,
        items: items,
        can_add_items: canCreateOrder(req.user)
    });
});

router.post('/:id/items', async function(req, res, next) {
    if (!canCreateOrder(req.user)) {
        res.status(403).send('Forbidden');
        return;
    }

    let orderId = parseInt(req.params.id, 10);
    let label = (req.body.label || '').trim();
    let amount = req.body.amount ? parseFloat(req.body.amount) : null;

    if (isNaN(orderId) || !label) {
        res.redirect('/orders');
        return;
    }

    await req.db.none(
        'INSERT INTO order_items(label, id_order, amount) VALUES($1, $2, $3)',
        [label, orderId, amount]
    );
    res.redirect('/orders/' + orderId + '/items');
});

module.exports = router;
