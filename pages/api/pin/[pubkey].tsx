import { Provider, web3 } from '@project-serum/anchor';
import { Transaction, Keypair, clusterApiUrl } from '@solana/web3.js';
import { fetchStrangemoodProgram, MAINNET } from '@strangemood/strangemood';
import { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import initMiddleware from '../../../lib/initMiddleware';
import Cors from 'cors';

// Initialize the cors middleware
const cors = initMiddleware(
  // You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
  Cors()
);

function dummyWallet() {
  return {
    signTransaction: async (tx: Transaction): Promise<Transaction> => {
      throw new Error("Can't be used to sign");
    },
    signAllTransactions: (txs: Transaction[]): Promise<Transaction[]> => {
      throw new Error("Can't be used to sign");
    },
    publicKey: Keypair.generate().publicKey,
  };
}

/**
 * Takess a public key of a listing and pins the CID of the
 * metadata associated with it.
 *
 * Uses pinata as a pinning service for this demo for simplicity.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST')
    return res.status(400).send(`No ${req.method}. Only POST`);

  // Run cors
  await cors(req, res);

  const pubkey = req.query['pubkey'];
  const cluster = req.query['cluster'] || 'mainnet-beta';

  const conn = new web3.Connection(clusterApiUrl(cluster as any));
  const provider = new Provider(conn, dummyWallet(), {});

  const strangemood = await fetchStrangemoodProgram(
    provider,
    MAINNET.STRANGEMOOD_PROGRAM_ID
  );

  const listing = await strangemood.account.listing.fetch(pubkey as string);
  const uri = (listing.uri as string) || '';
  if (!(listing.uri as string).startsWith('ipfs://'))
    return res.status(200).send('Not an IPFS url, ignoring');

  const cid = uri.replace('ipfs://', '');

  if (
    !process.env.IPFS_PINNING_SERVICE_TOKEN &&
    process.env.NODE_ENV === 'production'
  ) {
    throw new Error(
      'Unexpectedly did not find IPFS_PINNING_SERVICE_TOKEN in production'
    );
  }

  const result = await fetch('https://api.pinata.cloud/psa/pins', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: ('Bearer ' +
        process.env.IPFS_PINNING_SERVICE_TOKEN) as string,
    },
    body: JSON.stringify({
      cid,
    }),
  });
  if (result.status !== 200) {
    console.error(await result.text());
    return res.status(500).send('something went wrong');
  }

  res.status(200).send('Ok');
}
