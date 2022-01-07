import { useSWR } from '../lib/useSWR';
import { grabValue, OpenMetaGraph } from '../lib/omg';
import { Listing } from '@strangemood/strangemood';
import { useSolPrice } from '../lib/useSolPrice';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowIcon } from '../icons/ArrowIcon';
import { EditIcon } from '../icons/EditIcon';

export default function GameView(props: {
  publicKey: string;
  listingAccount: Listing;
}) {
  const wallet = useWallet();
  const solPrice = useSolPrice();
  const listing = props.listingAccount;
  const { data } = useSWR<OpenMetaGraph>(
    listing &&
      listing.uri &&
      `/api/ipfs/${((listing?.uri as string) || '').replace(
        'ipfs://',
        ''
      )}`
  );

  // if (!listing || !listing.uri || !data) return null;

  // if (!data) {
  //   return <div className="mx-auto max-w-2xl py-4 animate-pulse h-24"></div>;
  // }

  const priceInSol = listing.price.toNumber() / 1000000000;

  return (
    <div className="mx-auto max-w-2xl border-gray-200 border mb-4 p-4">
      {listing.authority.toString() === wallet.publicKey?.toString() && (
        <Link href={`/edit/${props.publicKey}`}>
          <button className="mt-4 border border-gray-700 rounded-sm text-left flex justify-right float-right items-center px-3 py-2">
            <EditIcon className="h-5 w-5 text-gray-800" />
          </button>
        </Link>
      )}
      <h1 className="text-lg font-bold capitalize">
        {data ? grabValue(data, 'title') : 'Title'}
      </h1>
      <Link href={`https://solscan.io/account/${props.publicKey}`}>
        <a
          target={'_blank'}
          className="opacity-50 inline-flex mb-2 text-sm font-mono underline"
        >
          {props.publicKey}
        </a>
      </Link>
      <p className="">
        {data ? grabValue(data, 'description').trim() : 'Description'}
      </p>
      <Link href={`/checkout/${props.publicKey}`}>
        <button className="bg-green-300 mt-4 border border-green-700 rounded-sm text-left w-full flex justify-between items-center px-3 py-2">
          <div>
            <div>Purchase Listing</div>
            <div className="flex gap-1 items-center opacity-50 font-mono">
              <div className="text-sm ">{priceInSol.toFixed(4)} SOL</div>|
              <div className="text-sm">
                {(priceInSol * solPrice).toFixed(4)} USD
              </div>
            </div>
          </div>
          <ArrowIcon className="h-5 w-5 text-green-800" />
        </button>
      </Link>
    </div>
  );
}
