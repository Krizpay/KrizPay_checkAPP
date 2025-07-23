// Web3 utilities for wallet connection and transactions

export const connectWallet = async (): Promise<string> => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed. Please install MetaMask to continue.");
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (accounts.length === 0) {
      throw new Error("No accounts found. Please create or import an account in MetaMask.");
    }

    // Switch to Polygon network if not already connected
    await switchToPolygon();

    return accounts[0];
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error("User rejected the connection request.");
    }
    throw error;
  }
};

export const getAccount = async (): Promise<string | null> => {
  if (!window.ethereum) {
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error("Error getting accounts:", error);
    return null;
  }
};

export const getBalance = async (address: string): Promise<number> => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    // USDT contract address on Polygon
    const usdtContractAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
    
    // Simple balance check - in a real implementation, you'd use a proper Web3 library
    // For demo purposes, return a mock balance
    return 25.67;
  } catch (error) {
    console.error("Error getting balance:", error);
    return 0;
  }
};

export const switchToPolygon = async (): Promise<void> => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x89" }], // Polygon mainnet
    });
  } catch (error: any) {
    // Chain not added to MetaMask
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x89",
              chainName: "Polygon Mainnet",
              nativeCurrency: {
                name: "MATIC",
                symbol: "MATIC",
                decimals: 18,
              },
              rpcUrls: ["https://polygon-rpc.com/"],
              blockExplorerUrls: ["https://polygonscan.com/"],
            },
          ],
        });
      } catch (addError) {
        throw new Error("Failed to add Polygon network to MetaMask");
      }
    } else {
      throw error;
    }
  }
};

export const sendUSDT = async (
  toAddress: string,
  amount: number,
  fromAddress: string
): Promise<string> => {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  try {
    // In a real implementation, you would:
    // 1. Create a contract instance for USDT
    // 2. Call the transfer function
    // 3. Return the transaction hash
    
    // For demo purposes, simulate a successful transaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `0x${Math.random().toString(16).slice(2)}${"0".repeat(40)}`;
  } catch (error) {
    console.error("Error sending USDT:", error);
    throw error;
  }
};
