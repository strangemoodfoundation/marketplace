import { useWallet } from '@solana/wallet-adapter-react';
import {
  fetchStrangemoodProgram,
  Listing,
  MAINNET,
} from '@strangemood/strangemood';
import { useRouter } from 'next/router';
import { useAnchorProvider } from '../../lib/useAnchor';
import GameView from '../../components/GameView';

function Page() {
  const router = useRouter();
  const listingPubkey = router.query.pubkey;
  const provider = useAnchorProvider();

  return <GameView publicKey={listingPubkey as any} provider={provider} />;
}

export default Page;
