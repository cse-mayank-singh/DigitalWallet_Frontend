/**
 * Returns true if the error represents a missing/inactive wallet (404 or known messages).
 * Used to show the NoWalletBanner instead of a generic error toast.
 */
export function isWalletNotFound(err: unknown): boolean {
  const e = err as any;
  const status: number = e?.response?.status;
  const msg: string = (e?.response?.data?.message || '').toLowerCase();
  return (
    status === 404 ||
    msg.includes('wallet not found') ||
    msg.includes('wallet does not exist') ||
    msg.includes('no wallet') ||
    msg.includes('wallet not activated') ||
    msg.includes('wallet inactive')
  );
}
