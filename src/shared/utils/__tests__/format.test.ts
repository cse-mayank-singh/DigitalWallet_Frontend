import { describe, test, expect } from 'vitest';
import { formatAmount, fmtDate, fmtDateTime } from '../format';
describe('formatAmount', () => {
  test('formats whole rupees with two decimals', () => {
    expect(formatAmount(1000)).toBe('₹1,000.00');
  });

  test('formats zero correctly', () => {
    expect(formatAmount(0)).toBe('₹0.00');
  });

  test('handles undefined gracefully', () => {
    expect(formatAmount(undefined)).toBe('₹0.00');
  });

  test('handles null gracefully', () => {
    expect(formatAmount(null)).toBe('₹0.00');
  });

  test('formats large amounts with Indian grouping', () => {
    expect(formatAmount(100000)).toBe('₹1,00,000.00');
  });

  test('formats decimal amounts correctly', () => {
    expect(formatAmount(99.5)).toBe('₹99.50');
  });
});

describe('fmtDate', () => {
  test('returns em dash for null', () => {
    expect(fmtDate(null)).toBe('—');
  });

  test('returns em dash for undefined', () => {
    expect(fmtDate(undefined)).toBe('—');
  });

  test('returns em dash for empty string', () => {
    expect(fmtDate('')).toBe('—');
  });

  test('formats a valid ISO date string', () => {
    const result = fmtDate('2024-01-15T10:30:00.000Z');
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/2024/);
  });
});

describe('fmtDateTime', () => {
  test('returns em dash for null', () => {
    expect(fmtDateTime(null)).toBe('—');
  });

  test('includes time in output', () => {
    const result = fmtDateTime('2024-06-01T14:30:00.000Z');
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/Jun/);
  });
});