import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

export default function usePageNavigation(initialPage) {
  const [page, setPage] = useState(initialPage);
  const transition = useRef(null);
  const destination = useRef(initialPage);
  const revision = useRef(0);
  useEffect(() => () => {
    revision.current += 1;
    transition.current?.skipTransition();
  }, []);
  const navigate = useCallback((nextPage, { immediate = false } = {}) => {
    if (destination.current === nextPage && !immediate) return;
    destination.current = nextPage;
    const request = ++revision.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    transition.current?.skipTransition();
    if (!document.startViewTransition || reduced || immediate) {
      setPage(nextPage);
      return;
    }
    // The destination is interactive as soon as it renders; no delay timers.
    transition.current = document.startViewTransition(() => {
      if (request === revision.current) flushSync(() => setPage(nextPage));
    });
    transition.current.ready.catch(() => {});
    transition.current.finished.catch(() => {});
  }, []);
  return [page, navigate];
}
