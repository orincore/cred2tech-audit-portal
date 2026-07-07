import { useEffect, useRef } from 'react';

export function useLiveChannel(channel, filters, onRows, options = {}) {
  const { enabled = true, catchUpUrl } = options;
  const onRowsRef = useRef(onRows);
  const lastIdRef = useRef(0);
  onRowsRef.current = onRows;

  useEffect(() => {
    if (!enabled) return undefined;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws`);

    ws.onopen = async () => {
      if (lastIdRef.current && catchUpUrl) {
        try {
          const res = await fetch(catchUpUrl(lastIdRef.current));
          const body = await res.json();
          if (body.rows && body.rows.length) {
            lastIdRef.current = body.rows[body.rows.length - 1].id;
            onRowsRef.current(body.rows);
          }
        } catch {
          // best-effort catch-up only; live push below still resumes regardless
        }
      }
      ws.send(JSON.stringify({ type: 'subscribe', channel, filters }));
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'rows' && msg.channel === channel) {
        if (msg.rows.length) lastIdRef.current = msg.rows[msg.rows.length - 1].id;
        onRowsRef.current(msg.rows);
      }
    };

    return () => ws.close();
  }, [channel, JSON.stringify(filters), enabled]);
}
