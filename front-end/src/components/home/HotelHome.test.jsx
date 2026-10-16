import { fireEvent, render, screen, within } from '@testing-library/react';
import HotelHome from './HotelHome';

beforeEach(() => { Element.prototype.scrollIntoView=jest.fn(); });

test('animated menu supports escape, focus restoration, and immediate portal access', () => {
  const onReturn=jest.fn();
  render(<HotelHome onReturn={onReturn} />);
  const trigger=screen.getByRole('button',{name:'Open hotel menu'});
  fireEvent.click(trigger);
  const menu=screen.getByRole('dialog');
  expect(within(menu).getByRole('button',{name:'Close hotel menu'})).toHaveFocus();
  fireEvent.click(within(menu).getByRole('button',{name:'Return to Employee Portal'}));
  expect(onReturn).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(document,{key:'Escape'});
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

test('pause motion stops the showcase animations and keeps section navigation available', () => {
  const {container}=render(<HotelHome onReturn={()=>{}} />);
  fireEvent.click(screen.getByRole('button',{name:/pause motion/i}));
  expect(container.firstChild).toHaveClass('hotel-motion-paused');
  expect(container.firstChild).toHaveAttribute('data-motion', 'paused');
  fireEvent.click(screen.getByRole('link',{name:'Our rooms'}));
  expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({behavior:'auto',block:'start'});
  fireEvent.click(screen.getByRole('button',{name:/play motion/i}));
  expect(container.firstChild).toHaveAttribute('data-motion', 'running');
});

test('reduced-motion starts paused but explicit Play enables motion and smooth navigation', () => {
  const original = window.matchMedia;
  const preference = { matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() };
  window.matchMedia = jest.fn(() => preference);
  try {
    const view = render(<HotelHome onReturn={() => {}} />);
    expect(view.container.firstChild).toHaveAttribute('data-motion', 'paused');
    fireEvent.click(screen.getByRole('button', { name: /play motion/i }));
    expect(view.container.firstChild).toHaveAttribute('data-motion', 'running');
    fireEvent.click(screen.getByRole('link', { name: 'Our rooms' }));
    expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'start' });
    view.unmount();
    expect(preference.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  } finally { window.matchMedia = original; }
});

test('background tabs suspend motion without changing the visitor pause choice', () => {
  const original = Object.getOwnPropertyDescriptor(document, 'hidden');
  try {
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    const { container } = render(<HotelHome onReturn={() => {}} />);
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    fireEvent(document, new Event('visibilitychange'));
    expect(container.firstChild).toHaveAttribute('data-motion', 'paused');
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    fireEvent(document, new Event('visibilitychange'));
    expect(container.firstChild).toHaveAttribute('data-motion', 'running');
    fireEvent.click(screen.getByRole('button', { name: /pause motion/i }));
    fireEvent(document, new Event('visibilitychange'));
    expect(container.firstChild).toHaveAttribute('data-motion', 'paused');
  } finally {
    if (original) Object.defineProperty(document, 'hidden', original);
    else delete document.hidden;
  }
});

test('leaving the hotel restores page classes even without IntersectionObserver', () => {
  const observer = window.IntersectionObserver;
  window.IntersectionObserver = undefined;
  try {
    const view = render(<HotelHome onReturn={() => {}} />);
    expect(document.body).toHaveClass('hotel-home-active');
    view.unmount();
    expect(document.body).not.toHaveClass('hotel-home-active');
    expect(document.documentElement).not.toHaveClass('hotel-home-active');
  } finally { window.IntersectionObserver = observer; }
});
