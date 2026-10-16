// API amounts can be numbers or strings with thousands separators.
export const parseMoney = value => {
  const amount = Number(String(value ?? 0).replace(/,/g, ''));
  return Number.isFinite(amount) ? amount : 0;
};

export const money = value => {
  const amount = parseMoney(value);
  return `${amount < 0 ? '−' : ''}₱${Math.abs(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
