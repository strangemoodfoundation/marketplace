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
import { CLUSTER } from '../lib/constants';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useListing } from '../lib/useListing';
import { useSWR } from '../lib/useSWR';
import { useSharingAccount } from '../lib/useSharingAccount';

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
  const { getSharingAccount } = useSharingAccount();

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
  const [newSolDepositSplit, setNewSolDepositSplit] = useState<number | null>(
    null
  );

  async function onLoad() {
    setTitle(data ? grabValue(data, 'title') : '');
    setDescription(data ? grabValue(data, 'description') : '');
  }

  useEffect(() => {
    onLoad();
  }, [data]);

  useEffect(() => {
    console.log('Getting sharing accounts!');
    if (listing?.solDeposit)
      getSharingAccount(
        listing.solDeposit,
        new PublicKey(router.query.publicKey as string)
      )
        .then((sharingAccount) => {
          console.log({ sharingAccount });
          setNewSolDepositSplit(sharingAccount.splitPercent);
        })
        .catch((err) => {
          console.log('no sharing acct exists');
        });
  }, [listing?.solDeposit]);

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

    fetch(
      'https://demo.strangemood.org/api/pin/' +
        (router.query.publicKey as string) +
        '?cluster=testnet',
      {
        method: 'POST',
      }
    );

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
          Affiliate Percentage
          <div className="flex flex-row items-center rounded-sm bg-gray-50  border">
            <input
              type={'number'}
              className=" px-2 py-2 rounded-sm flex flex-1"
              placeholder="0.01"
              onChange={(e) =>
                setNewSolDepositSplit(parseFloat(e.target.value ?? 0))
              }
              value={newSolDepositSplit ?? 0}
              disabled={newSolDepositSplit === null}
            />
            <div className="bg-gray-50 px-2 text-gray-500">%</div>
          </div>
        </label>

        <br />

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
