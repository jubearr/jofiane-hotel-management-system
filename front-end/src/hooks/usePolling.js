import { useEffect, useRef, useCallback } from 'react';

/**
 * usePolling — calls `fetchFn` immediately on mount, then every `intervalMs`.
 * Stops automatically when the component unmounts.
 * Skips a tick if the previous fetch is still in-flight (avoids pile-ups).
 *
 * @param {Function} fetchFn   - async function to call (your existing fetch function)
 * @param {number}  intervalMs - polling interval in ms (default 10 000 = 10 s)
 * @param {Array}   deps       - extra dependencies that should restart the interval (e.g. [selectedDate])
 *
 * Usage:
 *   usePolling(fetchBookings, 10000);
 *   usePolling(fetchArrivals, 15000, [selectedDate]);
 */
export function usePolling(fetchFn, intervalMs = 10000, deps = []) {
  const inFlight  = useRef(false);
  const timerRef  = useRef(null);

  // Wrap fetchFn in a stable ref so the interval callback always sees the latest version
  const fetchRef  = useRef(fetchFn);
  useEffect(() => { fetchRef.current = fetchFn; }, [fetchFn]);

  const run = useCallback(async () => {
    if (inFlight.current) return;        // skip if previous call still running
    inFlight.current = true;
    try {
      await fetchRef.current();
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    // Fetch immediately
    run();

    // Then on every interval
    timerRef.current = setInterval(run, intervalMs);

    return () => {
      clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps]);
}
