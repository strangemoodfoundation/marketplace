import { Keypair } from '@solana/web3.js';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Returns the public key of the current cashier.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let private_key = process.env.PRIVATE_KEY;
  if (!private_key) {
    throw new Error('Unexpectedly did not find process.env.SOLANA_KEYPAIR');
  }
  const keypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(private_key))
  );

  return {
    publicKey: keypair.publicKey,
  };
}
