'use client';

import { useAccount, useBalance } from 'wagmi';

export function WalletInfo() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address,
  });

  if (!isConnected) {
    return (
      <div className="text-center p-4 bg-white/10 rounded-lg">
        <p className="text-lg">Please connect your wallet to see your information</p>
      </div>
    );
  }

  return (
    <div className="text-center p-4 bg-white/10 rounded-lg">
      <h3 className="text-xl font-bold mb-2">Wallet Information</h3>
      <p className="text-sm mb-2">
        <span className="font-semibold">Address:</span> {address?.slice(0, 6)}...{address?.slice(-4)}
      </p>
      {balance && (
        <p className="text-sm">
          <span className="font-semibold">Balance:</span> {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
        </p>
      )}
    </div>
  );
} 