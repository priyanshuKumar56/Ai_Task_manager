import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Loader2 } from 'lucide-react';
import { useCreateTask } from '../hooks/useTasks';

const OPERATIONS = [
  { value: 'uppercase',  label: 'UPPERCASE',   desc: 'Convert all text to uppercase letters' },
  { value: 'lowercase',  label: 'lowercase',   desc: 'Convert all text to lowercase letters' },
  { value: 'reverse',    label: 'Reverse',     desc: 'Reverse the entire input string' },
  { value: 'word_count', label: 'Word Count',  desc: 'Count words, sentences, and frequency' },
  { value: 'char_count', label: 'Char Count',  desc: 'Count characters, digits, spaces' },
  { value: 'palindrome', label: 'Palindrome',  desc: 'Check if text is a palindrome' },
];

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const createTask = useCreateTask();
  const [form, setForm] = useState({
    title: '',
    description: '',
    operation: '',
    inputText: '',
    priority: 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: name === 'priority' ? parseInt(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    createTask.mutate(form, {
      onSuccess: (data) => navigate(`/tasks/${data.data.task.taskId}`),
    });
  };

  const isValid = form.title && form.operation && form.inputText;

  return (
    <div className="page-container max-w-3xl">
      <div className="mb-6">
        <Link to="/tasks" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4">
          <ArrowLeft size={14} /> Back to tasks
        </Link>
        <h1 className="text-2xl font-bold text-slate-100">Create New Task</h1>
        <p className="text-slate-400 text-sm mt-1">Configure and queue an AI text processing task</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Task Details</h2>
          <div>
            <label className="label">Title *</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Analyze product description" className="input-field" required maxLength={200} />
          </div>
          <div>
            <label className="label">Description <span className="text-slate-500">(optional)</span></label>
            <input name="description" value={form.description} onChange={handleChange} placeholder="What is this task for?" className="input-field" maxLength={1000} />
          </div>
          <div>
            <label className="label">Priority</label>
            <select name="priority" value={form.priority} onChange={handleChange} className="input-field">
              {[-2, -1, 0, 1, 2].map(p => (
                <option key={p} value={p}>
                  {p === 0 ? 'Normal (0)' : p > 0 ? `High (+${p})` : `Low (${p})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Operation picker */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Operation *</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {OPERATIONS.map(op => (
              <button
                key={op.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, operation: op.value }))}
                className={`p-3 rounded-lg border text-left transition-all duration-150 ${
                  form.operation === op.value
                    ? 'border-brand-500 bg-brand-600/10 text-brand-300'
                    : 'border-surface-700 bg-surface-900 text-slate-400 hover:border-surface-500 hover:text-slate-200'
                }`}
              >
                <p className="text-sm font-semibold font-mono">{op.label}</p>
                <p className="text-xs mt-1 opacity-70">{op.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Input text */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Input Text *</h2>
          <textarea
            name="inputText"
            value={form.inputText}
            onChange={handleChange}
            placeholder="Enter the text you want to process..."
            className="input-field min-h-[140px] resize-y font-mono text-sm"
            required
            maxLength={50000}
          />
          <p className="text-xs text-slate-500 mt-2 text-right">{form.inputText.length.toLocaleString()} / 50,000 chars</p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <Link to="/tasks" className="btn-secondary">Cancel</Link>
          <button
            type="submit"
            disabled={!isValid || createTask.isPending}
            className="btn-primary px-6"
          >
            {createTask.isPending ? (
              <><Loader2 size={14} className="animate-spin" /> Queuing...</>
            ) : (
              <><Zap size={14} /> Run Task</>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
