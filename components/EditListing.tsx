import { BN } from '@project-serum/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  fetchStrangemoodProgram,
  initListing,
  setListingDeposits,
} from '@strangemood/strangemood';
import { create } from 'ipfs-http-client';
import { useEffect, useState } from 'react';
import Login from '../components/Login';
import { grabValue, OpenMetaGraph } from '../lib/omg';
import { useAnchorProvider } from '../lib/useAnchor';
import cn from 'classnames';
import { useRouter } from 'next/router';
import { useSolPrice } from '../lib/useSolPrice';
import { CLUSTER } from '../lib/constants';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useListing } from '../lib/useListing';
import { useSWR } from '../lib/useSWR';

function useIpfs() {
  const client = create('https://ipfs.rebasefoundation.org/api/v0' as any);
  return client;
}

const LAMPORTS_PER_SOL = 1000000000;

export default function EditListing() {
  const ipfs = useIpfs();
  const { connection } = useConnection();

  const { publicKey, sendTransaction, connected, connecting } = useWallet();
  const provider = useAnchorProvider();
  const router = useRouter();

  const listing = useListing(provider, router.query.publicKey as string);

  const { data } = useSWR<OpenMetaGraph>(
    listing &&
      listing.uri &&
      `https://ipfs.io/ipfs/${((listing?.uri as string) || '').replace(
        'ipfs://',
        ''
      )}`
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [newVoteDeposit, setNewVoteDeposit] = useState<string | null>(null);
  const [newSolDeposit, setNewSolDeposit] = useState<string | null>(null);

  async function refresh() {
    console.log(data ? grabValue(data, 'title') : 'nul;');
    // These do not exist until after data is returned.
    setTitle(data ? grabValue(data, 'title') : '');
    setDescription(data ? grabValue(data, 'description') : '');
  }

  useEffect(() => {
    refresh();
    // wild... happens if we click it but not without ?
  }, [data]);

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

    ///
    const listingPublicKey = '';

    let tx = new Transaction();

    // send tx for things that have been modified, starting with deposit accts
    if (newVoteDeposit || newSolDeposit) {
      const vtAcct = newVoteDeposit
        ? new PublicKey(newVoteDeposit)
        : listing?.voteDeposit;

      const solAcct = newSolDeposit
        ? new PublicKey(newSolDeposit)
        : listing?.solDeposit;

      if (!vtAcct || !solAcct)
        throw new Error('Vote and Sol Deposit Accounts Needed');
      const { tx: listingTx } = await setListingDeposits(
        strangemood as any,
        publicKey,
        new PublicKey(listingPublicKey),
        vtAcct,
        solAcct
      );

      tx.add(listingTx);
    }

    let sig = await sendTransaction(tx, connection);
    await provider.connection.confirmTransaction(sig);
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
        <h1 className="font-bold text-xl">Update Listing</h1>
        <p></p>

        {title && (
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
        )}

        <label className="flex flex-col mt-4">
          Sharing Account (Sol Deposit Account). // TODO: need a button here to
          create affiliate.
          <input
            type={'text'}
            className="border border-gray-500 mt-2 rounded-sm py-1 px-2"
            placeholder="Public Key of Sharing Account"
            onChange={(e) => setNewSolDeposit(e.target.value)}
            value={newSolDeposit ?? ''}
          />
        </label>

        {description && (
          <label className="flex flex-col mt-4 mb-2">
            Description
            <textarea
              className="border border-gray-500 mt-2 rounded-sm py-1 px-2"
              placeholder="Some Cool Description"
              onChange={(e) => setDescription(e.target.value)}
              value={description}
            />
          </label>
        )}

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

        <button
          onClick={refresh}
          className="flex w-32 border-blue-400 text-blue-700 border rounded-sm items-center justify-center hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          refresh
        </button>
      </div>
    </div>
  );
}
