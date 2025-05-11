"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  status: 'success' | 'failed' | 'pending';
  error?: string;
}

interface TransactionHistoryContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  clearTransactions: () => void;
}

const TransactionHistoryContext = createContext<TransactionHistoryContextType>({
  transactions: [],
  addTransaction: () => {},
  clearTransactions: () => {},
});

export const useTransactionHistory = () => useContext(TransactionHistoryContext);

const STORAGE_KEY = 'agent-arcade-transactions';

export const TransactionHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load transactions from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTransactions = localStorage.getItem(STORAGE_KEY);
      if (storedTransactions) {
        try {
          setTransactions(JSON.parse(storedTransactions));
        } catch (error) {
          console.error('Error parsing stored transactions:', error);
        }
      }
    }
  }, []);

  // Save transactions to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined' && transactions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions]);

  const addTransaction = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  };

  const clearTransactions = () => {
    setTransactions([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <TransactionHistoryContext.Provider
      value={{
        transactions,
        addTransaction,
        clearTransactions,
      }}
    >
      {children}
    </TransactionHistoryContext.Provider>
  );
};
