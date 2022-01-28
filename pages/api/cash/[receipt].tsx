import { Provider, web3 } from '@project-serum/anchor';
import { clusterApiUrl, PublicKey } from '@solana/web3.js';
import {
  cash,
  fetchStrangemoodProgram,
  MAINNET,
  TESTNET,
} from '@strangemood/strangemood';
import { NextApiRequest, NextApiResponse } from 'next';
import { cashierWallet } from '../../../lib/cashierWallet';

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

  const { tx } = await cash({
    program,
    signer: provider.wallet.publicKey,
    receipt: {
      publicKey: receiptPubkey,
      account: receipt as any,
    },
  });

  const signature = await program.provider.send(tx);
  return res.json({
    signature,
  });
}
