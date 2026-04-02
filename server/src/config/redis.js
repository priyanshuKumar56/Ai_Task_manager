const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;
let isConnected = false;

const createRedisClient = () => {
  const options = process.env.REDIS_URL
    ? process.env.REDIS_URL
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
      };

  const client = new Redis(options, {
    maxRetriesPerRequest: null, // Essential for Bull
    enableReadyCheck: true,
    lazyConnect: true,
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryStrategy: (times) => {
      if (times > 20) {
        logger.error('Redis max retries exceeded, giving up');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 100, 3000);
      logger.warn(`Redis retry attempt ${times}, waiting ${delay}ms`);
      return delay;
    },
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  });

  client.on('connect', () => {
    isConnected = true;
    logger.info('Redis client connected');
  });

  client.on('ready', () => {
    logger.info('Redis client ready');
  });

  client.on('error', (err) => {
    isConnected = false;
    logger.error({ err }, 'Redis client error');
  });

  client.on('close', () => {
    isConnected = false;
    logger.warn('Redis connection closed');
  });

  client.on('reconnecting', () => {
    logger.info('Redis reconnecting...');
  });

  return client;
};

const connectRedis = async () => {
  redisClient = createRedisClient();
  await redisClient.connect();
  return redisClient;
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

const isRedisHealthy = () => isConnected;

// Circuit breaker pattern for Redis operations
const withRedisCircuitBreaker = async (operation, fallback) => {
  if (!isConnected) {
    logger.warn('Redis circuit breaker open - using fallback');
    return fallback ? fallback() : null;
  }
  try {
    return await operation();
  } catch (err) {
    logger.error({ err }, 'Redis operation failed');
    return fallback ? fallback() : null;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  isRedisHealthy,
  withRedisCircuitBreaker,
};
