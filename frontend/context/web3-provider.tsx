"use client"

import React from 'react';
import { Web3ReactProvider } from '@web3-react/core';
import { ethers } from 'ethers';
import { WalletProvider } from '@/contexts/wallet-context';

// Function to get the library from the provider
const getLibrary = (provider: any): ethers.providers.Web3Provider => {
  if (!provider) {
    console.warn('Provider is undefined');
    // Return a minimal mock provider to prevent errors
    return {
      pollingInterval: 12000,
    } as any;
  }

  const library = new ethers.providers.Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
};

// Web3Provider component
export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <WalletProvider>
        {children}
      </WalletProvider>
    </Web3ReactProvider>
  );
};

export default Web3Provider;
