import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, Search, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasks, useCancelTask, useRetryTask } from '../hooks/useTasks';
import StatusBadge from '../components/tasks/StatusBadge';
import TaskCard from '../components/tasks/TaskCard';

const STATUSES = ['', 'pending', 'queued', 'running', 'success', 'failed', 'cancelled'];
const OPERATIONS = ['', 'uppercase', 'lowercase', 'reverse', 'word_count', 'char_count', 'palindrome'];

export default function TasksPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [operation, setOperation] = useState('');

  const filters = { page, limit: 15, ...(status && { status }), ...(operation && { operation }) };
  const { data, isLoading, isFetching, refetch } = useTasks(filters);
  const cancelTask = useCancelTask();
  const retryTask = useRetryTask();

  const tasks = data?.data?.tasks || [];
  const pagination = data?.data?.pagination || {};

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">
            {pagination.total ?? 0} total tasks
            {isFetching && !isLoading && <span className="ml-2 text-brand-400">• syncing</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-secondary" disabled={isFetching}>
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link to="/tasks/new" className="btn-primary">
            <PlusCircle size={14} /> New Task
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-surface-800 border border-surface-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <select
            value={operation}
            onChange={(e) => { setOperation(e.target.value); setPage(1); }}
            className="bg-surface-800 border border-surface-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {OPERATIONS.map(o => <option key={o} value={o}>{o || 'All Operations'}</option>)}
          </select>
        </div>
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-xl" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400 mb-4">No tasks found</p>
          <Link to="/tasks/new" className="btn-primary inline-flex">
            <PlusCircle size={14} /> Create your first task
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, i) => (
            <motion.div
              key={task.taskId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <TaskCard
                task={task}
                onCancel={() => cancelTask.mutate(task.taskId)}
                onRetry={() => retryTask.mutate(task.taskId)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={!pagination.hasPrev}
              className="btn-secondary px-3"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!pagination.hasNext}
              className="btn-secondary px-3"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
