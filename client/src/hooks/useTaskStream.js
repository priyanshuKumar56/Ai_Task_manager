import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const useTaskStream = () => {
  const queryClient = useQueryClient();
  const { accessToken, isAuthenticated } = useAuthStore();
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!isAuthenticated || !accessToken) return;
    if (eventSourceRef.current) return; // Already connected

    const url = `${BASE_URL}/api/v1/tasks/stream?token=${encodeURIComponent(accessToken)}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log('[SSE] Connected to task stream');
      reconnectAttemptsRef.current = 0;
    };

    es.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);

        if (type === 'TASK_UPDATE' && payload) {
          // Optimistically update the task in cache
          queryClient.setQueryData(['task', payload.taskId], (old) =>
            old ? { ...old, data: { task: payload } } : old
          );

          // Invalidate task list to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['tasks'], refetchType: 'active' });

          // Invalidate stats if task reached terminal state
          if (['success', 'failed', 'cancelled'].includes(payload.status)) {
            queryClient.invalidateQueries({ queryKey: ['task-stats'] });
          }
        }
      } catch (err) {
        console.warn('[SSE] Failed to parse message', err);
      }
    };

    es.onerror = () => {
      console.warn('[SSE] Connection error, will reconnect...');
      es.close();
      eventSourceRef.current = null;

      // Exponential backoff reconnect
      const attempts = reconnectAttemptsRef.current;
      const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
      reconnectAttemptsRef.current = attempts + 1;

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
  }, [isAuthenticated, accessToken, queryClient]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }
    return disconnect;
  }, [isAuthenticated, connect, disconnect]);

  return { isConnected: !!eventSourceRef.current };
};
