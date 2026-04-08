import { describe, test, expect } from 'vitest';
import { isWalletNotFound } from '../wallet';
//npm run test:ui
describe('isWalletNotFound', () => {
  test('returns true for HTTP 404 status', () => {
    expect(isWalletNotFound({ response: { status: 404, data: { message: '' } } })).toBe(true);
  });

  test('returns true for "wallet not found" message', () => {
    expect(isWalletNotFound({ response: { status: 200, data: { message: 'Wallet not found' } } })).toBe(true);
  });

  test('returns true for "wallet does not exist" message', () => {
    expect(isWalletNotFound({ response: { status: 200, data: { message: 'wallet does not exist' } } })).toBe(true);
  });

  test('returns true for "wallet inactive" message', () => {
    expect(isWalletNotFound({ response: { status: 200, data: { message: 'wallet inactive' } } })).toBe(true);
  });

  test('returns true for "no wallet" message', () => {
    expect(isWalletNotFound({ response: { status: 200, data: { message: 'no wallet found' } } })).toBe(true);
  });

  test('returns false for 500 server error', () => {
    expect(isWalletNotFound({ response: { status: 500, data: { message: 'Server error' } } })).toBe(false);
  });

  test('returns false for unrelated 200 response', () => {
    expect(isWalletNotFound({ response: { status: 200, data: { message: 'Success' } } })).toBe(false);
  });

  test('returns false for empty object', () => {
    expect(isWalletNotFound({})).toBe(false);
  });

  test('returns false for null', () => {
    expect(isWalletNotFound(null)).toBe(false);
  });
});