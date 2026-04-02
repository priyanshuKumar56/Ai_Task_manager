const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:standard' },
    },
  }),
  base: {
    pid: process.pid,
    service: 'ai-task-platform-api',
    version: process.env.APP_VERSION || '1.0.0',
  },
});

module.exports = logger;
