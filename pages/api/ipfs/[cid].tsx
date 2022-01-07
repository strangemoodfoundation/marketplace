import { Provider, web3 } from '@project-serum/anchor';
import { Transaction, Keypair, clusterApiUrl } from '@solana/web3.js';
import { fetchStrangemoodProgram } from '@strangemood/strangemood';
import { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { CLUSTER } from '../../../lib/constants';
import initMiddleware from '../../../lib/initMiddleware';
import Cors from 'cors';

// // Initialize the cors middleware
// const cors = initMiddleware(
//   // You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
//   Cors({
//     // Only allow requests with GET, POST and OPTIONS
//     methods: ['GET', 'POST', 'OPTIONS'],
//   })
// );

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
  const response = await fetch(
    'https://ipfs.rebasefoundation.org/api/v0/cat?arg=' + req.query.cid,
    {
      method: 'POST',
    }
  );

  res.json(await response.json());
}
