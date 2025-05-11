"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import {
  switchToRootstockTestnet,
  sendTransaction as sendTx,
  ROOTSTOCK_TESTNET_CHAIN_ID
} from '@/lib/wallet-connector';

interface WalletContextType {
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  account: string | null;
  chainId: number | undefined;
  provider: ethers.providers.Web3Provider | null;
  balance: string;
  sendTransaction: (toAddress: string, amount: string) => Promise<any>;
  error: Error | null;
}

const WalletContext = createContext<WalletContextType>({
  connect: async () => {},
  disconnect: () => {},
  isConnected: false,
  isConnecting: false,
  account: null,
  chainId: undefined,
  provider: null,
  balance: '0',
  sendTransaction: async () => ({}),
  error: null,
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [balance, setBalance] = useState('0');
  const [error, setError] = useState<Error | null>(null);

  // Initialize provider and check if already connected
  useEffect(() => {
    const initProvider = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          // Create provider
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(provider);

          // Check if already connected
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);

            // Get chain ID
            const network = await provider.getNetwork();
            setChainId(network.chainId);

            // Switch to Rootstock if needed
            if (network.chainId !== ROOTSTOCK_TESTNET_CHAIN_ID) {
              await switchToRootstockTestnet();
            }
          }
        } catch (error) {
          console.error('Error initializing provider:', error);
        }
      }
    };

    initProvider();
  }, []);

  // Set up event listeners for account and chain changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setIsConnected(false);
          setAccount(null);
          setBalance('0');
        } else {
          // Account changed
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);

        // Reload if chain changed
        if (newChainId !== ROOTSTOCK_TESTNET_CHAIN_ID) {
          switchToRootstockTestnet().catch(console.error);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Update balance when account changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (account && provider) {
        try {
          const balance = await provider.getBalance(account);
          setBalance(ethers.utils.formatEther(balance));
        } catch (error) {
          console.error('Error fetching balance:', error);
          setBalance('0');
        }
      } else {
        setBalance('0');
      }
    };

    fetchBalance();

    // Set up interval to refresh balance
    const intervalId = setInterval(fetchBalance, 10000);
    return () => clearInterval(intervalId);
  }, [account, provider]);

  // Connect wallet
  const connect = async () => {
    if (isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error('No Ethereum wallet detected. Please install MetaMask.');
      }

      // Request accounts
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      setAccount(accounts[0]);
      setProvider(provider);
      setIsConnected(true);

      // Switch to Rootstock Testnet
      await switchToRootstockTestnet();

      // Get chain ID
      const network = await provider.getNetwork();
      setChainId(network.chainId);
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setError(error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet (this doesn't actually disconnect the wallet, just clears the state)
  const disconnect = () => {
    setIsConnected(false);
    setAccount(null);
    setBalance('0');
  };

  // Send transaction
  const sendTransaction = async (toAddress: string, amount: string) => {
    if (!provider || !isConnected || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      return await sendTx(provider, toAddress, amount);
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        connect,
        disconnect,
        isConnected,
        isConnecting,
        account,
        chainId,
        provider,
        balance,
        sendTransaction,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
