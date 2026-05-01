let express = require('express');
let router = express.Router();

router.post('/login', function(req, res) {
    let cookie = session.login(req, req.body.login, req.body.password)
    if (cookie) {
        res.cookie('app_user', cookie, { maxAge: 43200*1000, httpOnly: true, path: '/' });
        res.json({ msg: ''})
        return;
    }
    res.json({ msg: 'Неверный логин/пароль'})
});
router.post('/logout', function(req, res) {
    let user = session.auth(req)
    if (user) {
        res.clearCookie('app_user', { path: '/' });
        session.logout(user)
    }
    res.json({ msg: '' })
});
module.exports = router;
