import { BN } from '@project-serum/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  fetchStrangemoodProgram,
  MAINNET,
  initListing,
  Listing,
  setListingUri,
} from '@strangemood/strangemood';
import { create } from 'ipfs-http-client';
import { useState } from 'react';
import Login from '../components/Login';
import { OpenMetaGraph, grabValue } from '../lib/omg';
import { useAnchorProvider } from '../lib/useAnchor';
import { useListing, useListingMetadata } from '../lib/useListing';
import cn from 'classnames';
import { useRouter } from 'next/router';
import { PublicKey } from '@solana/web3.js';
import web3Upload from '../lib/web3Util';

function useOwnsListing(listing: Listing, pubkey: PublicKey | null) {
  if (!pubkey || !listing)
    return false
  return listing.authority.toString() === pubkey.toString();
}

export default function EditListing() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected, connecting } = useWallet();
  const provider = useAnchorProvider();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const listing = useListing(provider, router.query.pubkey as string);
  const { data } = useListingMetadata(listing);
  const ownsListing = useOwnsListing(listing, publicKey);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileCID, updateFileCID] = useState(``);

  async function onSave() {
    if (!data) return;
    if (!publicKey) return;
    if (!title && !description && !fileCID) return;

    setIsLoading(true);
    const strangemood = await fetchStrangemoodProgram(
      provider,
      MAINNET.STRANGEMOOD_PROGRAM_ID
    );

    const elements = [];
    const computed_title = !title ? grabValue(data, "title") : title;
    if (computed_title)
      elements.push({
        key: 'title',
        type: 'plain/text',
        value: computed_title,
      })

    const computed_description = !title ? grabValue(data, "description") : description;
    if (computed_description)
      elements.push({
        key: 'description',
        type: 'plain/text',
        value: computed_description,
      })

    const computed_image = !fileCID ? grabValue(data, "image") : 'ipfs://' + fileCID;
    if (computed_image)
      elements.push({
        key: 'image',
        type: 'image',
        value: computed_image,
      })

    const metadata: OpenMetaGraph = {
      version: '0.1.0',
      formats: [],
      elements: elements
    };

    const metadataBlob = new Blob([JSON.stringify(metadata)]);
    const cid = await web3Upload(metadataBlob);
    console.log(cid);

    const listingPubkey = new PublicKey(router.query.pubkey as string)

    const {
      tx
    } = await setListingUri(
      strangemood as any,
      publicKey,
      listingPubkey,
      'ipfs://' + cid
    );
    let sig = await sendTransaction(tx, connection);
    await provider.connection.confirmTransaction(sig);

    router.push(`/checkout/${listingPubkey.toString()}`);
    setIsLoading(false);
  }


  if (!data || !listing) {
    // loading
    return <div></div>;
  }

  if (!publicKey) {
    return <Login />;
  }

  return (
    <div
      className={cn({
        'bg-blue-50 flex h-full px-4': true,
        'animate-pulse opacity-50': isLoading,
      })}
    >
      <div className="max-w-2xl bg-white p-4 border-gray-300 border-l border-r w-full m-auto flex flex-col gap-3 h-full">
        {!ownsListing && <div className='border p-2 bg-red-300 w-full'><a className='font-bold'>Warning:</a> You are not the owner of this listing. Attempting to edit it will fail.</div>}
        {ownsListing && <div className='border p-2 bg-green-300 w-full'>You are the owner of this listing.</div>}
        <h1 className="font-bold text-xl">Edit Listing</h1>

        <label className="flex flex-col">
          Title
          <input
            type={'text'}
            className="border border-gray-500 rounded-sm py-1 px-2"
            onChange={(e) => setTitle(e.target.value)}
            placeholder={grabValue(data, 'title')}
            value={title}
          />
        </label>

        <label className="flex flex-col">
          Description
          <textarea
            className="border border-gray-500 rounded-sm py-1 px-2"
            onChange={(e) => setDescription(e.target.value)}
            placeholder={grabValue(data, 'description')}
            value={description}
          />
        </label>

        <label className="flex flex-col">
          Image
          <input
            type="file"
            onChange={async (e: any) => {
              const file = e.target.files[0];
              if (!file) {
                updateFileCID(``);
                return
              }
              try {
                const cid = await web3Upload(file);
                console.log(cid);
                updateFileCID(cid);
              } catch (error) {
                console.log('Error uploading file: ', error);
              }
            }}
          />
          {fileCID && <img className='mt-1' src={`/api/ipfs?cid=${fileCID}`} width="600px" />}
        </label>

        <button
          disabled={!title && !description && !fileCID}
          onClick={onSave}
          className="flex w-32 border-blue-400 text-blue-700 border rounded-sm items-center justify-center hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
}
