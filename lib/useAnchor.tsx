import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Transaction, ConfirmOptions } from '@solana/web3.js';
import { Provider } from '@project-serum/anchor';

// Sets up an anchor wallet
export function useAnchorWallet(): any {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();

  return {
    signTransaction: async (tx: Transaction): Promise<Transaction> => {
      if (!signTransaction) throw new Error('Wallet is not connected');
      return signTransaction(tx);
    },
    signAllTransactions: (txs: Transaction[]): Promise<Transaction[]> => {
      if (!signAllTransactions) throw new Error('Wallet is not connected');
      return signAllTransactions(txs);
    },
    publicKey,
  };
}

export function useAnchorProvider(opts: ConfirmOptions = {}) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const provider = new Provider(connection, wallet, opts);
  return provider;
}
