import { BN, Program } from '@project-serum/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  fetchStrangemoodProgram,
  MAINNET,
  pda,
  Strangemood,
  initListing,
} from '@strangemood/strangemood';
import { CID, create, urlSource } from 'ipfs-http-client';
import { FormEvent, useRef, useState } from 'react';
import Login from '../components/Login';
import { OpenMetaGraph } from '../lib/omg';
import { useAnchorProvider } from '../lib/useAnchor';
import useSWR from 'swr';
import { SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { useRouter } from 'next/router';

function useIpfs() {
  const client = create('https://ipfs.rebasefoundation.org/api/v0' as any);
  return client;
}

// @ts-ignore
const fetcher = (...args: any) => fetch(...args).then((res) => res.json());

function useSolPrice() {
  const { data, error } = useSWR(
    'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
    fetcher
  );

  if (!data) return 0;
  if (error) return 0;

  return data.solana.usd;
}

const LAMPORTS_PER_SOL = 1000000;

export default function Page() {
  const ipfs = useIpfs();
  const { connection } = useConnection();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  let solPrice = useSolPrice();
  const [price, setPrice] = useState<number>(
    solPrice === 0 ? 0.0001 : 0.02 / solPrice
  );
  const { publicKey, sendTransaction, connected, connecting } = useWallet();
  const provider = useAnchorProvider();
  const router = useRouter();

  async function onSave() {
    if (!publicKey) return;
    const strangemood = await fetchStrangemoodProgram(
      provider,
      MAINNET.STRANGEMOOD_PROGRAM_ID
    );

    console.log(strangemood.idl);

    const metadata: OpenMetaGraph = {
      version: '0.1.0',
      formats: [],
      elements: [
        {
          key: 'title',
          type: 'plain/text',
          value: title,
        },
        {
          key: 'description',
          type: 'plain/text',
          value: description,
        },
      ],
    };

    const { cid } = await ipfs.add(JSON.stringify(metadata));

    const {
      tx,
      signers,
      publicKey: listingPubkey,
    } = await initListing(
      strangemood as any,
      connection,
      publicKey,
      new BN(price).mul(new BN(LAMPORTS_PER_SOL)),
      'ipfs://' + cid
    );
    let sig = await sendTransaction(tx, connection, { signers });
    await provider.connection.confirmTransaction(sig);

    console.log(
      'created listing at: ',
      listingPubkey.toString(),
      ' with metadata at ',
      'ipfs://' + cid
    );

    router.push(`/listings/${listingPubkey.toString()}`);
  }

  if (!publicKey) {
    return <Login />;
  }

  const dollars = price * solPrice;

  return (
    <div className="bg-blue-50 flex h-full px-4">
      <div className="max-w-2xl bg-white p-4 border-gray-300 border-l border-r w-full m-auto flex flex-col h-full">
        <h1 className="font-bold text-xl">New Listing</h1>
        <p></p>

        <label className="flex flex-col mt-4">
          Title
          <input
            type={'text'}
            className="border border-gray-500 mt-2 rounded-sm py-1 px-2"
            placeholder="Cool Title 123"
            onChange={(e) => setTitle(e.target.value)}
            value={title}
          />
        </label>

        <label className="flex flex-col mt-4 mb-2">
          Description
          <textarea
            className="border border-gray-500 mt-2 rounded-sm py-1 px-2"
            placeholder="Some Cool Description"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
          />
        </label>

        <label className="flex flex-col mt-2 mb-4">
          Price (${dollars === Infinity ? '...' : dollars.toFixed(2)})
          <div className="flex flex-row items-center rounded-sm bg-gray-50  border">
            <input
              type={'number'}
              className=" px-2 py-2 rounded-sm flex flex-1"
              placeholder="0.01"
              onChange={(e) => setPrice(parseFloat(e.target.value))}
              value={price}
            />
            <div className="bg-gray-50 px-2 text-gray-500">SOL</div>
          </div>
        </label>

        <button
          onClick={onSave}
          className="flex w-32 border-blue-400 text-blue-700 border rounded-sm items-center justify-center hover:bg-blue-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}
