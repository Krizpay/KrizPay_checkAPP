import { useState, useEffect } from "react";
import { connectWallet, getBalance, getAccount } from "@/lib/web3";

export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setIsConnected(false);
      setAddress("");
      setBalance(0);
    } else {
      setAddress(accounts[0]);
      updateBalance(accounts[0]);
    }
  };

  const checkConnection = async () => {
    try {
      const account = await getAccount();
      if (account) {
        setIsConnected(true);
        setAddress(account);
        await updateBalance(account);
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
    }
  };

  const updateBalance = async (walletAddress: string) => {
    try {
      const walletBalance = await getBalance(walletAddress);
      setBalance(walletBalance);
    } catch (error) {
      console.error("Error getting balance:", error);
    }
  };

  const connect = async () => {
    try {
      setIsLoading(true);
      const account = await connectWallet();
      setIsConnected(true);
      setAddress(account);
      await updateBalance(account);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAddress("");
    setBalance(0);
  };

  return {
    isConnected,
    address,
    balance,
    isLoading,
    connect,
    disconnect,
  };
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
