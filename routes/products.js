var express = require('express');
var router = express.Router();
const { getMongoDb } = require('../datastores');

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

    let products = await req.db.any('SELECT * FROM products ORDER BY id');
    let selectedId = parseInt(req.query.id, 10);
    let selectedProduct = null;
    let detailsEntries = [];

    if (!isNaN(selectedId)) {
        selectedProduct = await req.db.oneOrNone('SELECT * FROM products WHERE id = $1', selectedId);
        if (selectedProduct) {
            try {
                let mongoDb = await getMongoDb();
                let doc = await mongoDb.collection('product_details').findOne({ product_id: selectedId });
                let details = doc && doc.details ? doc.details : {};
                detailsEntries = Object.keys(details).map((key) => ({
                    key: key,
                    value: String(details[key])
                }));
            } catch (err) {
                console.error('Mongo details error:', err);
            }
        }
    }

    res.render('products/list', {
        title: 'Товары',
        products: products,
        selectedProduct: selectedProduct,
        detailsEntries: detailsEntries
    });
});

router.post('/create', async function(req, res, next) {
    if (!requireUser(req, res)) {
        return;
    }

    let label = (req.body.label || '').trim();
    let price = req.body.price ? parseFloat(req.body.price) : null;

    if (!label || price === null || isNaN(price)) {
        res.redirect('/products');
        return;
    }

    await req.db.none('INSERT INTO products(label, price) VALUES($1, $2)', [label, price]);
    res.redirect('/products');
});

router.post('/:id/details', async function(req, res, next) {
    if (!requireUser(req, res)) {
        return;
    }

    let productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
        res.redirect('/products');
        return;
    }

    let keys = req.body.detail_key || [];
    let values = req.body.detail_value || [];
    if (!Array.isArray(keys)) {
        keys = [keys];
    }
    if (!Array.isArray(values)) {
        values = [values];
    }

    let details = {};
    for (let i = 0; i < keys.length; i += 1) {
        let key = (keys[i] || '').trim();
        let value = values[i] !== undefined ? String(values[i]) : '';
        if (key) {
            details[key] = value;
        }
    }

    try {
        let mongoDb = await getMongoDb();
        await mongoDb.collection('product_details').updateOne(
            { product_id: productId },
            { $set: { product_id: productId, details: details } },
            { upsert: true }
        );
    } catch (err) {
        console.error('Mongo save error:', err);
    }

    res.redirect('/products?id=' + productId);
});

module.exports = router;
