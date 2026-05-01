let express = require('express');
let router = express.Router();
let session = require('../../session');

router.post('/login', async function(req, res) {
    let cookie = await session.login(req, req.body.login, req.body.password);
    if (cookie) {
        res.cookie('app_user', cookie, { maxAge: 43200*1000, httpOnly: true, path: '/' });
        res.json({ msg: ''});
        return;
    }
    res.json({ msg: 'Неверный логин/пароль'});
});

router.post('/logout', function(req, res) {
    let auth = session.auth(req);
    let user = auth && auth.user ? auth.user : null;
    if (user) {
        res.clearCookie('app_user', { path: '/' });
        session.logout(user.login);
    }
    res.json({ msg: '' });
});

module.exports = router;
