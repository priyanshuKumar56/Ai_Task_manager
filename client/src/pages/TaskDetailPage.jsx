import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, XCircle, Copy, Clock, Cpu, FileText, ScrollText } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useTask, useTaskLogs, useCancelTask, useRetryTask } from '../hooks/useTasks';
import StatusBadge from '../components/tasks/StatusBadge';
import toast from 'react-hot-toast';

const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-surface-700 last:border-0">
    <span className="text-sm text-slate-500">{label}</span>
    <span className="text-sm text-slate-200 font-mono text-right max-w-[60%] break-all">{value ?? '—'}</span>
  </div>
);

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('result');

  const { data: taskData, isLoading } = useTask(taskId);
  const { data: logsData } = useTaskLogs(taskId);
  const cancelTask = useCancelTask();
  const retryTask = useRetryTask();

  const task = taskData?.data?.task;
  const logs = logsData?.data?.logs || [];

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="space-y-4">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-48 w-full rounded-xl" />
          <div className="skeleton h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-slate-400 mb-4">Task not found</p>
        <Link to="/tasks" className="btn-secondary inline-flex">Back to Tasks</Link>
      </div>
    );
  }

  const duration = task.processingDurationMs
    ? task.processingDurationMs < 1000
      ? `${task.processingDurationMs}ms`
      : `${(task.processingDurationMs / 1000).toFixed(2)}s`
    : null;

  const copyResult = () => {
    const text = JSON.stringify(task.result, null, 2);
    navigator.clipboard.writeText(text);
    toast.success('Result copied!');
  };

  const logLevelColor = { info: 'text-slate-300', warn: 'text-amber-400', error: 'text-red-400', debug: 'text-slate-500' };

  return (
    <div className="page-container max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link to="/tasks" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-4">
          <ArrowLeft size={14} /> Back to tasks
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-slate-100">{task.title}</h1>
              <StatusBadge status={task.status} />
            </div>
            <p className="text-sm text-slate-500 font-mono">{task.taskId}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {['pending', 'queued'].includes(task.status) && (
              <button
                onClick={() => cancelTask.mutate(taskId, { onSuccess: () => navigate('/tasks') })}
                disabled={cancelTask.isPending}
                className="btn-danger"
              >
                <XCircle size={13} /> Cancel
              </button>
            )}
            {['failed', 'cancelled'].includes(task.status) && (
              <button
                onClick={() => retryTask.mutate(taskId)}
                disabled={retryTask.isPending}
                className="btn-secondary"
              >
                <RefreshCw size={13} /> Retry
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Metadata */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Cpu size={12} /> Details
            </h3>
            <InfoRow label="Operation" value={task.operation} />
            <InfoRow label="Priority" value={task.priority} />
            <InfoRow label="Attempts" value={task.attempts} />
            <InfoRow label="Worker" value={task.workerInstance?.split('-').slice(-1)[0] || null} />
            {duration && <InfoRow label="Duration" value={duration} />}
            <InfoRow label="Created" value={formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })} />
            {task.completedAt && <InfoRow label="Completed" value={format(new Date(task.completedAt), 'HH:mm:ss')} />}
          </div>

          <div className="card p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText size={12} /> Input
            </h3>
            <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
              {task.inputText}
            </pre>
          </div>
        </div>

        {/* Right: Result + Logs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-surface-700">
            {['result', 'logs'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-brand-500 text-brand-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'result' ? 'Result' : `Logs (${logs.length})`}
              </button>
            ))}
          </div>

          {activeTab === 'result' ? (
            <div className="card p-5">
              {task.status === 'success' && task.result ? (
                <>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">Output</span>
                    <button onClick={copyResult} className="btn-secondary py-1 px-2 text-xs">
                      <Copy size={11} /> Copy
                    </button>
                  </div>
                  <pre className="text-sm text-green-300 font-mono whitespace-pre-wrap break-words bg-green-900/10 border border-green-800/30 rounded-lg p-4 overflow-x-auto">
                    {JSON.stringify(task.result, null, 2)}
                  </pre>
                </>
              ) : task.status === 'failed' && task.error ? (
                <div className="bg-red-900/10 border border-red-800/30 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-400 mb-1">Error: {task.error.message}</p>
                  {task.error.code && <p className="text-xs text-red-600 font-mono">Code: {task.error.code}</p>}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 text-sm">
                  {['pending', 'queued', 'running'].includes(task.status)
                    ? 'Task is processing...'
                    : 'No result available'}
                </div>
              )}
            </div>
          ) : (
            <div className="card p-5">
              <div className="font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No logs yet</p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`flex gap-3 py-1 ${logLevelColor[log.level] || 'text-slate-400'}`}>
                      <span className="text-slate-600 flex-shrink-0 w-20 truncate">
                        {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                      </span>
                      <span className="uppercase text-xs w-10 flex-shrink-0">[{log.level}]</span>
                      <span className="break-all">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}