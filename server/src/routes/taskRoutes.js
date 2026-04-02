const express = require('express');
const { body, query, param } = require('express-validator');
const {
  createTask, listTasks, getTask, getTaskLogs,
  cancelTaskHandler, retryTask, getTaskStats, streamTaskUpdates,
} = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');
const { TASK_OPERATIONS } = require('../models/Task');

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

const createTaskValidation = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('operation').isIn(TASK_OPERATIONS).withMessage(`Operation must be one of: ${TASK_OPERATIONS.join(', ')}`),
  body('inputText').isLength({ min: 1, max: 50000 }).withMessage('Input text must be 1-50,000 characters'),
  body('priority').optional().isInt({ min: -10, max: 10 }),
  body('tags').optional().isArray({ max: 10 }),
];

const listTasksValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'queued', 'running', 'success', 'failed', 'cancelled']),
  query('operation').optional().isIn(TASK_OPERATIONS),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'status', 'operation']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
];

router.get('/stream', streamTaskUpdates);        // SSE endpoint
router.get('/stats', getTaskStats);
router.get('/', listTasksValidation, listTasks);
router.post('/', createTaskValidation, createTask);
router.get('/:taskId', getTask);
router.get('/:taskId/logs', getTaskLogs);
router.post('/:taskId/cancel', cancelTaskHandler);
router.post('/:taskId/retry', retryTask);

module.exports = router;
