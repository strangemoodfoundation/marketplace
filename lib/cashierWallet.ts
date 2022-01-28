import { Keypair, Transaction } from '@solana/web3.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

export function cashierWallet() {
  let private_key = process.env.CASHIER_KEYPAIR;

  if (!private_key) {
    // In development, we can use a local filesystem wallet
    if (process.env.NODE_ENV !== 'production') {
      console.log('Using a local wallet to cash receipts.');

      try {
        private_key = fs.readFileSync(
          path.join(os.homedir(), '.config', 'solana', 'id.json'),
          'utf8'
        );
      } catch (err) {
        throw new Error(
          'Attempted to use a filesystem wallet for cashing receipts, but cannot find the wallet:\n\n' +
            err
        );
      }
    } else {
      throw new Error(
        'Unexpectedly did not find process.env.CASHIER_KEYPAIR in production'
      );
    }
  }
  const keypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(private_key))
  );

  return {
    signTransaction: async (tx: Transaction): Promise<Transaction> => {
      tx.sign(keypair);
      return tx;
    },
    signAllTransactions: async (txs: Transaction[]): Promise<Transaction[]> => {
      txs.forEach((tx) => tx.sign(keypair));
      return txs;
    },
    publicKey: keypair.publicKey,
  };
}
