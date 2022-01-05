import { BN, web3 } from '@project-serum/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  fetchStrangemoodProgram,
  initListing,
  setListingDeposits,
} from '@strangemood/strangemood';
import { create } from 'ipfs-http-client';
import { useState } from 'react';
import Login from '../components/Login';
import { OpenMetaGraph } from '../lib/omg';
import { useAnchorProvider } from '../lib/useAnchor';
import cn from 'classnames';
import { useRouter } from 'next/router';
import { useSolPrice } from '../lib/useSolPrice';
import { CLUSTER } from '../lib/constants';
import { useSharingAccount } from '../lib/useSharingAccount';
import { getStrangemoodAssociatedTokenAddress } from '../lib/useListing';
import { sendAndSign } from '../lib/util';

function useIpfs() {
  const client = create('https://ipfs.rebasefoundation.org/api/v0' as any);
  return client;
}

const LAMPORTS_PER_SOL = 1000000000;

export default function CreateListing() {
  const ipfs = useIpfs();
  const { connection } = useConnection();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  let solPrice = useSolPrice();
  const [price, setPrice] = useState<number>(
    solPrice === 0 ? 0.0001 : 0.02 / solPrice
  );
  const [splitPercent, setSplitPercent] = useState<number>(5.0);

  const wallet = useWallet();
  const provider = useAnchorProvider();
  const { initializeTx: initializeSharingAccount, getSharingAccountAddress } =
    useSharingAccount();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [imageCIDs, setImageCIDs] = useState<any[]>([]);

  async function onSave() {
    if (!wallet.publicKey) return;
    if (!title || !description) return;

    setIsLoading(true);
    const strangemood = await fetchStrangemoodProgram(
      provider,
      CLUSTER.STRANGEMOOD_PROGRAM_ID
    );

    console.log({ program: strangemood });

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

    // Trick the gateway into caching our metadata early
    // which makes the next page load faster
    fetch('https://ipfs.io/ipfs/' + cid);

    const tx = new web3.Transaction();

    // TX 1. Create Listing
    const {
      tx: createListingTx,
      signers,
      publicKey: listingPubkey,
    } = await initListing(
      strangemood as any,
      connection,
      wallet.publicKey,
      new BN(price * LAMPORTS_PER_SOL),
      'ipfs://' + cid,
      CLUSTER
    );
    tx.add(createListingTx);

    // TX 2. Create Sharing Account for Affiliate Revenue
    const { tx: initSharingTx, signers: initSharingSigners } =
      await initializeSharingAccount(splitPercent);
    tx.add(initSharingTx);

    const { associatedSolAddress, associatedVoteAddress } =
      await getStrangemoodAssociatedTokenAddress(wallet.publicKey);

    // TX 3. Update Listing's Deposit Account to use the Sharing Account
    const { tx: setTx } = await setListingDeposits(
      strangemood as any,
      wallet.publicKey,
      listingPubkey,
      associatedVoteAddress,
      await getSharingAccountAddress(listingPubkey)
    );
    tx.add(setTx);

    sendAndSign(connection, wallet, tx, [...signers, ...initSharingSigners]);

    // Pin the listing data to ensure it's kept around for a bit
    fetch('/api/pin/' + listingPubkey.toString(), {
      method: 'POST',
    });

    router.push(`/checkout/${listingPubkey.toString()}`);
    setIsLoading(false);
  }

  const [fileUrl, updateFileUrl] = useState(``);

  if (!wallet.publicKey) {
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
              try {
                const added = await ipfs.add(file);
                const url = `https://ipfs.infura.io/ipfs/${added.path}`;
                updateFileUrl(url);
              } catch (error) {
                console.log('Error uploading file: ', error);
              }
            }}
          />
          {fileUrl && <img src={fileUrl} width="600px" />}
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

        <label className="flex flex-col mt-2 mb-4">
          Affiliate Split
          <div className="flex flex-row items-center rounded-sm bg-gray-50  border">
            <input
              type={'number'}
              className=" px-2 py-2 rounded-sm flex flex-1"
              placeholder="0.01"
              onChange={(e) => setSplitPercent(parseFloat(e.target.value))}
              value={splitPercent}
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
