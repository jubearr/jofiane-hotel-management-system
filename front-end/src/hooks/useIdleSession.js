import { useEffect, useRef, useCallback } from 'react';

export const IDLE_HOME_DELAY = 10 * 60 * 1000;
export const IDLE_LOGOUT_DELAY = 30 * 60 * 1000;

/** Wall-clock deadlines also cover background-tab throttling and computer sleep. */
export default function useIdleSession({ enabled, onIdle, onExpire }) {
  const callbacks = useRef({ onIdle, onExpire });
  callbacks.current = { onIdle, onExpire };
  const controller = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let lastActivity = Date.now();
    let away = false;
    let expired = false;
    let timer;

    const checkDeadline = () => {
      if (expired) return false;
      const idleTime = Date.now() - lastActivity;
      if (idleTime >= IDLE_LOGOUT_DELAY) {
        expired = true;
        window.clearTimeout(timer);
        callbacks.current.onExpire();
        return false;
      }
      if (!away && idleTime >= IDLE_HOME_DELAY) {
        away = true;
        callbacks.current.onIdle();
      }
      return true;
    };

    const schedule = () => {
      window.clearTimeout(timer);
      if (expired) return;
      const deadline = away ? IDLE_LOGOUT_DELAY : IDLE_HOME_DELAY;
      timer = window.setTimeout(() => {
        if (checkDeadline()) schedule();
      }, Math.max(0, deadline - (Date.now() - lastActivity)));
    };

    const activity = () => {
      // An event after a sleeping tab wakes must never revive an expired session.
      if (!checkDeadline()) return;
      lastActivity = Date.now();
      schedule();
    };

    const visibility = () => {
      if (document.visibilityState === 'visible' && checkDeadline()) schedule();
    };

    controller.current = {
      resume: () => {
        if (!checkDeadline()) return false;
        lastActivity = Date.now();
        away = false;
        schedule();
        return true;
      },
    };
    const events = ['mousemove', 'pointerdown', 'click', 'keydown', 'touchstart', 'wheel'];
    events.forEach((event) => window.addEventListener(event, activity, { passive: true, capture: true }));
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('focus', visibility);
    schedule();

    return () => {
      window.clearTimeout(timer);
      controller.current = null;
      events.forEach((event) => window.removeEventListener(event, activity, true));
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('focus', visibility);
    };
  }, [enabled]);

  return useCallback(() => controller.current?.resume() ?? false, []);
}
