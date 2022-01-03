import { Program } from '@project-serum/anchor';
import { AccountInfo, PublicKey } from '@solana/web3.js';
import {
  fetchStrangemoodProgram,
  Listing,
  MAINNET,
  Strangemood,
} from '@strangemood/strangemood';
import { useEffect, useState } from 'react';
import { OpenMetaGraph } from './omg';
import { useAnchorProvider } from './useAnchor';
import { useSWR } from './useSWR';

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

export function useListingMetadata(listing: any) {
  return useSWR<OpenMetaGraph>(
    listing &&
      listing.uri &&
      `https://ipfs.io/ipfs/${((listing?.uri as string) || '').replace(
        'ipfs://',
        ''
      )}`
  );
}

export function useListing(provider: any, pubkey: string): Listing {
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

  return listing as Listing;
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
      listings.forEach((l) => {
        fetch('/api/pin/' + l.publicKey.toString(), {
          method: 'POST',
        });
      });

      setState(listings);
    });
  }, [!!program]);

  return state;
}
