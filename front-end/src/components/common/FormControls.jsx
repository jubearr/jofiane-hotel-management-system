import React, { createContext, forwardRef, useContext, useEffect, useId, useRef, useState } from 'react';
import './UiFeedback.css';

const FormState = createContext(null);

export function validationMessage(value, { required, type, min, max, step, minLength, maxLength, pattern, validation, disabled, readOnly, checked }) {
  if (disabled || readOnly || ['file', 'range', 'color', 'hidden'].includes(type)) return '';
  if (type === 'checkbox' || type === 'radio') return required && !checked ? 'Please select this option to continue.' : '';
  const text = String(value ?? '');
  if (required && !text.trim()) return 'This field is required.';
  if (!text) return '';
  if (maxLength && text.length > maxLength) return `Use ${maxLength} characters or fewer.`;
  if (minLength && text.length < minLength) return `Use at least ${minLength} characters.`;
  if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return 'Enter a valid email address.';
  if (type === 'tel' && (!/^[+\d\s().-]+$/.test(text) || text.replace(/\D/g, '').length < 7 || text.replace(/\D/g, '').length > 15)) return 'Enter a phone number with 7–15 digits.';
  if (type === 'number') {
    if (!Number.isFinite(Number(text))) return 'Enter a valid number.';
    if (min !== undefined && Number(text) < Number(min)) return `Enter ${min} or more.`;
    if (max !== undefined && Number(text) > Number(max)) return `Enter ${max} or less.`;
    const increment = step === 'any' ? null : Number(step ?? 1);
    if (increment > 0) {
      const units = (Number(text) - Number(min ?? 0)) / increment;
      if (Math.abs(units - Math.round(units)) > 0.000001) return increment === 1 ? 'Enter a whole number.' : `Use increments of ${increment}.`;
    }
  }
  if (['date', 'time'].includes(type)) {
    if (min && text < min) return `Choose ${min} or later.`;
    if (max && text > max) return `Choose ${max} or earlier.`;
  }
  if (pattern && !new RegExp(`^(?:${pattern})$`).test(text)) return 'Please check the format.';
  return validation?.(text) || '';
}

function createField(tag) {
  return forwardRef(function Field({ validation, helperText, onChange, onBlur, ...props }, ref) {
    const generatedId = useId();
    const id = props.id || generatedId;
    const controlRef = useRef(null);
    const form = useContext(FormState);
    const [localValue, setLocalValue] = useState(props.defaultValue ?? '');
    const [localChecked, setLocalChecked] = useState(props.defaultChecked ?? false);
    const [touched, setTouched] = useState(false);
    const value = props.value ?? localValue;
    const maxLength = props.maxLength ?? (tag === 'textarea' ? 5000 : props.type === 'search' ? 200 : tag === 'input' && ['text', 'email', 'password', 'tel', undefined].includes(props.type) ? 254 : undefined);
    const message = validationMessage(value, { ...props, checked: props.checked ?? localChecked, maxLength, validation });
    const showError = Boolean(message && (touched || form?.submitted || String(value).length));
    const setInvalid = form?.setInvalid;
    useEffect(() => {
      setInvalid?.((current) => {
        if (current[id] === Boolean(message)) return current;
        return { ...current, [id]: Boolean(message) };
      });
    }, [id, message, setInvalid]);
    useEffect(() => () => setInvalid?.((current) => {
      if (!(id in current)) return current;
      const next = { ...current }; delete next[id]; return next;
    }), [id, setInvalid]);
    useEffect(() => {
      // Associate the visible labels in existing field groups without changing their layout.
      const control = controlRef.current;
      if (!control || control.closest('label')) return;
      const group = control.closest('.form-group') || control.parentElement;
      const label = group?.querySelector('label:not([for])');
      if (label && group.querySelectorAll('input, select, textarea').length === 1) label.htmlFor = id;
    }, [id]);
    const hint = showError ? message : helperText;
    const control = React.createElement(tag, {
      ...props, id, maxLength,
      ref: (node) => { controlRef.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node; },
      className: `${props.className || ''}${showError ? ' field-invalid' : ''}`.trim(),
      'aria-invalid': showError || undefined,
      'aria-describedby': [props['aria-describedby'], hint ? `${id}-feedback` : null].filter(Boolean).join(' ') || undefined,
      onChange: (event) => { setLocalValue(event.target.value); setLocalChecked(event.target.checked); onChange?.(event); },
      onBlur: (event) => { setTouched(true); onBlur?.(event); },
    });
    return <>{control}{hint && <span id={`${id}-feedback`} className={showError ? 'field-error-text' : 'field-helper-text'} role={showError ? 'status' : undefined}>{hint}</span>}</>;
  });
}

export const Input = createField('input');
export const Select = createField('select');
export const Textarea = createField('textarea');

export function ValidatedForm({ children, onSubmit, ...props }) {
  const [invalid, setInvalid] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const isInvalid = Object.values(invalid).some(Boolean);
  return <FormState.Provider value={{ isInvalid, setInvalid, submitted }}><form {...props} noValidate onSubmit={(event) => {
    setSubmitted(true);
    if (isInvalid || !event.currentTarget.checkValidity()) {
      event.preventDefault();
      event.currentTarget.querySelector(':invalid, [aria-invalid="true"]')?.focus();
      return;
    }
    onSubmit?.(event);
  }}>{children}</form></FormState.Provider>;
}

export function SubmitButton({ disabled, children, ...props }) {
  const form = useContext(FormState);
  return <button {...props} type="submit" disabled={disabled || form?.isInvalid}>{children}</button>;
}
