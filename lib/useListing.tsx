import { Program } from '@project-serum/anchor';
import { AccountInfo, PublicKey } from '@solana/web3.js';
import {
  fetchStrangemoodProgram,
  Listing,
  MAINNET,
  Strangemood,
} from '@strangemood/strangemood';
import { useEffect, useState } from 'react';
import { useAnchorProvider } from './useAnchor';

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

export function useListing(provider: any, pubkey: string) {
  const [listing, setListing] = useState<Listing>();

  useEffect(() => {
    async function load() {
      if (!provider) return;
      const strangemood = await fetchStrangemoodProgram(
        provider,
        MAINNET.STRANGEMOOD_PROGRAM_ID
      );

      const listing = await strangemood.account.listing.fetch(pubkey as string);
      setListing(listing);
    }
    load();
  }, [!!provider]);

  return listing;
}

export function useListings(): Array<{
  publicKey: PublicKey;
  account: Listing;
}> {
  const [state, setState] = useState<any>([]);
  const program = useStrangemoodProgram();

  useEffect(() => {
    if (!program) return;

    program.account.listing.all().then((listings) => {
      setState(listings);
    });
  }, [!!program]);

  return state;
}
