import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { Wallet } from "lucide-react";

export function WalletConnection() {
  const { isConnected, address, connect, disconnect } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Button
      onClick={isConnected ? disconnect : connect}
      variant={isConnected ? "outline" : "default"}
      size="sm"
      className="flex items-center space-x-2"
    >
      <Wallet className="w-4 h-4" />
      <span>
        {isConnected ? formatAddress(address!) : "Connect Wallet"}
      </span>
    </Button>
  );
}
