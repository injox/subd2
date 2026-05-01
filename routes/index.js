let express = require('express');
let router = express.Router();

router.get('/', function(req, res, next) {
    let user = req.user;
    let can_view_users = user && user.id_role == 1 ? true : false;
    let can_view_clients = !!user;
    let can_view_orders = !!user;

    res.render('index', {
        title:  "Главная страница",
        user:   user,
        can_view_users: can_view_users,
        can_view_clients: can_view_clients,
        can_view_orders: can_view_orders,
    });

});

module.exports = router;


