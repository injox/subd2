var express = require('express');
var router = express.Router();
const { getClickhouse, getRedis } = require('../datastores');

function requireUser(req, res) {
    if (!req.user) {
        res.redirect('/');
        return false;
    }
    return true;
}

router.get('/', async function(req, res, next) {
    if (!requireUser(req, res)) {
        return;
    }

    let products = await req.db.any('SELECT id, label FROM products ORDER BY id');
    let statuses = await req.db.any('SELECT id, label FROM order_statuses ORDER BY id');
    let statusMap = {};
    for (let s of statuses) {
        statusMap[s.id] = s.label;
    }

    let redisStats = [];
    try {
        let redis = await getRedis();
        let keys = products.map((p) => 'product:' + p.id + ':purchases');
        let values = await Promise.all(keys.map((key) => redis.get(key)));
        redisStats = products.map((p, idx) => ({
            id: p.id,
            label: p.label,
            purchases: parseInt(values[idx] || '0', 10)
        }));
    } catch (err) {
        console.error('Redis stats error:', err);
    }

    let clickhouseStats = [];
    try {
        let clickhouse = getClickhouse();
        let result = await clickhouse.query({
            query: 'SELECT order_id, status_id, ts_changed FROM orders_log ORDER BY ts_changed DESC',
            format: 'JSONEachRow'
        });
        let rows = await result.json();
        clickhouseStats = rows.map((row) => ({
            order_id: Number(row.order_id),
            status_id: Number(row.status_id),
            status_label: statusMap[row.status_id] || ('Status ' + row.status_id),
            ts_changed: row.ts_changed
        }));
    } catch (err) {
        console.error('ClickHouse stats error:', err);
    }

    res.render('stats/index', {
        title: 'Статистика',
        redisStats: redisStats,
        clickhouseStats: clickhouseStats
    });
});

module.exports = router;
