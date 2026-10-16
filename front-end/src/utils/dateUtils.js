

/** Format a Date as a LOCAL YYYY-MM-DD string (no UTC shift). */
export function toLocalISODate(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Today's date as a LOCAL YYYY-MM-DD string. */
export function todayISO() {
  return toLocalISODate(new Date());
}


export function shiftISODate(isoDate, deltaDays) {
  const [y, m, d] = String(isoDate).split('-').map(Number);
  if (!y || !m || !d) return todayISO();
  const dt = new Date(y, m - 1, d);       
  dt.setDate(dt.getDate() + deltaDays);   
  return toLocalISODate(dt);
}
