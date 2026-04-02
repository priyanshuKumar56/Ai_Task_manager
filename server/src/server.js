require('dotenv').config();
require('express-async-errors');

const app = require('./app');
const logger = require('./utils/logger');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initializeQueues } = require('./services/queueService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('✅ MongoDB connected');

    // Connect to Redis
    await connectRedis();
    logger.info('✅ Redis connected');

    // Initialize Bull queues
    await initializeQueues();
    logger.info('✅ Task queues initialized');

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
        process.exit(0);
      });
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled Rejection');
      shutdown('UNHANDLED_REJECTION');
    });

    process.on('uncaughtException', (error) => {
      logger.error({ error }, 'Uncaught Exception');
      shutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
