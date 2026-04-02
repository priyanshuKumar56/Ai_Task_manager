const express = require('express');
const mongoose = require('mongoose');
const { isRedisHealthy } = require('../config/redis');
const { getQueueStats } = require('../services/queueService');

const router = express.Router();

router.get('/', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy';
  const redisStatus = isRedisHealthy() ? 'healthy' : 'unhealthy';

  let queueStats = null;
  try {
    queueStats = await getQueueStats();
  } catch {}

  const isHealthy = mongoStatus === 'healthy' && redisStatus === 'healthy';

  return res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    services: {
      mongodb: { status: mongoStatus, readyState: mongoose.connection.readyState },
      redis: { status: redisStatus },
      queue: queueStats,
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

router.get('/live', (req, res) => {
  return res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

router.get('/ready', async (req, res) => {
  const isReady = mongoose.connection.readyState === 1 && isRedisHealthy();
  if (isReady) {
    return res.json({ status: 'ready' });
  }
  return res.status(503).json({ status: 'not ready', mongo: mongoose.connection.readyState, redis: isRedisHealthy() });
});

module.exports = router;
