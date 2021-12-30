import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { CID, create, urlSource } from 'ipfs-http-client';
import { FormEvent, useRef, useState } from 'react';
import Login from '../components/Login';

function useIpfs() {
  const client = create('https://ipfs.rebasefoundation.org/api/v0' as any);
  return client;
}

export default function Page() {
  const ipfs = useIpfs();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { publicKey, sendTransaction, connected } = useWallet();

  function onSave() {
    // Create metadata
    // Upload metadata
    // [later] Pin metadata
    // Create listing
  }

  if (!connected) {
    // "loading"
    return <div></div>;
  }

  if (!publicKey) {
    return <Login />;
  }

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

        <label className="flex flex-col mt-4 mb-4">
          Description
          <textarea
            className="border border-gray-500 mt-2 rounded-sm py-1 px-2"
            placeholder="Some Cool Description"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
          />
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
