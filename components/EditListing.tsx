import { BN } from '@project-serum/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { fetchStrangemoodProgram, initListing } from '@strangemood/strangemood';
import { create } from 'ipfs-http-client';
import { useState } from 'react';
import Login from '../components/Login';
import { OpenMetaGraph } from '../lib/omg';
import { useAnchorProvider } from '../lib/useAnchor';
import cn from 'classnames';
import { useRouter } from 'next/router';
import { useSolPrice } from '../lib/useSolPrice';
import { CLUSTER } from '../lib/constants';

function useIpfs() {
  const client = create('https://ipfs.rebasefoundation.org/api/v0' as any);
  return client;
}

const LAMPORTS_PER_SOL = 1000000000;

export default function EditListing() {
  const ipfs = useIpfs();
  const { connection } = useConnection();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { publicKey, sendTransaction, connected, connecting } = useWallet();
  const provider = useAnchorProvider();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSave() {
    if (!publicKey) return;
    if (!title || !description) return;

    setIsLoading(true);
    const strangemood = await fetchStrangemoodProgram(
      provider,
      CLUSTER.STRANGEMOOD_PROGRAM_ID
    );

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

    fetch('https://ipfs.io/ipfs/' + cid);
  }

  const [fileUrl, updateFileUrl] = useState(``);

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
