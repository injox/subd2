var express = require('express');
var router = express.Router();

router.get('/', async function(req, res, next) {
    if (!req.user) {
        res.redirect('/');
        return;
    }
    let clients = await req.db.any('SELECT * FROM clients ORDER BY id');
    let can_create_client = req.user && req.user.id_role === 1;
    res.render('clients/list', {
        title: 'Клиенты',
        clients: clients,
        can_create_client: can_create_client
    });
});

router.post('/create', async function(req, res, next) {
    if (!req.user || req.user.id_role !== 1) {
        res.status(403).send('Forbidden');
        return;
    }

    let label = (req.body.label || '').trim();
    if (!label) {
        res.redirect('/clients');
        return;
    }

    await req.db.none('INSERT INTO clients(label) VALUES($1)', label);
    res.redirect('/clients');
});

module.exports = router;
