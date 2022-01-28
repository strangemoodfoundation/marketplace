import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  fetchStrangemoodProgram,
  Listing,
  purchase,
} from '@strangemood/strangemood';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { grabValue } from '../../lib/omg';
import { useAnchorProvider } from '../../lib/useAnchor';
import { useListing, useListingMetadata } from '../../lib/useListing';
import { useSolPrice } from '../../lib/useSolPrice';
import * as splToken from '@solana/spl-token';
import { BN } from '@project-serum/anchor';
import Login from '../../components/Login';
import classNames from 'classnames';

function ALink(props: { href: string; children: any }) {
  return (
    <Link href={props.href}>
      <a target={'_blank'} className="underline">
        {props.children}
      </a>
    </Link>
  );
}

function useRampLink(listing: Listing) {
  const { publicKey } = useWallet();

  if (!publicKey || !listing) return '';

  const priceInLamports = listing.price.toNumber();

  // Minimum RAMP purchase in lamports
  const MINIMUM_PURCHASE = 0.02480001 * 1000000000;
  const COVER_FEES = 0.00028288 * 1000000000; // about 50cents

  const lamports = Math.max(MINIMUM_PURCHASE, priceInLamports) + COVER_FEES;

  return `https://buy.ramp.network/?swapAsset=SOLANA_SOL&swapAmount=${lamports}&finalUrl=${encodeURIComponent(
    window.location.href
  )}&userAddress=${publicKey}`;
}

function useTokenBalance(mint: PublicKey) {
  const provider = useAnchorProvider();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    async function load() {
      if (!publicKey || !provider || !mint) return;

      let associatedTokenAccountAddress =
        await splToken.getAssociatedTokenAddress(mint, publicKey);

      try {
        const account = await provider.connection.getTokenAccountBalance(
          associatedTokenAccountAddress
        );
        setBalance(parseInt(account.value.amount || '0'));
      } catch {
        setBalance(0);
      }
    }

    load();
  }, [!!provider, !!publicKey]);

  return balance;
}

export default function Checkout() {
  const router = useRouter();
  const provider = useAnchorProvider();
  const listing = useListing(provider, router.query.pubkey as string);
  const { data } = useListingMetadata(listing);
  const { publicKey, sendTransaction } = useWallet();
  const solPrice = useSolPrice();
  const rampLink = useRampLink(listing as any);
  const [isLoading, setIsLoading] = useState(false);
  const listingTokenBalance = useTokenBalance(listing?.mint);

  async function onPurchase() {
    if (!publicKey) return;

    setIsLoading(true);
    const program = await fetchStrangemoodProgram(provider);

    const cashRequest = await fetch('/api/cash');
    if (cashRequest.status !== 200) {
      throw new Error(await cashRequest.text());
    }
    const { publicKey: cashier } = await cashRequest.json();

    const { tx, receipt } = await purchase({
      program,
      signer: new PublicKey(publicKey),
      cashier: new PublicKey(cashier),
      listing: {
        account: listing,
        publicKey: new PublicKey(router.query.pubkey as string),
      },
      quantity: new BN(1),
    });

    const sig = await sendTransaction(tx, provider.connection);
    await provider.connection.confirmTransaction(sig, 'finalized');
    console.log('receipt', receipt.toString());

    const result = await fetch('/api/cash/' + receipt.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (result.status !== 200) {
      throw new Error(`Failed to cash receipt: '${receipt.toString()}'`);
    }

    setIsLoading(false);
  }

  if (!data || !listing) {
    // loading
    return <div></div>;
  }

  if (!publicKey) {
    return <Login />;
  }

  const priceInSol = listing.price.toNumber() / 1000000000;
  const imageUri = grabValue(data, 'image');

  return (
    <div className="bg-blue-50 h-full px-4 w-full items-center justify-center flex flex-col sm:flex-row max-w-4xl sm:mx-auto my-auto gap-4 sm:gap-0">
      <div className="px-4 sm:flex-1 mx-auto">
        <h2 className="text-xl opacity-80 font-bold mb-4">FAQ</h2>
        <p className="opacity-80 mb-2">
          <b>What happens when I press that buy button?</b> You'll get a token
          in your wallet that represents that game. The person who setup the
          listing will get paid at{' '}
          <ALink href={`https://solscan.io/account/${listing.solDeposit}`}>
            this account.
          </ALink>
        </p>
        <p className="opacity-80 mb-1">
          <b>Is this a real game?</b> Possibly not! You may be purchasing an
          "empty" listing that doesn't have an application file associated with
          it.
        </p>

        <p className="opacity-80 mb-1">
          <b>
            Okay, say it <i>was</i> a real game, how does this work?
          </b>{' '}
          You'd download the game, and the game would have you scan a QR code
          with a mobile wallet (like the fabulous{' '}
          <ALink href="https://twitter.com/glowwallet">Glow Wallet</ALink>), and
          then the game unlocks itself.
        </p>
      </div>
      <div
        className={classNames({
          'flex sm:flex-1 flex-col mx-auto border bg-white px-4 py-4 mx-4':
            true,
          'opacity-50 animate-pulse cursor-wait': isLoading,
        })}
      >
        {listingTokenBalance > 0 && (
          <div className="bg-red-50 p-4 border border-red-400 text-sm mb-8">
            <p className="mb-1">
              <b>
                You've already purchased this listing ({listingTokenBalance})
                times.
              </b>{' '}
              The protocol supports purchasing the same listing multiple times,
              (useful for subscription-based games), so you can certainly
              purchase it again. If you're looking for this game, it's a token
              in your wallet with the address:{' '}
            </p>{' '}
            <p>
              <code>{listing?.mint.toString()}</code>
            </p>
          </div>
        )}

        <h2 className="mb-1 text-xl font-bold capitalize">
          {grabValue(data, 'title')}
        </h2>
        <p className="mb-1 opacity-50">{router.query.pubkey}</p>
        {imageUri && (
          <img
            className="mb-1 w-full"
            src={imageUri.replace('ipfs://', '/api/ipfs/')}
          ></img>
        )}
        <p className="mb-4 ">{grabValue(data, 'description')}</p>

        <button
          disabled={isLoading}
          onClick={() =>
            onPurchase().catch((err) => {
              throw err;
            })
          }
          className="bg-green-300 px-3 py-2 mt-4 border border-green-700 rounded-sm text-left w-full flex justify-between items-center disabled:cursor-wait"
        >
          <div>
            <div>Purchase Listing {listingTokenBalance > 0 && '(again!)'}</div>
            <div className="flex gap-1 items-center opacity-50 font-mono">
              <div className="text-sm ">{priceInSol.toFixed(4)} SOL</div>|
              <div className="text-sm">
                {(priceInSol * solPrice).toFixed(4)} USD
              </div>
            </div>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </button>

        <a href={rampLink}>
          <button
            className="mt-4 px-3 py-2 border border-gray-300 rounded-sm text-left w-full flex justify-between items-center"
            disabled={isLoading}
          >
            <div>
              <div>Don't have SOL? Buy some here with cash.</div>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </a>
      </div>
    </div>
  );
}
