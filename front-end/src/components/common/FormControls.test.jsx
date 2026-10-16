import { fireEvent, render, screen } from '@testing-library/react';
import { Input, Select, SubmitButton, ValidatedForm, validationMessage } from './FormControls';

test.each([
  ['   ', {required:true}, 'required'],
  ['wrong@', {type:'email'}, 'email'],
  ['123', {type:'tel'}, '7–15'],
  ['-1', {type:'number',min:0}, '0 or more'],
  ['1.5', {type:'number'}, 'whole number'],
  ['2026-09-16', {type:'date',min:'2026-09-17'}, 'later'],
])('validates %s with helpful feedback', (value, rules, expected) => {
  expect(validationMessage(value,rules)).toContain(expected);
});

test('accepts decimal amounts and optional empty fields', () => {
  expect(validationMessage('23.50',{type:'number',min:0,step:.01})).toBe('');
  expect(validationMessage('',{type:'email'})).toBe('');
});

test('submit is disabled until fields are valid, then forwards submission', () => {
  const save = jest.fn((event) => event.preventDefault());
  render(<ValidatedForm onSubmit={save}>
    <label>Email<Input required type="email" /></label>
    <label>Category<Select required defaultValue=""><option value="">Choose category</option><option>Guest request</option></Select></label>
    <SubmitButton>Save</SubmitButton>
  </ValidatedForm>);
  expect(screen.getByRole('button',{name:'Save'})).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Email'),{target:{value:'bad'}});
  expect(screen.getByLabelText(/^Email/)).toHaveAttribute('aria-invalid','true');
  expect(screen.getByRole('status')).toHaveTextContent('Enter a valid email address.');
  fireEvent.change(screen.getByLabelText(/^Email/),{target:{value:'test@example.com'}});
  fireEvent.change(screen.getByLabelText('Category'),{target:{value:'Guest request'}});
  expect(screen.getByRole('button',{name:'Save'})).toBeEnabled();
  fireEvent.click(screen.getByRole('button',{name:'Save'}));
  expect(save).toHaveBeenCalledTimes(1);
});

test('invalid manual submissions do not reach the submit handler', () => {
  const save=jest.fn();
  render(<ValidatedForm aria-label="Entry" onSubmit={save}><label>Title<Input required /></label><SubmitButton>Save</SubmitButton></ValidatedForm>);
  fireEvent.submit(screen.getByRole('form',{name:'Entry'}));
  expect(save).not.toHaveBeenCalled();
  expect(screen.getByLabelText(/^Title/)).toHaveFocus();
});
