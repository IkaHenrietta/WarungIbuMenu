
const CURRENCY = 'RM';

export function formatPrice(value) {
  return `${CURRENCY}${Number(value).toFixed(2)}`;
}