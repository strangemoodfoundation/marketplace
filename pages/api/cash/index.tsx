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
 * Returns the public key of the current cashier on get,
 * cashes all receipts it can find on post.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const wallet = cashierWallet();
  if (req.method == 'GET') {
    return res.json({
      publicKey: wallet.publicKey.toString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(400);
  }

  const cluster = req.query['cluster'] || 'mainnet-beta';
  const conn = new web3.Connection(clusterApiUrl(cluster as any));
  const provider = new Provider(conn, cashierWallet(), {});

  const programId =
    cluster === 'mainnet-beta'
      ? MAINNET.strangemood_program_id
      : TESTNET.strangemood_program_id;
  const program = await fetchStrangemoodProgram(provider, programId);

  // This is super inefficient, and at some point we should
  // switch it to a filter; but binary filters are hard
  const receipts = await program.account.receipt.all();

  let cashed = 0;
  for (let receipt of receipts) {
    if (receipt.account.cashier.toString() === wallet.publicKey.toString()) {
      if (!receipt.account.isCashable) {
        console.log('skipping', receipt.publicKey.toString());
        continue;
      }

      const { tx } = await cash({
        program,
        signer: provider.wallet.publicKey,
        receipt: receipt,
      });
      console.log('Cashing receipt:', receipt.publicKey.toString());

      await program.provider.send(tx);
      cashed++;
    }
  }

  return res.json({
    cashed: cashed,
  });
}
