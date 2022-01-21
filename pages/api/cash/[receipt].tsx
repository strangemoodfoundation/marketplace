import { Program, Provider, web3 } from '@project-serum/anchor';
import {
  Transaction,
  Keypair,
  clusterApiUrl,
  PublicKey,
} from '@solana/web3.js';
import { cash, fetchStrangemoodProgram } from '@strangemood/strangemood';
import { MAINNET, TESTNET } from '@strangemood/strangemood/dist/src/constants';
import { NextApiRequest, NextApiResponse } from 'next';

function cashierWallet() {
  let private_key = process.env.PRIVATE_KEY;
  if (!private_key) {
    throw new Error('Unexpectedly did not find process.env.SOLANA_KEYPAIR');
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

/**
 * Cashes a reciept
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    return res.status(400).send(`No ${req.method}. Only POST`);

  const pubkey = req.query['receipt'];
  const cluster = req.query['cluster'] || 'mainnet-beta';

  const conn = new web3.Connection(clusterApiUrl(cluster as any));
  const provider = new Provider(conn, cashierWallet(), {});

  const programId =
    cluster === 'mainnet-beta'
      ? MAINNET.strangemood_program_id
      : TESTNET.strangemood_program_id;
  const program = await fetchStrangemoodProgram(provider, programId);

  let receiptPubkey = new PublicKey(pubkey);
  const receipt = await program.account.receipt.fetch(receiptPubkey);
  const listing = await program.account.listing.fetch(receipt.listing);

  const { tx } = await cash({
    program,
    conn,
    signer: provider.wallet.publicKey,
    receipt: {
      publicKey: receiptPubkey,
      account: receipt as any,
    },
    listing: {
      publicKey: receipt.listing,
      account: listing,
    },
  });

  const signature = await program.provider.send(tx);
  return {
    signature,
  };
}
