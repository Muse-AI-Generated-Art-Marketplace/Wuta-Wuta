// src/hooks/useLiveEngine.ts
import { useEffect } from 'react';
import { ethers } from 'ethers';
import { useActivityStore } from '../store/useActivityStore';

const MUSE_NFT_TRANSFER_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
];

export const useLiveEngine = (contractAddress: string) => {
  const addActivity = useActivityStore((state) => state.addActivity);

  useEffect(() => {
    const websocketRpcUrl = process.env.REACT_APP_WSS_RPC_URL;
    if (!websocketRpcUrl || !contractAddress) {
      return undefined;
    }

    const provider = new ethers.WebSocketProvider(websocketRpcUrl);
    const contract = new ethers.Contract(contractAddress, MUSE_NFT_TRANSFER_ABI, provider);

    const handleTransfer = (from: string, to: string, tokenId: any, event: any) => {
      const isMint = from === ethers.ZeroAddress;
      
      addActivity({
        id: event.transactionHash,
        chain: 'EVM',
        type: isMint ? 'MINT' : 'TRADE',
        from,
        to,
        tokenId: tokenId.toString(),
        timestamp: Date.now(),
      });
    };

    contract.on("Transfer", handleTransfer);

    return () => {
      contract.off("Transfer", handleTransfer);
      provider.destroy();
    };
  }, [contractAddress, addActivity]);
};
