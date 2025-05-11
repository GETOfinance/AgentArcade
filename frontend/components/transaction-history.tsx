"use client"

import React, { useState } from 'react';
import { useTransactionHistory, Transaction } from '@/contexts/transaction-history-context';
import { Button } from '@/components/ui/button';
import { cn, moment } from '@/lib/utils';
import { ChevronDown, ChevronUp, ExternalLink, Trash2 } from 'lucide-react';

interface TransactionHistoryProps {
  className?: string;
}

export function TransactionHistory({ className }: TransactionHistoryProps) {
  const { transactions, clearTransactions } = useTransactionHistory();
  const [isExpanded, setIsExpanded] = useState(false);

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className={cn("border rounded-md p-4 mt-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 h-8"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearTransactions}
            className="p-1 h-8 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="space-y-2 mt-2">
          {transactions.map((tx) => (
            <TransactionItem key={tx.hash} transaction={tx} />
          ))}
        </div>
      )}
    </div>
  );
}

interface TransactionItemProps {
  transaction: Transaction;
}

function TransactionItem({ transaction }: TransactionItemProps) {
  const { hash, from, to, amount, timestamp, status, error } = transaction;
  
  // Format addresses for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'pending':
        return 'text-yellow-500';
      default:
        return '';
    }
  };
  
  return (
    <div className="border rounded-md p-3 text-sm">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">
            {amount} tRBTC
            <span className={cn("ml-2 font-normal", getStatusColor(status))}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          <div className="text-muted-foreground mt-1">
            From: {formatAddress(from)}
          </div>
          <div className="text-muted-foreground">
            To: {formatAddress(to)}
          </div>
          {error && (
            <div className="text-red-500 mt-1">
              Error: {error}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-muted-foreground text-xs">
            {moment(timestamp).format('MMM D, YYYY h:mm A')}
          </div>
          <a 
            href={`https://explorer.testnet.rootstock.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-blue-500 hover:text-blue-700 mt-2 text-xs"
          >
            View on Explorer
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
      </div>
    </div>
  );
}
