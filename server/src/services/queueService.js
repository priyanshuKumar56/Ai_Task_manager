const Bull = require('bull');
const logger = require('../utils/logger');
const { Task } = require('../models/Task');

const QUEUE_NAME = 'ai-tasks';
let taskQueue = null;

const queueConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    removeOnComplete: { count: 100, age: 24 * 3600 },
    removeOnFail: { count: 50, age: 7 * 24 * 3600 },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
  settings: {
    stalledInterval: 30000,       // Check stalled jobs every 30s
    maxStalledCount: 2,           // Max times a job can be stalled
    lockDuration: 30000,          // Job lock duration 30s
    lockRenewTime: 15000,         // Renew lock every 15s
    drainDelay: 300,
  },
};

const initializeQueues = async () => {
  taskQueue = new Bull(QUEUE_NAME, queueConfig);

  taskQueue.on('error', (error) => {
    logger.error({ error }, 'Bull queue error');
  });

  taskQueue.on('waiting', (jobId) => {
    logger.debug({ jobId }, 'Job waiting');
  });

  taskQueue.on('active', (job) => {
    logger.info({ jobId: job.id, taskId: job.data.taskId }, 'Job active');
  });

  taskQueue.on('stalled', (job) => {
    logger.warn({ jobId: job.id }, 'Job stalled - will be requeued');
  });

  taskQueue.on('completed', (job, result) => {
    logger.info({ jobId: job.id, taskId: job.data?.taskId }, 'Job completed');
  });

  taskQueue.on('failed', (job, err) => {
    logger.error({ jobId: job.id, taskId: job.data?.taskId, err }, 'Job failed');
  });

  taskQueue.on('paused', () => logger.warn('Queue paused'));
  taskQueue.on('resumed', () => logger.info('Queue resumed'));

  // Clean old jobs on startup
  await taskQueue.clean(24 * 3600 * 1000, 'completed');
  await taskQueue.clean(7 * 24 * 3600 * 1000, 'failed');

  logger.info(`Bull queue '${QUEUE_NAME}' initialized`);
  return taskQueue;
};

const getTaskQueue = () => {
  if (!taskQueue) throw new Error('Queue not initialized. Call initializeQueues() first.');
  return taskQueue;
};

const enqueueTask = async (task, options = {}) => {
  const queue = getTaskQueue();

  const jobData = {
    taskId: task.taskId,
    operation: task.operation,
    inputText: task.inputText,
    userId: task.userId.toString(),
    title: task.title,
    enqueuedAt: new Date().toISOString(),
  };

  const jobOptions = {
    jobId: task.taskId,
    priority: -(task.priority || 0), // Bull uses lower = higher priority
    delay: options.delay || 0,
    attempts: task.maxAttempts || 3,
    ...options,
  };

  const job = await queue.add(jobData, jobOptions);

  // Update task with queue job ID
  await Task.findOneAndUpdate(
    { taskId: task.taskId },
    { queueJobId: job.id.toString(), status: 'queued' }
  );

  logger.info({ jobId: job.id, taskId: task.taskId }, 'Task enqueued successfully');
  return job;
};

const cancelTask = async (taskId) => {
  const queue = getTaskQueue();
  const job = await queue.getJob(taskId);
  if (job) {
    const state = await job.getState();
    if (state === 'waiting' || state === 'delayed') {
      await job.remove();
      return true;
    }
  }
  return false;
};

const getQueueStats = async () => {
  const queue = getTaskQueue();
  const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
    queue.getPausedCount(),
  ]);
  return { waiting, active, completed, failed, delayed, paused, name: QUEUE_NAME };
};

module.exports = {
  initializeQueues,
  getTaskQueue,
  enqueueTask,
  cancelTask,
  getQueueStats,
  QUEUE_NAME,
};
