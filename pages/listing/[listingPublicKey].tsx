import {
  fetchStrangemoodProgram,
  Strangemood,
  purchaseListing,
} from '@strangemood/strangemood';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useAnchorProvider } from '../../lib/useAnchor';
import {
  WalletMultiButton,
  WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';
import { Program } from '@project-serum/anchor';
import { useRouter } from 'next/router';
import ErrorPage from 'next/error';
import { CLUSTER } from '../../lib/constants';

function useStrangemoodProgram() {
  const provider = useAnchorProvider();
  const [program, setProgram] = useState<Program<Strangemood>>();

  useEffect(() => {
    fetchStrangemoodProgram(provider).then((program) =>
      setProgram(program as any)
    );
  }, []);

  return program;
}

type Listing = Awaited<
  ReturnType<Program<Strangemood>['account']['listing']['fetch']>
>;

function useListing(listingPublicKey: string): Listing | null {
  const [state, setState] = useState<any>();
  const program = useStrangemoodProgram();
  const router = useRouter();

  useEffect(() => {
    if (!program) return;

    program.account.listing
      .fetch(listingPublicKey)
      .then((listing) => {
        console.log('Found listing');
        console.log(listing);
        setState(listing);
      })
      .catch(() => {
        setState(null);
      });
  }, [!!program, router]);

  return state;
}

export default function Page() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [signature, setSignature] = useState<string>();
  const provider = useAnchorProvider();
  const { listingPublicKey } = useRouter().query;
  const listing = useListing(listingPublicKey as string);
  const listingMetaData = {
    title: 'XCOM',
  };

  async function onPurchaseListing(account: Listing) {
    if (!publicKey || !listingPublicKey) {
      return;
    }

    const strangemood = await fetchStrangemoodProgram(
      provider,
      CLUSTER.STRANGEMOOD_PROGRAM_ID
    );

    const { tx, signers } = await purchaseListing(
      strangemood as any,
      connection,
      publicKey,
      {
        publicKey: new PublicKey(listingPublicKey as string),
        account: account,
      },
      CLUSTER
    );

    const sig = await sendTransaction(tx, connection, { signers });
    setSignature(sig);
  }

  if (listing !== undefined && !listing) {
    // checking undefined on purpose, null means listing not found
    return <ErrorPage statusCode={404} />;
  } else if (!listing) {
    return 'Loading...'; // TODO: replace this with a loading div
  } else if (!listing.isAvailable && listing.isInitialized) {
    return 'This listing is not available';
  } else {
    return (
      <div className="w-full h-full bg-blue-50">
        <div
          className={'m-auto h-full p-4 max-w-2xl bg-white border-l border-r'}
        >
          <div className="max-w-2xl mx-auto flex flex-col content-center p-5">
            <h1 className="text-2xl font-bold mb-2">Strangemood</h1>
            <h1 className="font-bold text-3xl">{listingMetaData.title}</h1>
            <h2 className="text-xl">Price (SOL): {listing.price.toString()}</h2>
            <h2 className="font-bold text-2xl">Purchase</h2>
            <h3 className="text-xl text-left">1. Connect wallet</h3>
            <p>Connect to supproted solana wallets.</p>
            <div className="w-1/4">
              {!publicKey && <WalletMultiButton />}
              {publicKey && <WalletDisconnectButton />}
            </div>
            <h3 className="text-xl text-left">2. Sign transaction</h3>
            <p>
              Purchase {listingMetaData.title} for {listing.price.toString()}{' '}
              SOL
            </p>
            <button
              className="border hover:bg-blue-700 w-1/4 bg-blue-500 text-white font-bold rounded-lg"
              onClick={() => onPurchaseListing(listing)}
            >
              Purchase
            </button>
            <h3 className="text-xl text-left">3. Confirm transaction</h3>
            <div>Transaction sig: {signature}</div>
          </div>
        </div>
      </div>
    );
  }
}
