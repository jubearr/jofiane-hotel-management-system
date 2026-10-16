import { act, fireEvent, render } from '@testing-library/react';
import useIdleSession, { IDLE_HOME_DELAY, IDLE_LOGOUT_DELAY } from './useIdleSession';

function Harness(props) {
  const resume = useIdleSession(props);
  return <button onClick={resume}>Resume</button>;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('covers the portal at 10 minutes and expires at 30 total idle minutes', () => {
  const onIdle = jest.fn();
  const onExpire = jest.fn();
  render(<Harness enabled onIdle={onIdle} onExpire={onExpire} />);
  act(() => jest.advanceTimersByTime(IDLE_HOME_DELAY));
  expect(onIdle).toHaveBeenCalledTimes(1);
  expect(onExpire).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(IDLE_LOGOUT_DELAY - IDLE_HOME_DELAY));
  expect(onExpire).toHaveBeenCalledTimes(1);
});

test('real activity renews inactivity, and returning starts a fresh idle cycle', () => {
  const onIdle = jest.fn();
  const onExpire = jest.fn();
  const view = render(<Harness enabled onIdle={onIdle} onExpire={onExpire} />);
  act(() => jest.advanceTimersByTime(IDLE_HOME_DELAY - 1000));
  fireEvent.mouseMove(window);
  act(() => jest.advanceTimersByTime(1000));
  expect(onIdle).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(IDLE_HOME_DELAY));
  expect(onIdle).toHaveBeenCalledTimes(1);
  fireEvent.click(view.getByText('Resume'));
  act(() => jest.advanceTimersByTime(IDLE_HOME_DELAY));
  expect(onIdle).toHaveBeenCalledTimes(2);
  expect(onExpire).not.toHaveBeenCalled();
});

test('waking a suspended tab after expiry cannot revive its session', () => {
  const onIdle = jest.fn();
  const onExpire = jest.fn();
  render(<Harness enabled onIdle={onIdle} onExpire={onExpire} />);
  act(() => jest.setSystemTime(Date.now() + IDLE_LOGOUT_DELAY + 1000));
  fireEvent.mouseMove(window);
  expect(onExpire).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(window, { key: 'a' });
  expect(onExpire).toHaveBeenCalledTimes(1);
});

test('disabling or unmounting cleans up timers and listeners', () => {
  const onIdle = jest.fn();
  const onExpire = jest.fn();
  const view = render(<Harness enabled onIdle={onIdle} onExpire={onExpire} />);
  view.rerender(<Harness enabled={false} onIdle={onIdle} onExpire={onExpire} />);
  act(() => jest.advanceTimersByTime(IDLE_LOGOUT_DELAY));
  expect(onIdle).not.toHaveBeenCalled();
  expect(onExpire).not.toHaveBeenCalled();
});
