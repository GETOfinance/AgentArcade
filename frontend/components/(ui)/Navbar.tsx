"use client";

import { useRouter } from "next/navigation";
import { useContext } from "react";
import { WalletContext } from "@/context/appkit";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const router = useRouter();
  const { isConnected, address, connect, disconnect } = useContext(WalletContext);

  // Function to truncate address for display
  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex justify-between mx-16 mb-8 border-b-2 border-gray-900 pb-4 sticky bg-black top-0 py-8 z-10">
      <div className="flex gap-8">
        <h1 className="text-2xl font-bold cursor-pointer" onClick={() => router.push("/")}>
          Agent Arcade
        </h1>
        <div className="flex gap-4">
          <h3 className="text-lg pt-1 cursor-pointer" onClick={() => router.push("/")}>
            Dashboard
          </h3>
          <h3 className="text-lg pt-1 cursor-pointer" onClick={() => router.push("/create")}>
            Create
          </h3>
        </div>
      </div>
      <div>
        {isConnected ? (
          <div className="flex items-center gap-2">
            <span className="text-sm bg-green-800 px-3 py-1 rounded-full">
              {truncateAddress(address)}
            </span>
            <Button variant="outline" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button onClick={connect}>
            Connect Wallet
          </Button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
