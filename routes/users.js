var express = require('express');
var router = express.Router();

router.get('/', async function(req, res, next) {
    let users = await req.db.any('SELECT * FROM users')
    console.log(users)
    res.render('users/list', { title: 'Пользователи', users: users })
});


module.exports = router;
