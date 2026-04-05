import { formatAmount, fmtDate, fmtDateTime } from '../format';

describe('formatAmount', () => {
  test('formats whole rupees with decimals', () => {
    expect(formatAmount(1000)).toBe('₹1,000.00');
  });

  test('formats zero correctly', () => {
    expect(formatAmount(0)).toBe('₹0.00');
  });

  test('handles undefined/null gracefully', () => {
    expect(formatAmount(undefined)).toBe('₹0.00');
    expect(formatAmount(null)).toBe('₹0.00');
  });

  test('formats large amounts with Indian grouping', () => {
    expect(formatAmount(100000)).toBe('₹1,00,000.00');
  });
});

describe('fmtDate', () => {
  test('returns em dash for null/undefined', () => {
    expect(fmtDate(null)).toBe('—');
    expect(fmtDate(undefined)).toBe('—');
  });

  test('formats a valid ISO date string', () => {
    const result = fmtDate('2024-01-15T10:30:00.000Z');
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/2024/);
  });
});
