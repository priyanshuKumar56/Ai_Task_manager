import { Link } from 'react-router-dom';
import { XCircle, RefreshCw, ExternalLink, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import StatusBadge from './StatusBadge';

export default function TaskCard({ task, onCancel, onRetry }) {
  const canCancel = ['pending', 'queued'].includes(task.status);
  const canRetry = ['failed', 'cancelled'].includes(task.status);
  const duration = task.processingDurationMs
    ? task.processingDurationMs < 1000
      ? `${task.processingDurationMs}ms`
      : `${(task.processingDurationMs / 1000).toFixed(2)}s`
    : null;

  return (
    <div className="card p-4 hover:border-surface-600 transition-all duration-150 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <StatusBadge status={task.status} />
          <div className="min-w-0 flex-1">
            <Link
              to={`/tasks/${task.taskId}`}
              className="text-sm font-medium text-slate-200 hover:text-white transition-colors truncate block"
            >
              {task.title}
            </Link>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs font-mono text-slate-500 bg-surface-900 px-2 py-0.5 rounded">
                {task.operation}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={10} />
                {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
              </span>
              {duration && (
                <span className="text-xs text-slate-500">⚡ {duration}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {canCancel && (
            <button onClick={onCancel} title="Cancel" className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-all">
              <XCircle size={14} />
            </button>
          )}
          {canRetry && (
            <button onClick={onRetry} title="Retry" className="p-1.5 rounded-md text-slate-500 hover:text-brand-400 hover:bg-brand-900/20 transition-all">
              <RefreshCw size={14} />
            </button>
          )}
          <Link to={`/tasks/${task.taskId}`} className="p-1.5 rounded-md text-slate-500 hover:text-slate-200 hover:bg-surface-700 transition-all">
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
