import { useWallet } from '@solana/wallet-adapter-react';
import {
  fetchStrangemoodProgram,
  Listing,
  MAINNET,
} from '@strangemood/strangemood';
import { useRouter } from 'next/router';
import { useAnchorProvider } from '../../lib/useAnchor';
import GameView from '../../components/GameView';
import { useListing } from '../../lib/useListing';

function Page() {
  const router = useRouter();
  const listingPubkey = router.query.pubkey;
  const provider = useAnchorProvider();
  const listing = useListing(provider, listingPubkey as string);

  if (!listing) return null;

  return <GameView publicKey={listingPubkey as any} listingAccount={listing} />;
}

export default Page;
