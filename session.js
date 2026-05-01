const md5 = require('md5')
const crypto = require('crypto')
 
exports.sessions = {
}

exports.login = async function(req, login, pass) {

	let cookies = req.cookies || {}
	let secret = cookies['app_user']

	let user = await req.db.oneOrNone('SELECT * FROM users WHERE login = $1', login)

	if (user && (user.pass == md5(pass))) {
		let secret = 'secret';
		let hash = crypto.createHmac('sha256', secret)
		                   .update(login)
		                   .digest('hex');

		let cookie = login + '--' + hash;
		exports.sessions[login] = {
			active:    1,
			timestamp: new Date().getTime(),
		}
		exports.sessions[login].user = user
		return cookie;
	}
	return 0;
}

exports.auth = function(req) {

	let cookies = req.cookies || {}

	let secret = cookies['app_user']

	if (!secret) {
		return {}
	}
	let res = secret.split('--');

	if(!res.length) {
		return {}
	}
	let session = exports.sessions[res[0]]
	if (!session) {
		return {};
	}
	let current_timestamp = new Date().getTime()

	if (!session.active || ((current_timestamp - session.timestamp) > 43200*1000)) {
		return 0;
	}
	return session;
}

exports.logout = function(login) {
	exports.sessions[login] = {
	}
}
