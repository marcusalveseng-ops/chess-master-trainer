type Window = { count: number; expires: number };

export function createRequestBudget(limit: number, durationMs: number) {
  const windows = new Map<string, Window>();
  let nextCleanup = 0;
  return (key: string, now = Date.now()) => {
    if (now >= nextCleanup) {
      windows.forEach((window, id) => {
        if (now >= window.expires) windows.delete(id);
      });
      nextCleanup = now + Math.min(durationMs, 60_000);
    }
    let window = windows.get(key);
    if (!window || now >= window.expires) {
      if (windows.size >= 10_000 && !windows.has(key)) return false;
      window = { count: 0, expires: now + durationMs };
      windows.set(key, window);
    }
    if (window.count >= limit) return false;
    window.count++;
    return true;
  };
}
