const mongoose = require('mongoose');

const TASK_OPERATIONS = ['uppercase', 'lowercase', 'reverse', 'word_count', 'char_count', 'palindrome'];
const TASK_STATUSES = ['pending', 'queued', 'running', 'success', 'failed', 'cancelled'];

const logEntrySchema = new mongoose.Schema(
  {
    level: { type: String, enum: ['info', 'warn', 'error', 'debug'], default: 'info' },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    operation: {
      type: String,
      required: [true, 'Operation is required'],
      enum: {
        values: TASK_OPERATIONS,
        message: `Operation must be one of: ${TASK_OPERATIONS.join(', ')}`,
      },
    },
    inputText: {
      type: String,
      required: [true, 'Input text is required'],
      maxlength: [50000, 'Input text cannot exceed 50,000 characters'],
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'pending',
      index: true,
    },
    priority: {
      type: Number,
      default: 0,
      min: -10,
      max: 10,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    logs: {
      type: [logEntrySchema],
      default: [],
    },
    error: {
      message: { type: String },
      code: { type: String },
      stack: { type: String },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    queueJobId: {
      type: String,
      default: null,
    },
    workerInstance: {
      type: String,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    processingDurationMs: { type: Number, default: null },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Compound Indexes for Performance ─────────────────────────────────────────
taskSchema.index({ userId: 1, status: 1, createdAt: -1 });  // List tasks by user + status
taskSchema.index({ userId: 1, createdAt: -1 });              // List tasks by user
taskSchema.index({ status: 1, createdAt: 1 });               // Worker queue processing
taskSchema.index({ status: 1, priority: -1, createdAt: 1 }); // Priority queue
taskSchema.index({ queueJobId: 1 });                         // Job lookup
taskSchema.index({ operation: 1, status: 1 });               // Analytics
taskSchema.index({ createdAt: -1 });                         // Time-based queries
taskSchema.index({ taskId: 1, userId: 1 });                  // Auth + lookup

// TTL index: auto-delete failed tasks after 30 days
taskSchema.index(
  { completedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { status: 'failed' } }
);

// ─── Virtual Fields ────────────────────────────────────────────────────────────
taskSchema.virtual('duration').get(function () {
  if (this.startedAt && this.completedAt) {
    return this.completedAt - this.startedAt;
  }
  return null;
});

// ─── Instance Methods ─────────────────────────────────────────────────────────
taskSchema.methods.addLog = function (level, message, metadata = {}) {
  this.logs.push({ level, message, metadata, timestamp: new Date() });
  if (this.logs.length > 500) {
    this.logs = this.logs.slice(-500); // Keep last 500 logs
  }
};

taskSchema.methods.markRunning = function (workerInstance) {
  this.status = 'running';
  this.startedAt = new Date();
  this.workerInstance = workerInstance;
  this.attempts += 1;
  this.addLog('info', `Task picked up by worker: ${workerInstance}`);
};

taskSchema.methods.markSuccess = function (result) {
  this.status = 'success';
  this.result = result;
  this.completedAt = new Date();
  this.progress = 100;
  if (this.startedAt) {
    this.processingDurationMs = this.completedAt - this.startedAt;
  }
  this.addLog('info', 'Task completed successfully');
};

taskSchema.methods.markFailed = function (error) {
  this.status = 'failed';
  this.completedAt = new Date();
  this.error = {
    message: error.message || 'Unknown error',
    code: error.code || 'TASK_FAILED',
    stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
  };
  if (this.startedAt) {
    this.processingDurationMs = this.completedAt - this.startedAt;
  }
  this.addLog('error', `Task failed: ${error.message}`);
};

const Task = mongoose.model('Task', taskSchema);

module.exports = { Task, TASK_OPERATIONS, TASK_STATUSES };
