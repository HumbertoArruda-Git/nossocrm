/** Generates a stable ASCII camelCase key for new custom field definitions. */
export function generateCustomFieldKey(label: string): string {
  const words = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return '';
  const key = words.map((word, index) => {
    const ascii = word.toLowerCase();
    return index === 0 ? ascii : ascii.charAt(0).toUpperCase() + ascii.slice(1);
  }).join('');
  return /^[A-Za-z]/.test(key) ? key : `field${key}`;
}
