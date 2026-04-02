import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { taskApi } from '../services/api';
import toast from 'react-hot-toast';

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const taskKeys = {
  all: ['tasks'],
  lists: () => [...taskKeys.all, 'list'],
  list: (filters) => [...taskKeys.lists(), filters],
  detail: (taskId) => ['task', taskId],
  logs: (taskId) => ['task-logs', taskId],
  stats: () => ['task-stats'],
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
export const useTasks = (filters = {}) => {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => taskApi.list(filters).then(r => r.data),
    staleTime: 10000,
    refetchInterval: (data) => {
      // Poll faster if there are active tasks
      const tasks = data?.data?.tasks || [];
      const hasActive = tasks.some(t => ['pending', 'queued', 'running'].includes(t.status));
      return hasActive ? 3000 : 30000;
    },
  });
};

export const useTask = (taskId) => {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => taskApi.get(taskId).then(r => r.data),
    enabled: !!taskId,
    refetchInterval: (data) => {
      const status = data?.data?.task?.status;
      return ['pending', 'queued', 'running'].includes(status) ? 2000 : false;
    },
  });
};

export const useTaskLogs = (taskId, params = {}) => {
  return useQuery({
    queryKey: taskKeys.logs(taskId),
    queryFn: () => taskApi.getLogs(taskId, params).then(r => r.data),
    enabled: !!taskId,
    refetchInterval: (data) => {
      // Keep polling if task is still running
      return 3000;
    },
  });
};

export const useTaskStats = () => {
  return useQuery({
    queryKey: taskKeys.stats(),
    queryFn: () => taskApi.getStats().then(r => r.data),
    staleTime: 15000,
    refetchInterval: 30000,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => taskApi.create(data).then(r => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
      toast.success(`Task "${data.data.task.title}" created and queued!`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create task');
    },
  });
};

export const useCancelTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId) => taskApi.cancel(taskId).then(r => r.data),
    onSuccess: (data) => {
      const taskId = data.data.task.taskId;
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      toast.success('Task cancelled');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to cancel task');
    },
  });
};

export const useRetryTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId) => taskApi.retry(taskId).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: taskKeys.stats() });
      toast.success('Task queued for retry');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to retry task');
    },
  });
};
