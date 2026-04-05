import { isWalletNotFound } from '../wallet';

describe('isWalletNotFound', () => {
  test('returns true for 404 status', () => {
    expect(isWalletNotFound({ response: { status: 404, data: { message: '' } } })).toBe(true);
  });

  test('returns true for "wallet not found" message', () => {
    expect(isWalletNotFound({ response: { status: 200, data: { message: 'Wallet not found' } } })).toBe(true);
  });

  test('returns true for "wallet inactive" message', () => {
    expect(isWalletNotFound({ response: { status: 200, data: { message: 'wallet inactive' } } })).toBe(true);
  });

  test('returns false for other errors', () => {
    expect(isWalletNotFound({ response: { status: 500, data: { message: 'Server error' } } })).toBe(false);
  });

  test('returns false for non-error objects', () => {
    expect(isWalletNotFound({})).toBe(false);
    expect(isWalletNotFound(null)).toBe(false);
  });
});
