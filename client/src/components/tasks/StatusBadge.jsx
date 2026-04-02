import { Clock, Loader2, CheckCircle2, XCircle, Ban, Radio } from 'lucide-react';

const config = {
  pending:   { icon: Clock,         label: 'Pending',   cls: 'status-pending'   },
  queued:    { icon: Radio,         label: 'Queued',    cls: 'status-queued'    },
  running:   { icon: Loader2,       label: 'Running',   cls: 'status-running'   },
  success:   { icon: CheckCircle2,  label: 'Success',   cls: 'status-success'   },
  failed:    { icon: XCircle,       label: 'Failed',    cls: 'status-failed'    },
  cancelled: { icon: Ban,           label: 'Cancelled', cls: 'status-cancelled' },
};

export default function StatusBadge({ status }) {
  const c = config[status] || config.pending;
  const Icon = c.icon;
  const isRunning = status === 'running';
  return (
    <span className={c.cls}>
      <Icon size={11} className={isRunning ? 'animate-spin' : ''} />
      {c.label}
    </span>
  );
}
