import { act, renderHook } from '@testing-library/react';
import usePageNavigation from './usePageNavigation';

afterEach(() => { delete document.startViewTransition; });

test('fallback navigation updates immediately without a delay timer', () => {
  const {result}=renderHook(()=>usePageNavigation('overview'));
  act(()=>result.current[1]('rooms'));
  expect(result.current[0]).toBe('rooms');
});

test('rapid navigation commits only the latest destination', () => {
  const updates=[];
  const skip=jest.fn();
  document.startViewTransition=jest.fn((update)=>{
    updates.push(update);
    return {skipTransition:skip,ready:Promise.resolve(),finished:Promise.resolve()};
  });
  const {result}=renderHook(()=>usePageNavigation('overview'));
  act(()=>{result.current[1]('rooms');result.current[1]('settings');});
  act(()=>updates.forEach(update=>update()));
  expect(result.current[0]).toBe('settings');
  expect(skip).toHaveBeenCalled();
});

test('security reset cancels pending animation commits', () => {
  let pending;
  document.startViewTransition=jest.fn((update)=>{
    pending=update;
    return {skipTransition:jest.fn(),ready:Promise.resolve(),finished:Promise.resolve()};
  });
  const {result}=renderHook(()=>usePageNavigation('overview'));
  act(()=>result.current[1]('settings'));
  act(()=>result.current[1]('overview',{immediate:true}));
  act(()=>pending());
  expect(result.current[0]).toBe('overview');
});
