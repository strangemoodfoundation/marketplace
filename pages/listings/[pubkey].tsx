import { useWallet } from '@solana/wallet-adapter-react';
import {
  fetchStrangemoodProgram,
  Listing,
  MAINNET,
} from '@strangemood/strangemood';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { tob58 } from '../../lib/b58';
import { useAnchorProvider } from '../../lib/useAnchor';

function Page() {
  const router = useRouter();
  const listingPubkey = router.query.pubkey;
  const { publicKey, sendTransaction, signMessage } = useWallet();
  const provider = useAnchorProvider();
  const [listing, setListing] = useState<Listing>();

  useEffect(() => {
    async function load() {
      console.log('hello', listingPubkey);
      if (!provider) return;
      const strangemood = await fetchStrangemoodProgram(
        provider,
        MAINNET.STRANGEMOOD_PROGRAM_ID
      );

      const listing = await strangemood.account.listing.fetch(
        listingPubkey as string
      );
      setListing(listing);
    }
    load();
  }, [provider]);

  return (
    <div className="mx-auto max-w-2xl py-4">
      <div>{listingPubkey}</div>
      <pre>{JSON.stringify(listing, null, 2)}</pre>
    </div>
  );
}

export default Page;
