import { Provider, web3 } from '@project-serum/anchor';
import { Transaction, Keypair, clusterApiUrl, Cluster } from '@solana/web3.js';
import {
  fetchStrangemoodProgram,
  MAINNET,
  TESTNET,
} from '@strangemood/strangemood';
import { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import initMiddleware from '../../../lib/initMiddleware';
import Cors from 'cors';

// Initialize the cors middleware
const cors = initMiddleware(
  // You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
  Cors({
    // Only allow requests with GET, POST and OPTIONS
    methods: ['GET', 'POST', 'OPTIONS'],
    origin: '*',
  })
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

  // res.setHeader('Access-Control-Allow-Origin', '*');

  const pubkey = req.query['pubkey'];
  const cluster = req.query['cluster'] || 'mainnet-beta';

  const conn = new web3.Connection(clusterApiUrl(cluster as any));
  const provider = new Provider(conn, dummyWallet(), {});

  const programId =
    cluster === 'mainnet-beta'
      ? MAINNET.STRANGEMOOD_PROGRAM_ID
      : TESTNET.STRANGEMOOD_PROGRAM_ID;
  const strangemood = await fetchStrangemoodProgram(provider);

  console.log('fetched strangemood program for:', {
    programId,
    cluster,
    url: clusterApiUrl(cluster as Cluster),
  });

  const listing = await strangemood.account.listing.fetch(pubkey as string);
  console.log('fetched listing', { ...listing });
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
    return res.status(502).send('post request to pinata failed');
    // console.error(await result.text());
    // return res.status(500).send('something went wrong');
  }

  res.status(200).send('Ok');
}
