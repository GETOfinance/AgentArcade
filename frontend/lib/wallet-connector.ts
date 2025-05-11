import { InjectedConnector } from '@web3-react/injected-connector';
import { ethers } from 'ethers';

// Rootstock Testnet Chain ID
export const ROOTSTOCK_TESTNET_CHAIN_ID = 31;

// Supported chain IDs
export const supportedChainIds = [ROOTSTOCK_TESTNET_CHAIN_ID];

// Injected connector for MetaMask and other browser wallets
export const injectedConnector = new InjectedConnector({
  supportedChainIds,
});

// Network configuration for Rootstock Testnet
export const ROOTSTOCK_TESTNET_CONFIG = {
  chainId: `0x${ROOTSTOCK_TESTNET_CHAIN_ID.toString(16)}`,
  chainName: 'Rootstock Testnet',
  nativeCurrency: {
    name: 'tRBTC',
    symbol: 'tRBTC',
    decimals: 18,
  },
  rpcUrls: ['https://public-node.testnet.rsk.co'],
  blockExplorerUrls: ['https://explorer.testnet.rootstock.io'],
};

// Function to add Rootstock Testnet to MetaMask
export const addRootstockTestnetToMetaMask = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [ROOTSTOCK_TESTNET_CONFIG],
    });
    return true;
  } catch (error) {
    console.error('Error adding Rootstock Testnet to MetaMask:', error);
    throw error;
  }
};

// Function to switch to Rootstock Testnet
export const switchToRootstockTestnet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ROOTSTOCK_TESTNET_CONFIG.chainId }],
    });
    return true;
  } catch (error: any) {
    // If the chain hasn't been added to MetaMask
    if (error.code === 4902) {
      return addRootstockTestnetToMetaMask();
    }
    console.error('Error switching to Rootstock Testnet:', error);
    throw error;
  }
};

// Function to send a transaction
export const sendTransaction = async (
  provider: ethers.providers.Web3Provider,
  toAddress: string,
  amount: string
) => {
  try {
    // Validate provider
    if (!provider || typeof provider.getSigner !== 'function') {
      throw new Error('Invalid provider');
    }

    // Validate the address
    if (!ethers.utils.isAddress(toAddress)) {
      throw new Error('Invalid address');
    }

    // Validate the amount
    let amountInWei;
    try {
      amountInWei = ethers.utils.parseEther(amount);
      if (amountInWei.lte(0)) {
        throw new Error('Amount must be greater than 0');
      }
    } catch (error) {
      throw new Error(`Invalid amount: ${amount}`);
    }

    // Get the signer
    let signer;
    try {
      signer = provider.getSigner();
    } catch (error) {
      console.error('Error getting signer:', error);
      throw new Error('Failed to get signer from wallet');
    }

    // Get the from address
    let fromAddress;
    try {
      fromAddress = await signer.getAddress();
    } catch (error) {
      console.error('Error getting address:', error);
      throw new Error('Failed to get address from wallet');
    }

    // Check if the user has enough balance
    let balance;
    try {
      balance = await provider.getBalance(fromAddress);
      if (balance.lt(amountInWei)) {
        throw new Error(`Insufficient balance. You have ${ethers.utils.formatEther(balance)} tRBTC but trying to send ${amount} tRBTC`);
      }
    } catch (error) {
      if (error.message.includes('Insufficient balance')) {
        throw error;
      }
      console.error('Error checking balance:', error);
      throw new Error('Failed to check balance');
    }

    // Create the transaction
    const tx = {
      from: fromAddress,
      to: toAddress,
      value: amountInWei,
      gasLimit: ethers.utils.hexlify(21000), // Basic transaction gas limit
    };

    // Send the transaction
    let txResponse;
    try {
      txResponse = await signer.sendTransaction(tx);
    } catch (error) {
      console.error('Error sending transaction:', error);
      // Handle user rejected transaction
      if (error.code === 4001) {
        throw new Error('Transaction rejected by user');
      }
      throw new Error('Failed to send transaction');
    }

    // Wait for the transaction to be mined
    let receipt;
    try {
      receipt = await txResponse.wait();
    } catch (error) {
      console.error('Error waiting for transaction:', error);
      throw new Error('Transaction was sent but failed to be mined');
    }

    return {
      success: true,
      hash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      from: receipt.from,
      to: receipt.to,
      amount: ethers.utils.formatEther(amountInWei),
    };
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw error;
  }
};

// Declare ethereum property on window
declare global {
  interface Window {
    ethereum: any;
  }
}
