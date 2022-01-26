import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  fetchStrangemoodProgram,
  MAINNET,
  initListing,
} from '@strangemood/strangemood';
import { useState } from 'react';
import Login from '../components/Login';
import { useAnchorProvider } from '../lib/useAnchor';
import cn from 'classnames';
import { useRouter } from 'next/router';
import { useSolPrice } from '../lib/useSolPrice';
import { Web3Storage, File, Filelike } from 'web3.storage';
import * as anchor from '@project-serum/anchor';
import { OpenMetaGraph } from 'openmetagraph';

const LAMPORTS_PER_SOL = 1000000000;

export default function CreateListing() {
  const { connection } = useConnection();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileCID, updateFileCID] = useState(``);
  let solPrice = useSolPrice();
  const [price, setPrice] = useState<number>(
    solPrice === 0 ? 0.0001 : 0.02 / solPrice
  );
  const { publicKey, sendTransaction, connected, connecting } = useWallet();
  const provider = useAnchorProvider();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function saveToWeb3Storage(web3_file: Filelike) {
    const web3Client = new Web3Storage({
      token: 'proxy_replaces',
      endpoint: new URL(
        window.location.protocol + '//' + window.location.host + '/api/web3/'
      ),
    });
    return await web3Client.put([web3_file], { wrapWithDirectory: false });
  }

  async function onSave() {
    if (!publicKey) return;
    if (!title || !description) return;

    setIsLoading(true);
    const program = await fetchStrangemoodProgram(
      provider,
      MAINNET.strangemood_program_id
    );

    const metadata: OpenMetaGraph = {
      object: 'omg',
      version: '0.1.0',
      schemas: ['ipfs://QmUmLdYHHAqDYNnRGeKbHg4pxocFV1VAZuuHuRvdNiY1Bb'],
      elements: [
        {
          key: 'name',
          object: 'string',
          value: title,
        },
        {
          key: 'description',
          object: 'string',
          value: description,
        },
        {
          key: 'image',
          object: 'file',
          uri: 'ipfs://' + fileCID,
          contentType: 'image/png',
        },
      ],
    };

    const metadataBlob = new Blob([JSON.stringify(metadata)]);
    const web3_file = new File([metadataBlob], 'data');
    const cid = await saveToWeb3Storage(web3_file);
    console.log(cid);

    const {
      tx,
      signers,
      publicKey: listingPubkey,
    } = await initListing({
      program,
      signer: provider.wallet.publicKey,
      price: new anchor.BN(price * LAMPORTS_PER_SOL),
      decimals: 0,
      uri: 'ipfs://' + cid,
      isConsumable: false,
      isRefundable: false,
      isAvailable: true,
    });

    let sig = await sendTransaction(tx, connection, { signers });
    await provider.connection.confirmTransaction(sig, 'confirmed');

    router.push(`/checkout/${listingPubkey.toString()}`);
    setIsLoading(false);
  }

  if (!publicKey) {
    return <Login />;
  }

  const dollars = price * solPrice;

  return (
    <div
      className={cn({
        'bg-blue-50 flex h-full px-4': true,
        'animate-pulse opacity-50': isLoading,
      })}
    >
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

        <label className="flex flex-col mt-2 mb-2">
          Image
          <input
            type="file"
            onChange={async (e: any) => {
              const file = e.target.files[0];
              if (!file) {
                updateFileCID(``);
                return;
              }
              try {
                const cid = await saveToWeb3Storage(file);
                console.log(cid);
                updateFileCID(cid);
              } catch (error) {
                console.log('Error uploading file: ', error);
              }
            }}
          />
          {fileCID && (
            <img className="mt-1" src={`/api/ipfs/${fileCID}`} width="600px" />
          )}
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
          disabled={!title || !description}
          onClick={onSave}
          className="flex w-32 border-blue-400 text-blue-700 border rounded-sm items-center justify-center hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
}
