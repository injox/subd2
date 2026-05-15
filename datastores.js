const { MongoClient } = require('mongodb');
const { createClient: createRedisClient } = require('redis');
const { createClient: createClickhouseClient } = require('@clickhouse/client');

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const mongoDbName = process.env.MONGO_DB || 'mydatabase';
let mongoDbPromise;

async function getMongoDb() {
  if (!mongoDbPromise) {
    const client = new MongoClient(mongoUrl);
    mongoDbPromise = client.connect().then((connected) => connected.db(mongoDbName));
  }
  return mongoDbPromise;
}

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = createRedisClient({ url: redisUrl });
let redisReady = false;

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

async function getRedis() {
  if (!redisReady) {
    await redisClient.connect();
    redisReady = true;
  }
  return redisClient;
}

const clickhouseUrl = process.env.CLICKHOUSE_HOST || 'http://localhost:8123';
const clickhouseUser = process.env.CLICKHOUSE_USER || 'default';
const clickhousePassword = process.env.CLICKHOUSE_PASSWORD || '';
const clickhouseClient = createClickhouseClient({
  url: clickhouseUrl,
  username: clickhouseUser,
  password: clickhousePassword
});

function getClickhouse() {
  return clickhouseClient;
}

module.exports = {
  getMongoDb,
  getRedis,
  getClickhouse
};
