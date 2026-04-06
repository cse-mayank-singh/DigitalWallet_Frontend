import { useEffect, useRef, useCallback } from 'react';

type WSMessage = {
  type: 'BALANCE_UPDATE' | 'TRANSACTION_NOTIFICATION';
  payload: any;
};

type WSHandlers = {
  onBalanceUpdate?: (balance: number) => void;
  onTransactionNotification?: (tx: any) => void;
};

const WS_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080')
  .replace(/^http/, 'ws') + '/ws';

const WS_ENABLED = import.meta.env.VITE_WS_ENABLED === 'true';

/**
 * Connects to the backend WebSocket for real-time balance/transaction updates.
 * Only active when VITE_WS_ENABLED=true in .env
 */
export function useWebSocket(handlers: WSHandlers, enabled = true) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelay = useRef(1000);
  const unmountedRef = useRef(false);

  const connect = useCallback(() => {
    if (unmountedRef.current || !enabled || !WS_ENABLED) return;

    const token = sessionStorage.getItem('accessToken');
    const url = token ? `${WS_URL}?token=${token}` : WS_URL;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectDelay.current = 1000; // reset on success
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          if (msg.type === 'BALANCE_UPDATE' && handlers.onBalanceUpdate) {
            handlers.onBalanceUpdate(msg.payload?.balance);
          }
          if (msg.type === 'TRANSACTION_NOTIFICATION' && handlers.onTransactionNotification) {
            handlers.onTransactionNotification(msg.payload);
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!unmountedRef.current && enabled && WS_ENABLED) {
          // exponential backoff: 1s → 2s → 4s → max 30s
          setTimeout(connect, Math.min(reconnectDelay.current, 30000));
          reconnectDelay.current = reconnectDelay.current * 2;
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // WebSocket not available (dev without backend), silently skip
    }
  }, [enabled, handlers.onBalanceUpdate, handlers.onTransactionNotification]);

  useEffect(() => {
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
      wsRef.current?.close();
    };
  }, [connect]);
}