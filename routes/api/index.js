let express = require('express');
let router = express.Router();
const { getMongoDb, getRedis } = require('../../datastores');

router.get('/products/:id/details', async function(req, res, next) {
	let productId = parseInt(req.params.id, 10);
	if (isNaN(productId)) {
		res.status(400).json({ msg: 'Invalid product id' });
		return;
	}

	try {
		let redis = await getRedis();
		let cacheKey = 'product:' + productId + ':details';
		let cached = await redis.get(cacheKey);
		if (cached) {
			res.json({ source: 'redis', data: JSON.parse(cached) });
			return;
		}

		let mongoDb = await getMongoDb();
		let doc = await mongoDb.collection('product_details').findOne({ product_id: productId });
		if (!doc) {
			res.status(404).json({ msg: 'Not found' });
			return;
		}

		await redis.set(cacheKey, JSON.stringify(doc.details || {}), { EX: 3600 });
		res.json({ source: 'mongo', data: doc.details || {} });
	} catch (err) {
		next(err);
	}
});

router.post('/products/:id/details', async function(req, res, next) {
	let productId = parseInt(req.params.id, 10);
	if (isNaN(productId)) {
		res.status(400).json({ msg: 'Invalid product id' });
		return;
	}

	let details = req.body && req.body.details ? req.body.details : req.body;
	if (!details || typeof details !== 'object') {
		res.status(400).json({ msg: 'Invalid details' });
		return;
	}

	try {
		let mongoDb = await getMongoDb();
		await mongoDb.collection('product_details').updateOne(
			{ product_id: productId },
			{ $set: { product_id: productId, details: details } },
			{ upsert: true }
		);

		let redis = await getRedis();
		let cacheKey = 'product:' + productId + ':details';
		await redis.set(cacheKey, JSON.stringify(details), { EX: 3600 });
		res.json({ msg: 'ok' });
	} catch (err) {
		next(err);
	}
});

router.get('/products/:id/stats', async function(req, res, next) {
	let productId = parseInt(req.params.id, 10);
	if (isNaN(productId)) {
		res.status(400).json({ msg: 'Invalid product id' });
		return;
	}

	try {
		let redis = await getRedis();
		let key = 'product:' + productId + ':purchases';
		let value = await redis.get(key);
		res.json({ product_id: productId, purchases: parseInt(value || '0', 10) });
	} catch (err) {
		next(err);
	}
});

module.exports = router;
