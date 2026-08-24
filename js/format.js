// All rendered numbers go through here. Polish convention: decimal comma.

const MAX_DECIMALS = 4;

export function formatNumber(n) {
  const rounded = Number(n.toFixed(MAX_DECIMALS));
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded).replace('.', ',');
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function formatFraction(num, den) {
  const divisor = gcd(num, den) || 1;
  const n = num / divisor;
  const d = den / divisor;
  if (d === 1) return String(n);
  return `${n}/${d}`;
}

export function formatMixed(num, den) {
  const divisor = gcd(num, den) || 1;
  const n = num / divisor;
  const d = den / divisor;
  if (d === 1) return String(n);
  const whole = Math.trunc(n / d);
  const rest = Math.abs(n % d);
  if (whole === 0) return `${n}/${d}`;
  return `${whole} ${rest}/${d}`;
}
