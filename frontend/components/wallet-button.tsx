"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/wallet-context';
import { Wallet, Loader2 } from 'lucide-react';

interface WalletButtonProps {
  className?: string;
}

export function WalletButton({ className }: WalletButtonProps) {
  const { connect, disconnect, isConnected, isConnecting, account, balance } = useWallet();

  // Format the account address for display
  const formatAccount = (account: string | null | undefined) => {
    if (!account) return 'Unknown';
    return `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
  };

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isConnecting}
        className="flex items-center gap-2"
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : isConnected ? (
          <>
            <Wallet className="h-4 w-4" />
            <span>{formatAccount(account)}</span>
            <span className="text-xs opacity-70">
              {balance ? parseFloat(balance).toFixed(4) : '0.0000'} tRBTC
            </span>
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            <span>Connect Wallet</span>
          </>
        )}
      </Button>
    </div>
  );
}
