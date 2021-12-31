import { useSWR } from '../lib/useSWR';
import { OpenMetaGraph } from '../lib/omg';
import { useListing } from '../lib/useListing';
import { Listing } from '@strangemood/strangemood';
import { BN } from '@project-serum/anchor';
import { useSolPrice } from '../lib/useSolPrice';
import Link from 'next/link';

function grabValue(data: OpenMetaGraph, key: string): string {
  return (data.elements.find((e) => e.key === key) as any).value;
}

export default function GameView(props: {
  publicKey: string;
  listingAccount: Listing;
}) {
  const solPrice = useSolPrice();
  const listing = props.listingAccount;
  const { data } = useSWR<OpenMetaGraph>(
    listing &&
      listing.uri &&
      `https://ipfs.io/ipfs/${((listing?.uri as string) || '').replace(
        'ipfs://',
        ''
      )}`
  );

  if (!listing || !listing.uri || !data) return null;

  if (!data) {
    return <div className="mx-auto max-w-2xl py-4 animate-pulse h-24"></div>;
  }

  const priceInSol = listing.price.toNumber() / 1000000;

  return (
    <div className="mx-auto max-w-2xl border-gray-200 border mb-4 p-4">
      <h1 className="text-lg font-bold capitalize">
        {grabValue(data, 'title')}
      </h1>
      <Link href={`https://solscan.io/account/${props.publicKey}`}>
        <a
          target={'_blank'}
          className="opacity-50 inline-flex mb-2 text-sm font-mono underline"
        >
          {props.publicKey}
        </a>
      </Link>
      <p className="">{grabValue(data, 'description').trim()}</p>
      <button className="bg-green-300 mt-4 border border-green-700 rounded-sm text-left w-full flex justify-between items-center">
        <div>
          <div>Purchase Listing</div>
          <div className="flex gap-1 items-center opacity-50 font-mono">
            <div className="text-sm ">{priceInSol.toFixed(4)} SOL</div>|
            <div className="text-sm">
              {(priceInSol * solPrice).toFixed(4)} USD
            </div>
          </div>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-green-800"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      </button>
    </div>
  );
}
