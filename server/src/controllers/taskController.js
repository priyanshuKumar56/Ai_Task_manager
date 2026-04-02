const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { Task } = require('../models/Task');
const { enqueueTask, cancelTask, getQueueStats } = require('../services/queueService');
const logger = require('../utils/logger');

// SSE clients registry
const sseClients = new Map(); // userId -> Set of response objects

const registerSSEClient = (userId, res) => {
  if (!sseClients.has(userId)) {
    sseClients.set(userId, new Set());
  }
  sseClients.get(userId).add(res);
};

const unregisterSSEClient = (userId, res) => {
  if (sseClients.has(userId)) {
    sseClients.get(userId).delete(res);
    if (sseClients.get(userId).size === 0) {
      sseClients.delete(userId);
    }
  }
};

const broadcastTaskUpdate = (userId, task) => {
  const clients = sseClients.get(userId.toString());
  if (!clients || clients.size === 0) return;

  const data = JSON.stringify({
    type: 'TASK_UPDATE',
    payload: task,
    timestamp: new Date().toISOString(),
  });

  clients.forEach((res) => {
    try {
      res.write(`data: ${data}\n\n`);
    } catch (err) {
      logger.warn('SSE write failed, removing client');
      unregisterSSEClient(userId, res);
    }
  });
};

// ─── SSE Endpoint ──────────────────────────────────────────────────────────────
const streamTaskUpdates = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Nginx buffering disable
  res.flushHeaders();

  const userId = req.user._id.toString();
  registerSSEClient(userId, res);

  // Send initial connection acknowledgement
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', userId })}\n\n`);

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unregisterSSEClient(userId, res);
    logger.debug({ userId }, 'SSE client disconnected');
  });
};

// ─── Create Task ──────────────────────────────────────────────────────────────
const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { title, description, operation, inputText, priority, tags } = req.body;
  const userId = req.user._id;

  const task = await Task.create({
    taskId: uuidv4(),
    title,
    description,
    operation,
    inputText,
    priority: priority || 0,
    tags: tags || [],
    userId,
    status: 'pending',
  });

  task.addLog('info', 'Task created, queuing for processing');
  await task.save();

  // Enqueue to Bull/Redis
  const job = await enqueueTask(task);

  task.addLog('info', `Task enqueued with job ID: ${job.id}`);
  await task.save();

  // Broadcast via SSE
  broadcastTaskUpdate(userId, task);

  logger.info({ taskId: task.taskId, userId, operation }, 'Task created and queued');

  return res.status(201).json({
    success: true,
    message: 'Task created and queued for processing',
    data: { task },
  });
};

// ─── List Tasks ───────────────────────────────────────────────────────────────
const listTasks = async (req, res) => {
  const { page = 1, limit = 20, status, operation, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  const userId = req.user._id;

  const filter = { userId };
  if (status) filter.status = status;
  if (operation) filter.operation = operation;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .select('-logs -inputText') // Exclude heavy fields from list
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Task.countDocuments(filter),
  ]);

  return res.json({
    success: true,
    data: {
      tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: skip + tasks.length < total,
        hasPrev: parseInt(page) > 1,
      },
    },
  });
};

// ─── Get Single Task ──────────────────────────────────────────────────────────
const getTask = async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user._id;

  const task = await Task.findOne({ taskId, userId });
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  return res.json({ success: true, data: { task } });
};

// ─── Get Task Logs ────────────────────────────────────────────────────────────
const getTaskLogs = async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user._id;
  const { level, limit = 100 } = req.query;

  const task = await Task.findOne({ taskId, userId }).select('logs status taskId title');
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  let logs = task.logs;
  if (level) logs = logs.filter(l => l.level === level);
  logs = logs.slice(-parseInt(limit));

  return res.json({
    success: true,
    data: { taskId, title: task.title, status: task.status, logs },
  });
};

// ─── Cancel Task ──────────────────────────────────────────────────────────────
const cancelTaskHandler = async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user._id;

  const task = await Task.findOne({ taskId, userId });
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  if (!['pending', 'queued'].includes(task.status)) {
    return res.status(400).json({ success: false, message: `Cannot cancel task in '${task.status}' status` });
  }

  await cancelTask(taskId);
  task.status = 'cancelled';
  task.addLog('info', 'Task cancelled by user');
  await task.save();

  broadcastTaskUpdate(userId, task);

  return res.json({ success: true, message: 'Task cancelled', data: { task } });
};

// ─── Retry Task ───────────────────────────────────────────────────────────────
const retryTask = async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user._id;

  const task = await Task.findOne({ taskId, userId });
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  if (!['failed', 'cancelled'].includes(task.status)) {
    return res.status(400).json({ success: false, message: 'Only failed or cancelled tasks can be retried' });
  }

  const newTask = await Task.create({
    taskId: uuidv4(),
    title: `${task.title} (retry)`,
    description: task.description,
    operation: task.operation,
    inputText: task.inputText,
    priority: task.priority,
    tags: task.tags,
    userId,
    status: 'pending',
  });

  newTask.addLog('info', `Retry of task ${task.taskId}`);
  await newTask.save();
  await enqueueTask(newTask);

  broadcastTaskUpdate(userId, newTask);

  return res.status(201).json({ success: true, message: 'Task retry queued', data: { task: newTask } });
};

// ─── Get Stats ────────────────────────────────────────────────────────────────
const getTaskStats = async (req, res) => {
  const userId = req.user._id;

  const [statusCounts, operationCounts, queueStats] = await Promise.all([
    Task.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.aggregate([
      { $match: { userId } },
      { $group: { _id: '$operation', count: { $sum: 1 }, avgDuration: { $avg: '$processingDurationMs' } } },
    ]),
    getQueueStats(),
  ]);

  const stats = {
    byStatus: {},
    byOperation: {},
    queue: queueStats,
  };

  statusCounts.forEach(({ _id, count }) => { stats.byStatus[_id] = count; });
  operationCounts.forEach(({ _id, count, avgDuration }) => {
    stats.byOperation[_id] = { count, avgDurationMs: Math.round(avgDuration || 0) };
  });

  return res.json({ success: true, data: { stats } });
};

// Export broadcast so it can be used by other services
module.exports = {
  createTask,
  listTasks,
  getTask,
  getTaskLogs,
  cancelTaskHandler,
  retryTask,
  getTaskStats,
  streamTaskUpdates,
  broadcastTaskUpdate,
};
